import { AudioProperties, Tag } from "../types";

export abstract class File {
  protected _name: string;
  protected _valid: boolean = false;
  protected _data: Uint8Array;
  protected _position: number = 0;

  constructor(name: string, data: Uint8Array) {
    this._name = name;
    this._data = data;
  }

  abstract tag(): Tag | null;
  abstract audioProperties(): AudioProperties | null;
  abstract save(): boolean;
  
  name(): string { return this._name; }
  isValid(): boolean { return this._valid; }
  data(): Uint8Array { return this._data; }
  length(): number { return this._data.length; }

  protected seek(position: number): void {
    this._position = Math.max(0, Math.min(position, this._data.length));
  }

  protected tell(): number {
    return this._position;
  }

  protected readBlock(length: number): Uint8Array {
    const end = Math.min(this._position + length, this._data.length);
    const block = this._data.slice(this._position, end);
    this._position = end;
    return block;
  }

  protected writeBlock(data: Uint8Array): number {
    const bytesToWrite = Math.min(data.length, this._data.length - this._position);
    this._data.set(data.slice(0, bytesToWrite), this._position);
    this._position += bytesToWrite;
    return bytesToWrite;
  }
}