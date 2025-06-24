export enum PlatformType {
  NodeJS = 'nodejs',
  ReactNative = 'react-native',
  Expo = 'expo',
  Web = 'web'
}

export class Platform {
  private static _platform: PlatformType | null = null;

  static get platform(): PlatformType {
    if (this._platform) return this._platform;

    // Check for Expo first (since Expo runs on React Native)
    if (typeof global !== 'undefined' && 
        ((global as any).expo || 
         (global as any).__expo || 
         (global as any).ExpoModules ||
         (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Expo')))) {
      this._platform = PlatformType.Expo;
    }
    // Check for React Native
    else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      this._platform = PlatformType.ReactNative;
    }
    // Check for Node.js
    else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Double check we're not in React Native
      if (typeof global !== 'undefined' && (global as any).HermesInternal) {
        this._platform = PlatformType.ReactNative;
      } else {
        this._platform = PlatformType.NodeJS;
      }
    }
    // Web environment
    else if (typeof window !== 'undefined') {
      this._platform = PlatformType.Web;
    }
    // Default to Node.js
    else {
      this._platform = PlatformType.NodeJS;
    }

    return this._platform;
  }

  static isNodeJS(): boolean {
    return this.platform === PlatformType.NodeJS;
  }

  static isReactNative(): boolean {
    return this.platform === PlatformType.ReactNative;
  }

  static isExpo(): boolean {
    return this.platform === PlatformType.Expo;
  }

  static isWeb(): boolean {
    return this.platform === PlatformType.Web;
  }

  /**
   * Force platform detection (useful for testing)
   */
  static setPlatform(platform: PlatformType): void {
    this._platform = platform;
  }

  /**
   * Reset platform detection
   */
  static reset(): void {
    this._platform = null;
  }
}