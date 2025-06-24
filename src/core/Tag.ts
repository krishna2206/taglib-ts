import { PropertyMap } from "../types";

export abstract class Tag {
  protected _title: string = '';
  protected _artist: string = '';
  protected _album: string = '';
  protected _comment: string = '';
  protected _genre: string = '';
  protected _year: number = 0;
  protected _track: number = 0;

  title(): string { return this._title; }
  artist(): string { return this._artist; }
  album(): string { return this._album; }
  comment(): string { return this._comment; }
  genre(): string { return this._genre; }
  year(): number { return this._year; }
  track(): number { return this._track; }

  setTitle(title: string): void { this._title = title; }
  setArtist(artist: string): void { this._artist = artist; }
  setAlbum(album: string): void { this._album = album; }
  setComment(comment: string): void { this._comment = comment; }
  setGenre(genre: string): void { this._genre = genre; }
  setYear(year: number): void { this._year = year; }
  setTrack(track: number): void { this._track = track; }

  isEmpty(): boolean {
    return !this._title && !this._artist && !this._album && 
      !this._comment && !this._genre && !this._year && !this._track;
  }

  abstract properties(): PropertyMap;
  abstract setProperties(properties: PropertyMap): void;
}