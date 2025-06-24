export interface AudioProperties {
  lengthInSeconds(): number;
  bitrate(): number;
  sampleRate(): number;
  channels(): number;
  bitsPerSample?(): number;
  sampleFrames?(): number;
}

export interface Tag {
  title(): string;
  artist(): string;
  album(): string;
  comment(): string;
  genre(): string;
  year(): number;
  track(): number;
  setTitle(title: string): void;
  setArtist(artist: string): void;
  setAlbum(album: string): void;
  setComment(comment: string): void;
  setGenre(genre: string): void;
  setYear(year: number): void;
  setTrack(track: number): void;
  isEmpty(): boolean;
}

export interface AudioFile {
  tag(): Tag | null;
  audioProperties(): AudioProperties | null;
  save(): boolean;
  data(): Uint8Array;
  isValid(): boolean;
  length(): number;
  name(): string;
}

export enum ReadStyle {
  Fast = 0,
  Average = 1,
  Accurate = 2
}

export interface PropertyMap {
  [key: string]: string | string[];
}

export interface Picture {
  data: Uint8Array;
  mimeType: string;
  type: number;
  description: string;
}

export enum PictureType {
  Other = 0,
  FileIcon = 1,
  OtherFileIcon = 2,
  FrontCover = 3,
  BackCover = 4,
  LeafletPage = 5,
  Media = 6,
  LeadArtist = 7,
  Artist = 8,
  Conductor = 9,
  Band = 10,
  Composer = 11,
  Lyricist = 12,
  RecordingLocation = 13,
  DuringRecording = 14,
  DuringPerformance = 15,
  MovieScreenCapture = 16,
  ColouredFish = 17,
  Illustration = 18,
  BandLogo = 19,
  PublisherLogo = 20
}