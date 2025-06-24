import { Tag } from "../../core/Tag";
import { Picture, PropertyMap } from "../../types";
import { ByteVector } from "../../utils/ByteVector";
import { ID3v2AttachedPictureFrame } from "./frames/ID3v2AttachedPictureFrame";
import { ID3v2Frame } from "./frames/ID3v2Frame";
import { ID3v2TextFrame } from "./frames/ID3v2TextFrame";

export class ID3v2Header {
  private majorVersion: number;
  private revisionNumber: number;
  private flags: number;
  private tagSize: number;

  constructor(data: ByteVector) {
    if (data.size() < 10 || !data.startsWith('ID3')) {
      throw new Error('Invalid ID3v2 header');
    }

    this.majorVersion = data.at(3);
    this.revisionNumber = data.at(4);
    this.flags = data.at(5);
    this.tagSize = this.synchsafeIntToUInt(data.mid(6, 4));
  }

  version(): number { return this.majorVersion; }
  revision(): number { return this.revisionNumber; }
  size(): number { return this.tagSize; }
  completeTagSize(): number { return this.tagSize + 10; }

  private synchsafeIntToUInt(data: ByteVector): number {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      value = (value << 7) | (data.at(i) & 0x7F);
    }
    return value;
  }
}

export class ID3v2Tag extends Tag {
  private header: ID3v2Header | null = null;
  private frames: Map<string, ID3v2Frame[]> = new Map();

  constructor(data?: ByteVector) {
    super();
    if (data) {
      this.read(data);
    }
  }

  private read(data: ByteVector): void {
    try {
      this.header = new ID3v2Header(data.mid(0, 10));
      this.parseFrames(data.mid(10, this.header.size()));
    } catch (error) {
      console.error('Error reading ID3v2 tag:', error);
    }
  }

  private parseFrames(data: ByteVector): void {
    let offset = 0;
    const version = this.header?.version() || 4;

    while (offset + 10 < data.size()) {
      try {
        // Frame header
        const frameId = data.mid(offset, 4).toString('latin1');
        if (frameId[0] === '\0' || !/^[A-Z0-9]{4}$/.test(frameId)) break; // Padding or invalid

        let frameSize: number;
        if (version >= 4) {
          frameSize = this.synchsafeIntToUInt(data.mid(offset + 4, 4));
        } else {
          frameSize = data.toUInt(offset + 4);
        }

        // Validate frame size
        if (frameSize === 0 || frameSize > data.size() - offset - 10) {
          console.warn(`Invalid frame size for ${frameId}: ${frameSize}`);
          break;
        }

        offset += 10;

        const frameData = data.mid(offset, frameSize);
        const frame = this.createFrame(frameId, frameData);
        
        if (frame) {
          if (!this.frames.has(frameId)) {
            this.frames.set(frameId, []);
          }
          this.frames.get(frameId)!.push(frame);
        }

        offset += frameSize;
      } catch (error) {
        console.error(`Error parsing frame at offset ${offset}:`, error);
        break;
      }
    }

    this.populateTagFields();
  }

  private createFrame(frameId: string, data: ByteVector): ID3v2Frame | null {
    if (frameId.startsWith('T') && frameId !== 'TXXX') {
      return new ID3v2TextFrame(frameId, data);
    } else if (frameId === 'APIC') {
      return new ID3v2AttachedPictureFrame(data);
    }
    // Add more frame types as needed
    return null;
  }

