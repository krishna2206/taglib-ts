import { ByteVector } from "../../../utils/ByteVector";
import { ID3v2Frame } from "./ID3v2Frame";

export class ID3v2TextFrame extends ID3v2Frame {
  private textEncoding: number = 0;
  private text: string = '';

  constructor(frameId: string, data: ByteVector) {
    super(frameId, data);
    this.parse();
  }

  private parse(): void {
    if (this.data.isEmpty()) {
      this.textEncoding = 0;
      this.text = '';
      return;
    }

    this.textEncoding = this.data.at(0);
    const textData = this.data.mid(1);
    
    try {
      // Handle different text encodings
      switch (this.textEncoding) {
        case 0: // ISO-8859-1 (Latin-1)
          this.text = this.decodeLatin1(textData);
          break;
        case 1: // UTF-16 with BOM
          this.text = this.decodeUTF16WithBOM(textData);
          break;
        case 2: // UTF-16BE (no BOM)
          this.text = this.decodeUTF16BE(textData);
          break;
        case 3: // UTF-8
          this.text = this.decodeUTF8(textData);
          break;
        default:
          // Fallback to UTF-8
          this.text = this.decodeUTF8(textData);
      }
    } catch (error) {
      console.warn(`Error decoding text frame ${this.frameId}:`, error);
      // Ultimate fallback - try to decode as Latin-1
      this.text = this.decodeLatin1(textData);
    }

    // Remove null terminators
    this.text = this.text.replace(/\0+$/, '');
  }

  private decodeLatin1(data: ByteVector): string {
    const bytes = data.toByteArray();
    return Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  }

  private decodeUTF8(data: ByteVector): string {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(data.toByteArray());
    } catch (error) {
      // Fallback to manual UTF-8 decoding
      return this.manualUTF8Decode(data.toByteArray());
    }
  }

  private decodeUTF16WithBOM(data: ByteVector): string {
    const bytes = data.toByteArray();
    if (bytes.length < 2) return '';

    // Check for BOM
    let littleEndian = true;
    let offset = 0;

    if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
      // UTF-16LE BOM
      littleEndian = true;
      offset = 2;
    } else if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
      // UTF-16BE BOM
      littleEndian = false;
      offset = 2;
    } else {
      // No BOM, assume little endian
      littleEndian = true;
      offset = 0;
    }

    return this.decodeUTF16(bytes.slice(offset), littleEndian);
  }

  private decodeUTF16BE(data: ByteVector): string {
    return this.decodeUTF16(data.toByteArray(), false);
  }

  private decodeUTF16(bytes: Uint8Array, littleEndian: boolean): string {
    try {
      const encoding = littleEndian ? 'utf-16le' : 'utf-16be';
      return new TextDecoder(encoding, { fatal: true }).decode(bytes);
    } catch (error) {
      // Manual UTF-16 decoding
      return this.manualUTF16Decode(bytes, littleEndian);
    }
  }

  private manualUTF8Decode(bytes: Uint8Array): string {
    let result = '';
    let i = 0;

    while (i < bytes.length) {
      let codePoint = 0;
      let byte1 = bytes[i++];

      if (byte1 < 0x80) {
        // 1-byte character
        codePoint = byte1;
      } else if ((byte1 & 0xE0) === 0xC0) {
        // 2-byte character
        if (i >= bytes.length) break;
        let byte2 = bytes[i++];
        codePoint = ((byte1 & 0x1F) << 6) | (byte2 & 0x3F);
      } else if ((byte1 & 0xF0) === 0xE0) {
        // 3-byte character
        if (i + 1 >= bytes.length) break;
        let byte2 = bytes[i++];
        let byte3 = bytes[i++];
        codePoint = ((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F);
      } else if ((byte1 & 0xF8) === 0xF0) {
        // 4-byte character
        if (i + 2 >= bytes.length) break;
        let byte2 = bytes[i++];
        let byte3 = bytes[i++];
        let byte4 = bytes[i++];
        codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) | 
                   ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
      } else {
        // Invalid UTF-8, skip byte
        continue;
      }

      result += String.fromCodePoint(codePoint);
    }

    return result;
  }

  private manualUTF16Decode(bytes: Uint8Array, littleEndian: boolean): string {
    let result = '';
    
    for (let i = 0; i < bytes.length - 1; i += 2) {
      let codeUnit: number;
      if (littleEndian) {
        codeUnit = bytes[i] | (bytes[i + 1] << 8);
      } else {
        codeUnit = (bytes[i] << 8) | bytes[i + 1];
      }
      
      // Handle surrogate pairs
      if (codeUnit >= 0xD800 && codeUnit <= 0xDBFF && i + 3 < bytes.length) {
        // High surrogate
        let lowSurrogate: number;
        if (littleEndian) {
          lowSurrogate = bytes[i + 2] | (bytes[i + 3] << 8);
        } else {
          lowSurrogate = (bytes[i + 2] << 8) | bytes[i + 3];
        }
        
        if (lowSurrogate >= 0xDC00 && lowSurrogate <= 0xDFFF) {
          const codePoint = 0x10000 + ((codeUnit & 0x3FF) << 10) + (lowSurrogate & 0x3FF);
          result += String.fromCodePoint(codePoint);
          i += 2; // Skip the low surrogate
          continue;
        }
      }
      
      result += String.fromCharCode(codeUnit);
    }
    
    return result;
  }

  toString(): string {
    return this.text;
  }

  setText(text: string): void {
    this.text = text;
    this.textEncoding = 3; // Use UTF-8 for new text
  }

  render(): ByteVector {
    const result = new ByteVector([this.textEncoding]);
    const textData = ByteVector.fromString(this.text, 'utf-8');
    result.append(textData);
    return result;
  }
}