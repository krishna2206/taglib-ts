import { Picture } from "../../../types";
import { ByteVector } from "../../../utils/ByteVector";
import { ID3v2Frame } from "./ID3v2Frame";

export class ID3v2AttachedPictureFrame extends ID3v2Frame {
  private textEncoding: number = 0;
  private mimeType: string = '';
  private pictureType: number = 0;
  private description: string = '';
  private pictureData: Uint8Array = new Uint8Array();

  constructor(data: ByteVector) {
    super('APIC', data);
    this.parse();
  }

  private parse(): void {
    if (this.data.isEmpty()) return;

    let offset = 0;
    this.textEncoding = this.data.at(offset++);
    
    // Read MIME type (null-terminated)
    let mimeEnd = offset;
    while (mimeEnd < this.data.size() && this.data.at(mimeEnd) !== 0) {
      mimeEnd++;
    }
    this.mimeType = this.data.mid(offset, mimeEnd - offset).toString('latin1');
    offset = mimeEnd + 1;
    
    // Picture type
    this.pictureType = this.data.at(offset++);
    
    // Description (null-terminated, encoding-dependent)
    let descEnd = offset;
    if (this.textEncoding === 1 || this.textEncoding === 2) {
      // UTF-16, look for double null
      while (descEnd + 1 < this.data.size() && 
             !(this.data.at(descEnd) === 0 && this.data.at(descEnd + 1) === 0)) {
        descEnd += 2;
      }
      descEnd += 2;
    } else {
      // Single-byte encoding
      while (descEnd < this.data.size() && this.data.at(descEnd) !== 0) {
        descEnd++;
      }
      descEnd++;
    }
    
    this.description = this.data.mid(offset, descEnd - offset - 1).toString();
    
    // Picture data
    this.pictureData = this.data.mid(descEnd).toByteArray();
  }

  toString(): string {
    return `Picture: ${this.mimeType}, ${this.description}`;
  }

  picture(): Picture {
    return {
      data: this.pictureData,
      mimeType: this.mimeType,
      type: this.pictureType,
      description: this.description
    };
  }

  render(): ByteVector {
    const result = new ByteVector([this.textEncoding]);
    result.append(ByteVector.fromString(this.mimeType, 'latin1'));
    result.append(new ByteVector([0])); // null terminator
    result.append(new ByteVector([this.pictureType]));
    result.append(ByteVector.fromString(this.description, 'utf-8'));
    result.append(new ByteVector([0])); // null terminator
    result.append(new ByteVector(this.pictureData));
    return result;
  }
}