import { AudioProperties } from "../../core/AudioProperties";
import { File } from "../../core/File";
import { ReadStyle, Tag } from "../../types";
import { ByteVector } from "../../utils/ByteVector";
import { ID3v2Tag } from "./ID3v2Tag";

export class MPEGProperties extends AudioProperties {
  private _length: number = 0;
  private _bitrate: number = 0;
  private _sampleRate: number = 0;
  private _channels: number = 0;
  private _version: number = 0;
  private _layer: number = 0;

  constructor(data: ByteVector, streamLength: number, style: ReadStyle = ReadStyle.Average) {
    super(style);
    this.read(data, streamLength);
  }

  private read(data: ByteVector, streamLength: number): void {
    // Find first MPEG frame
    const frameHeader = this.findMPEGFrame(data);
    if (!frameHeader) return;

    this.parseFrameHeader(frameHeader);
    
    if (this._bitrate > 0) {
      // Calculate duration in seconds directly
      this._length = Math.round((streamLength * 8) / (this._bitrate * 1000));
    }
  }

  private findMPEGFrame(data: ByteVector): number | null {
    for (let i = 0; i < data.size() - 4; i++) {
      if (data.at(i) === 0xFF && (data.at(i + 1) & 0xE0) === 0xE0) {
        return data.toUInt(i) & 0xFFFFFF00;
      }
    }
    return null;
  }

  private parseFrameHeader(header: number): void {
    // MPEG Audio frame header parsing
    const versionBits = (header >> 19) & 0x3;
    const layerBits = (header >> 17) & 0x3;
    const bitrateBits = (header >> 12) & 0xF;
    const sampleRateBits = (header >> 10) & 0x3;
    const channelBits = (header >> 6) & 0x3;

    // Version mapping
    const versionMap = [2.5, 0, 2, 1];
    this._version = versionMap[versionBits];

    // Layer mapping
    this._layer = 4 - layerBits;

    // Sample rate mapping
    const sampleRates = [
      [11025, 12000, 8000],   // MPEG 2.5
      [0, 0, 0],              // reserved
      [22050, 24000, 16000],  // MPEG 2
      [44100, 48000, 32000]   // MPEG 1
    ];
    this._sampleRate = sampleRates[versionBits][sampleRateBits];

    // Bitrate mapping
    const bitrateTable = this.getBitrateTable(this._version, this._layer);
    this._bitrate = bitrateTable[bitrateBits];

    // Channel mode
    this._channels = channelBits === 3 ? 1 : 2;
  }

  private getBitrateTable(version: number, layer: number): number[] {
    // Simplified bitrate table for MPEG-1 Layer 3
    if (version === 1 && layer === 3) {
      return [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
    }
    // Add more tables as needed
    return [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0];
  }

  lengthInSeconds(): number {
    return this._length;
  }

  bitrate(): number {
    return this._bitrate;
  }

  sampleRate(): number {
    return this._sampleRate;
  }

  channels(): number {
    return this._channels;
  }

  version(): number {
    return this._version;
  }

  layer(): number {
    return this._layer;
  }
}

export class MPEGFile extends File {
  private _tag: ID3v2Tag | null = null;
  private _properties: MPEGProperties | null = null;
  private id3v2Location: number = -1;
  private id3v2Size: number = 0;

  constructor(name: string, data: Uint8Array, readProperties: boolean = true) {
    super(name, data);
    this.read(readProperties);
  }

  static isSupported(data: Uint8Array): boolean {
    const header = new ByteVector(data.slice(0, 10));
    
    // Check for ID3v2 tag
    if (header.startsWith('ID3')) return true;
    
    // Check for MPEG sync
    for (let i = 0; i < Math.min(data.length - 1, 8192); i++) {
      if (data[i] === 0xFF && (data[i + 1] & 0xE0) === 0xE0) {
        return true;
      }
    }
    
    return false;
  }

  private read(readProperties: boolean): void {
    // Look for ID3v2 tag
    const header = new ByteVector(this._data.slice(0, 10));
    
    if (header.startsWith('ID3')) {
      try {
        const id3Header = new ByteVector(this._data.slice(0, 10));
        this.id3v2Size = this.synchsafeIntToUInt(id3Header.mid(6, 4)) + 10;
        this.id3v2Location = 0;
        
        const tagData = new ByteVector(this._data.slice(0, this.id3v2Size));
        this._tag = new ID3v2Tag(tagData);
      } catch (error) {
        console.error('Error reading ID3v2 tag:', error);
      }
    }

    if (readProperties) {
      const audioStart = this.id3v2Size > 0 ? this.id3v2Size : 0;
      const audioData = new ByteVector(this._data.slice(audioStart));
      const streamLength = this._data.length - audioStart;
      
      this._properties = new MPEGProperties(audioData, streamLength);
    }

    this._valid = true;
  }

  private synchsafeIntToUInt(data: ByteVector): number {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      value = (value << 7) | (data.at(i) & 0x7F);
    }
    return value;
  }

  tag(): Tag | null {
    return this._tag;
  }

  audioProperties(): AudioProperties | null {
    return this._properties;
  }

  save(): boolean {
    if (!this._tag) return false;

    try {
      const renderedTag = (this._tag as ID3v2Tag).render();
      const audioStart = this.id3v2Size > 0 ? this.id3v2Size : 0;
      const audioData = this._data.slice(audioStart);
      
      // Create new file data
      const newData = new Uint8Array(renderedTag.size() + audioData.length);
      newData.set(renderedTag.toByteArray(), 0);
      newData.set(audioData, renderedTag.size());
      
      this._data = newData;
      this.id3v2Size = renderedTag.size();
      
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }
}