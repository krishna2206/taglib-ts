import { Platform, PlatformType } from './Platform';

export interface FileData {
  data: Uint8Array;
  size: number;
}

// Try to import modules at the top level to avoid dynamic requires
let ExpoFileSystem: any = null;
let ReactNativeFS: any = null;

// Safe module loading
try {
  if (typeof require !== 'undefined') {
    try {
      ExpoFileSystem = require('expo-file-system');
    } catch (e) {
      // expo-file-system not available
    }
    
    try {
      ReactNativeFS = require('react-native-fs');
    } catch (e) {
      // react-native-fs not available
    }
  }
} catch (e) {
  // require not available (web environment)
}

export class FileReader {
  /**
   * Read file from different sources based on the platform
   */
  static async readFile(source: string | Uint8Array | ArrayBuffer): Promise<FileData> {
    if (source instanceof Uint8Array) {
      return {
        data: source,
        size: source.length
      };
    }

    if (source instanceof ArrayBuffer) {
      const data = new Uint8Array(source);
      return {
        data,
        size: data.length
      };
    }

    // String path - handle based on platform
    const platform = Platform.platform;
    
    switch (platform) {
      case PlatformType.NodeJS:
        return this.readFileNodeJS(source);
      
      case PlatformType.ReactNative:
        return this.readFileReactNative(source);
      
      case PlatformType.Expo:
        return this.readFileExpo(source);
      
      case PlatformType.Web:
        throw new Error('File path reading not supported in web environment. Use File API or provide Uint8Array directly.');
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private static async readFileNodeJS(filePath: string): Promise<FileData> {
    try {
      const fs = await import('fs');
      const data = fs.readFileSync(filePath);
      return {
        data: new Uint8Array(data),
        size: data.length
      };
    } catch (error) {
      throw new Error(`Failed to read file in Node.js: ${error}`);
    }
  }

  private static async readFileReactNative(filePath: string): Promise<FileData> {
    try {
      if (!ReactNativeFS) {
        throw new Error(`react-native-fs is required for React Native file operations. Install it with: npm install react-native-fs`);
      }

      const base64Data = await ReactNativeFS.readFile(filePath, 'base64');
      const data = this.base64ToUint8Array(base64Data);
      return {
        data,
        size: data.length
      };
    } catch (error) {
      throw new Error(`Failed to read file in React Native: ${error}`);
    }
  }

  private static async readFileExpo(filePath: string): Promise<FileData> {
    try {
      if (!ExpoFileSystem) {
        throw new Error(`expo-file-system is required for Expo file operations. Install it with: expo install expo-file-system`);
      }

      const base64Data = await ExpoFileSystem.readAsStringAsync(filePath, {
        encoding: ExpoFileSystem.EncodingType.Base64
      });
      const data = this.base64ToUint8Array(base64Data);
      return {
        data,
        size: data.length
      };
    } catch (error) {
      throw new Error(`Failed to read file in Expo: ${error}`);
    }
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private static base64ToUint8Array(base64: string): Uint8Array {
    // Handle different base64 implementations
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64, 'base64'));
    } else if (typeof atob !== 'undefined') {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } else {
      throw new Error('No base64 decoder available');
    }
  }

  /**
   * Convert Uint8Array to base64 string
   */
  static uint8ArrayToBase64(data: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(data).toString('base64');
    } else if (typeof btoa !== 'undefined') {
      const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
      return btoa(binaryString);
    } else {
      throw new Error('No base64 encoder available');
    }
  }

  /**
   * Check if Expo FileSystem is available
   */
  static isExpoFileSystemAvailable(): boolean {
    return ExpoFileSystem !== null;
  }

  /**
   * Check if React Native FS is available
   */
  static isReactNativeFSAvailable(): boolean {
    return ReactNativeFS !== null;
  }
}