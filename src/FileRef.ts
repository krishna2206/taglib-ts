// src/FileRef.ts
import { MPEGFile } from './formats/mp3/MPEGFile';
import { AudioFile, ReadStyle } from './types';

export class FileRef {
  private _file: AudioFile | null = null;

  constructor(
    data: Uint8Array,
    name: string = '',
    readAudioProperties: boolean = true, 
    audioPropertiesStyle: ReadStyle = ReadStyle.Average
  ) {
    this.parse(data, name, readAudioProperties, audioPropertiesStyle);
  }

  static create(data: Uint8Array, name: string = ''): FileRef {
    return new FileRef(data, name);
  }

  private parse(
    data: Uint8Array,
    name: string,
    readAudioProperties: boolean, 
    audioPropertiesStyle: ReadStyle
  ): void {
    // Try to detect file type by content
    this._file = this.detectByContent(data, name, readAudioProperties, audioPropertiesStyle);
    
    if (!this._file) {
      // Try to detect by extension
      this._file = this.detectByExtension(data, name, readAudioProperties, audioPropertiesStyle);
    }
  }

  private detectByContent(
    data: Uint8Array,
    name: string,
    readAudioProperties: boolean, 
    audioPropertiesStyle: ReadStyle
  ): AudioFile | null {
    // MPEG (MP3)
    if (MPEGFile.isSupported(data)) {
      return new MPEGFile(name, data, readAudioProperties);
    }

    // Add more format detectors here
    
    return null;
  }

  private detectByExtension(
    data: Uint8Array,
    name: string,
    readAudioProperties: boolean, 
    audioPropertiesStyle: ReadStyle
  ): AudioFile | null {
    const ext = this.getFileExtension(name).toUpperCase();
    
    switch (ext) {
      case 'MP3':
      case 'MP2':
        return new MPEGFile(name, data, readAudioProperties);
      // Add more extensions
      default:
        return null;
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot + 1);
  }

  file(): AudioFile | null {
    return this._file;
  }

  data(): Uint8Array | null {
    return this._file?.data() || null;
  }

  length(): number {
    return this._file?.length() || 0;
  }

  name(): string {
    return this._file?.name() || '';
  }

  tag(): any {
    return this._file?.tag() || null;
  }

  audioProperties(): any {
    return this._file?.audioProperties() || null;
  }

  save(): boolean {
    return this._file?.save() || false;
  }

  isNull(): boolean {
    return this._file === null;
  }

  isValid(): boolean {
    return this._file?.isValid() || false;
  }
}