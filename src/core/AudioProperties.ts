import { ReadStyle } from "../types";

export abstract class AudioProperties {
  protected style: ReadStyle;

  constructor(style: ReadStyle = ReadStyle.Average) {
    this.style = style;
  }

  abstract lengthInSeconds(): number;
  abstract bitrate(): number;
  abstract sampleRate(): number;
  abstract channels(): number;
  
  bitsPerSample(): number {
    return 0;
  }
  
  sampleFrames(): number {
    return 0;
  }
}