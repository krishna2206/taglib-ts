import { ByteVector } from "../../../utils/ByteVector";

export abstract class ID3v2Frame {
  protected frameId: string;
  protected data: ByteVector;

  constructor(frameId: string, data: ByteVector) {
    this.frameId = frameId;
    this.data = data;
  }

  id(): string { return this.frameId; }
  size(): number { return this.data.size(); }
  
  abstract toString(): string;
  abstract render(): ByteVector;
}