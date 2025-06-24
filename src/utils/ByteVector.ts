export class ByteVector {
  private data: Uint8Array;

  constructor(data?: Uint8Array | number[]) {
    if (data instanceof Uint8Array) {
      this.data = new Uint8Array(data);
    } else if (Array.isArray(data)) {
      this.data = new Uint8Array(data);
    } else {
      this.data = new Uint8Array(0);
    }
  }

  static fromString(str: string, encoding: string = 'utf-8'): ByteVector {
    let bytes: Uint8Array;
    
    switch (encoding.toLowerCase()) {
      case 'latin1':
      case 'iso-8859-1':
        bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
          bytes[i] = str.charCodeAt(i) & 0xFF;
        }
        break;
      case 'utf-16':
      case 'utf-16le':
        // Add BOM for UTF-16LE
        const utf16Buffer = new ArrayBuffer((str.length * 2) + 2);
        const utf16View = new DataView(utf16Buffer);
        utf16View.setUint16(0, 0xFFFE, true); // BOM
        for (let i = 0; i < str.length; i++) {
          utf16View.setUint16((i + 1) * 2, str.charCodeAt(i), true);
        }
        bytes = new Uint8Array(utf16Buffer);
        break;
      case 'utf-16be':
        const utf16beBuffer = new ArrayBuffer(str.length * 2);
        const utf16beView = new DataView(utf16beBuffer);
        for (let i = 0; i < str.length; i++) {
          utf16beView.setUint16(i * 2, str.charCodeAt(i), false);
        }
        bytes = new Uint8Array(utf16beBuffer);
        break;
      default: // utf-8
        bytes = new TextEncoder().encode(str);
    }
    
    return new ByteVector(bytes);
  }

  static fromUInt(value: number, bigEndian: boolean = true): ByteVector {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, !bigEndian);
    return new ByteVector(new Uint8Array(buffer));
  }

  static fromShort(value: number, bigEndian: boolean = true): ByteVector {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0, value, !bigEndian);
    return new ByteVector(new Uint8Array(buffer));
  }

  size(): number {
    return this.data.length;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  at(index: number): number {
    return this.data[index] || 0;
  }

  mid(position: number, length?: number): ByteVector {
    const end = length !== undefined ? position + length : this.data.length;
    return new ByteVector(this.data.slice(position, end));
  }

  startsWith(pattern: string | ByteVector | Uint8Array): boolean {
    let compareData: Uint8Array;
    
    if (typeof pattern === 'string') {
      compareData = new TextEncoder().encode(pattern);
    } else if (pattern instanceof ByteVector) {
      compareData = pattern.data;
    } else {
      compareData = pattern;
    }

    if (compareData.length > this.data.length) return false;
    
    for (let i = 0; i < compareData.length; i++) {
      if (this.data[i] !== compareData[i]) return false;
    }
    
    return true;
  }

  containsAt(pattern: string | ByteVector, offset: number): boolean {
    let compareData: Uint8Array;
    
    if (typeof pattern === 'string') {
      compareData = new TextEncoder().encode(pattern);
    } else {
      compareData = pattern.data;
    }

    if (offset + compareData.length > this.data.length) return false;
    
    for (let i = 0; i < compareData.length; i++) {
      if (this.data[offset + i] !== compareData[i]) return false;
    }
    
    return true;
  }

  toUInt(offset: number = 0, bigEndian: boolean = true): number {
    if (offset + 4 > this.data.length) return 0;
    const view = new DataView(this.data.buffer, this.data.byteOffset + offset, 4);
    return view.getUint32(0, !bigEndian);
  }

  toShort(offset: number = 0, bigEndian: boolean = true): number {
    if (offset + 2 > this.data.length) return 0;
    const view = new DataView(this.data.buffer, this.data.byteOffset + offset, 2);
    return view.getUint16(0, !bigEndian);
  }

  toString(encoding: string = 'utf-8'): string {
    try {
      switch (encoding.toLowerCase()) {
        case 'latin1':
        case 'iso-8859-1':
          return Array.from(this.data).map(b => String.fromCharCode(b)).join('');
        case 'utf-16':
        case 'utf-16le':
          // Handle BOM if present
          let offset = 0;
          if (this.data.length >= 2 && this.data[0] === 0xFF && this.data[1] === 0xFE) {
            offset = 2;
          }
          const decoder16 = new TextDecoder('utf-16le');
          return decoder16.decode(this.data.slice(offset));
        case 'utf-16be':
          const decoder16be = new TextDecoder('utf-16be');
          return decoder16be.decode(this.data);
        default:
          const decoder = new TextDecoder(encoding);
          return decoder.decode(this.data);
      }
    } catch (error) {
      // Fallback to UTF-8
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(this.data);
    }
  }

  append(other: ByteVector | Uint8Array): void {
    const otherData = other instanceof ByteVector ? other.data : other;
    const newData = new Uint8Array(this.data.length + otherData.length);
    newData.set(this.data);
    newData.set(otherData, this.data.length);
    this.data = newData;
  }

  clear(): void {
    this.data = new Uint8Array(0);
  }

  toByteArray(): Uint8Array {
    return new Uint8Array(this.data);
  }
}