  private populateTagFields(): void {
    this._title = this.getTextFrame('TIT2');
    this._artist = this.getTextFrame('TPE1');
    this._album = this.getTextFrame('TALB');
    this._comment = this.getTextFrame('COMM');
    this._genre = this.getTextFrame('TCON');
    
    // Handle year - try multiple frame types
    const yearStr = this.getTextFrame('TDRC') || 
                    this.getTextFrame('TYER') || 
                    this.getTextFrame('TDAT');
    
    if (yearStr) {
      // Extract year from various date formats
      const yearMatch = yearStr.match(/(\d{4})/);
      this._year = yearMatch ? parseInt(yearMatch[1], 10) : 0;
    } else {
      this._year = 0;
    }
    
    // Handle track number
    const trackStr = this.getTextFrame('TRCK');
    if (trackStr) {
      // Handle formats like "1", "1/12", "01", etc.
      const trackMatch = trackStr.match(/(\d+)/);
      this._track = trackMatch ? parseInt(trackMatch[1], 10) : 0;
    } else {
      this._track = 0;
    }
  }

  private getTextFrame(frameId: string): string {
    const frames = this.frames.get(frameId);
    return frames && frames.length > 0 ? frames[0].toString() : '';
  }

  private synchsafeIntToUInt(data: ByteVector): number {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      value = (value << 7) | (data.at(i) & 0x7F);
    }
    return value;
  }

  pictures(): Picture[] {
    const apicFrames = this.frames.get('APIC') || [];
    return apicFrames
      .filter(frame => frame instanceof ID3v2AttachedPictureFrame)
      .map(frame => (frame as ID3v2AttachedPictureFrame).picture());
  }

  properties(): PropertyMap {
    const props: PropertyMap = {};
    
    this.frames.forEach((frameList, frameId) => {
      frameList.forEach(frame => {
        props[frameId] = frame.toString();
      });
    });
    
    return props;
  }

  setProperties(properties: PropertyMap): void {
    // Implementation for setting properties
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.setTextFrame(key, value);
      }
    });
  }

  private setTextFrame(frameId: string, text: string): void {
    const frameData = new ByteVector([3]); // UTF-8 encoding
    frameData.append(ByteVector.fromString(text, 'utf-8'));
    const frame = new ID3v2TextFrame(frameId, frameData);
    
    this.frames.set(frameId, [frame]);
    this.populateTagFields();
  }

  render(): ByteVector {
    // Implementation for rendering the tag back to bytes
    const frameData = new ByteVector();
    
    this.frames.forEach((frameList) => {
      frameList.forEach(frame => {
        const renderedFrame = frame.render();
        const header = new ByteVector();
        header.append(ByteVector.fromString(frame.id(), 'latin1'));
        header.append(ByteVector.fromUInt(renderedFrame.size()));
        header.append(ByteVector.fromShort(0)); // flags
        
        frameData.append(header);
        frameData.append(renderedFrame);
      });
    });

    // Add ID3v2 header
    const result = new ByteVector();
    result.append(ByteVector.fromString('ID3', 'latin1'));
    result.append(new ByteVector([4, 0])); // version 2.4.0
    result.append(new ByteVector([0])); // flags
    result.append(this.uIntToSynchsafeBytes(frameData.size()));
    result.append(frameData);
    
    return result;
  }

  private uIntToSynchsafeBytes(value: number): ByteVector {
    const bytes: number[] = [];
    for (let i = 3; i >= 0; i--) {
      bytes.push((value >> (i * 7)) & 0x7F);
    }
    return new ByteVector(bytes);
  }

  // Override the base class setters to update both fields and frames
  setTitle(title: string): void {
    this._title = title;
    this.setTextFrame('TIT2', title);
  }

  setArtist(artist: string): void {
    this._artist = artist;
    this.setTextFrame('TPE1', artist);
  }

  setAlbum(album: string): void {
    this._album = album;
    this.setTextFrame('TALB', album);
  }

  setYear(year: number): void {
    this._year = year;
    this.setTextFrame('TDRC', year.toString());
  }

  setTrack(track: number): void {
    this._track = track;
    this.setTextFrame('TRCK', track.toString());
  }

  setGenre(genre: string): void {
    this._genre = genre;
    this.setTextFrame('TCON', genre);
  }

  setComment(comment: string): void {
    this._comment = comment;
    this.setTextFrame('COMM', comment);
  }
}