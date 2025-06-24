import { FileRef } from './FileRef';
import { Picture } from './types';
import { FileReader } from './utils/FileReader';

export { AudioProperties } from './core/AudioProperties';
export { File } from './core/File';
export { Tag } from './core/Tag';
export { FileRef } from './FileRef';
export { ByteVector } from './utils/ByteVector';
export { FileReader } from './utils/FileReader';
export { Platform, PlatformType } from './utils/Platform';

export { MPEGFile, MPEGProperties } from './formats/mp3/MPEGFile';

export * from './types';

export { PictureType } from './types';
export type { AudioFile, Picture, PropertyMap } from './types';

// Main convenience function supports multiple input types
export async function readAudioFile(
  source: string | Uint8Array | ArrayBuffer, 
  filename: string = ''
): Promise<FileRef> {
  const fileData = await FileReader.readFile(source);
  return new FileRef(fileData.data, filename);
}

// Synchronous version for when you already have the data
export function readAudioFileSync(data: Uint8Array, filename: string = ''): FileRef {
  return new FileRef(data, filename);
}

// Utility functions
export function getSupportedExtensions(): string[] {
  return ['mp3', 'mp2'];
}

// Add this for future formats:
export function getPlannedExtensions(): string[] {
  return ['flac', 'mp4', 'm4a', 'aac', 'ogg', 'oga', 'wav', 'aiff'];
}

export function isFormatSupported(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return getSupportedExtensions().includes(ext);
}

// Helper function to get picture data as base64
export function getPictureAsBase64(picture: Picture): string {
  return FileReader.uint8ArrayToBase64(picture.data);
}

// Helper function to create data URL from picture
export function getPictureAsDataURL(picture: Picture): string {
  const base64 = getPictureAsBase64(picture);
  return `data:${picture.mimeType};base64,${base64}`;
}