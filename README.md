# taglib-ts

A TypeScript/JavaScript audio metadata library for MP3 files. Works seamlessly across Node.js, React Native, and Expo environments with ID3v2 tag support.

## Features

- 🎵 **MP3 support**: Full MP3/MP2 file format support with ID3v2 tags
- 🔄 **Cross-platform**: Node.js, React Native, Expo environments
- 📖 **Read metadata**: Title, artist, album, year, track, genre, comments
- 🖼️ **Album artwork**: Extract embedded pictures as base64 or data URLs
- ✏️ **Write metadata**: Edit and save changes to MP3 files
- 🏷️ **ID3v2 frames**: Access all ID3v2 tags and properties
- 🚀 **TypeScript**: Full type safety and IntelliSense support

## Currently Supported Formats

| Format | Extension | Read | Write | Notes |
|--------|-----------|------|-------|-------|
| MP3 | .mp3, .mp2 | ✅ | ✅ | ID3v2 tags, MPEG audio properties |

> **Note**: This library currently focuses on MP3 files with excellent accuracy and performance. Support for additional formats (FLAC, MP4, OGG, etc.) is planned for future releases.

## Installation

### Node.js
```bash
npm install taglib-ts
```

### React Native
```bash
npm install taglib-ts react-native-fs
# For iOS
cd ios && pod install
```

### Expo
```bash
npm install taglib-ts expo-file-system
```

## Quick Start

### Node.js Example

```typescript
import { readAudioFile, getPictureAsBase64 } from 'taglib-ts';

async function readMetadata() {
  // Read MP3 file
  const fileRef = await readAudioFile('./song.mp3');
  
  if (fileRef.isValid()) {
    const tag = fileRef.tag();
    const audioProps = fileRef.audioProperties();
    
    // Read metadata
    console.log(`Title: ${tag?.title()}`);
    console.log(`Artist: ${tag?.artist()}`);
    console.log(`Album: ${tag?.album()}`);
    console.log(`Duration: ${audioProps?.lengthInSeconds()}s`);
    
    // Get artwork
    const pictures = tag?.pictures() || [];
    if (pictures.length > 0) {
      const base64 = getPictureAsBase64(pictures[0]);
      console.log(`Album art: ${base64.substring(0, 50)}...`);
    }
  }
}

readMetadata();
```

### React Native Example

```typescript
import React, { useState } from 'react';
import { View, Button, Text, Image } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { readAudioFile, getPictureAsDataURL } from 'taglib-ts';

export const MusicMetadataReader = () => {
  const [metadata, setMetadata] = useState(null);
  const [albumArt, setAlbumArt] = useState(null);

  const pickAndReadFile = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: ['audio/mpeg'], // MP3 files only
      });

      const fileRef = await readAudioFile(result.uri);
      
      if (fileRef.isValid()) {
        const tag = fileRef.tag();
        const audioProps = fileRef.audioProperties();
        
        setMetadata({
          title: tag?.title() || 'Unknown',
          artist: tag?.artist() || 'Unknown',
          album: tag?.album() || 'Unknown',
          duration: audioProps?.lengthInSeconds() || 0,
        });

        // Get album artwork
        const pictures = tag?.pictures() || [];
        if (pictures.length > 0) {
          const dataUrl = getPictureAsDataURL(pictures[0]);
          setAlbumArt(dataUrl);
        }
      }
    } catch (error) {
      console.error('Error reading MP3 file:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Pick MP3 File" onPress={pickAndReadFile} />
      
      {metadata && (
        <View style={{ marginTop: 20 }}>
          <Text>Title: {metadata.title}</Text>
          <Text>Artist: {metadata.artist}</Text>
          <Text>Album: {metadata.album}</Text>
          <Text>Duration: {metadata.duration}s</Text>
          
          {albumArt && (
            <Image 
              source={{ uri: albumArt }} 
              style={{ width: 200, height: 200, marginTop: 20 }}
            />
          )}
        </View>
      )}
    </View>
  );
};
```

### Expo Example

```typescript
import * as DocumentPicker from 'expo-document-picker';
import { readAudioFile, getPictureAsDataURL } from 'taglib-ts';

const pickAndReadAudioFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/mpeg', // MP3 files
      copyToCacheDirectory: true,
    });

    if (result.type === 'success') {
      const fileRef = await readAudioFile(result.uri);
      
      if (fileRef.isValid()) {
        const tag = fileRef.tag();
        const pictures = tag?.pictures() || [];
        
        console.log(`Title: ${tag?.title()}`);
        console.log(`Artist: ${tag?.artist()}`);
        
        if (pictures.length > 0) {
          const dataUrl = getPictureAsDataURL(pictures[0]);
          // Use dataUrl in Image component
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## API Reference

### Core Functions

#### `readAudioFile(source, filename?)`
Reads MP3 file from various sources.

**Parameters:**
- `source: string | Uint8Array | ArrayBuffer` - File path (Node.js), URI (React Native/Expo), or binary data
- `filename?: string` - Optional filename for binary data

**Returns:** `Promise<FileRef>`

#### `readAudioFileSync(data, filename?)`
Synchronous version for when you already have binary data.

**Parameters:**
- `data: Uint8Array` - Binary MP3 data
- `filename?: string` - Optional filename

**Returns:** `FileRef`

### FileRef Class

#### Methods
- `tag()` - Get ID3v2 tag information
- `audioProperties()` - Get MPEG audio properties
- `save()` - Save changes to the FileRef object
- `isValid()` - Check if file is valid
- `isNull()` - Check if file reference is null

### Tag Interface

#### Basic Properties
- `title()` - Song title
- `artist()` - Artist name
- `album()` - Album name
- `year()` - Release year
- `track()` - Track number
- `genre()` - Music genre
- `comment()` - Comments

#### Methods
- `pictures()` - Get embedded pictures (APIC frames)
- `properties()` - Get all ID3v2 frames
- `setProperties(props)` - Set ID3v2 frame values
- `setTitle(title)`, `setArtist(artist)`, etc. - Set basic properties

### AudioProperties Interface

#### Properties
- `lengthInSeconds()` - Duration in seconds
- `bitrate()` - Bitrate in kbps
- `sampleRate()` - Sample rate in Hz
- `channels()` - Number of channels
- `version()` - MPEG version (1, 2, or 2.5)
- `layer()` - MPEG layer (1, 2, or 3)

### Picture Interface

#### Properties
- `data: Uint8Array` - Image binary data
- `mimeType: string` - MIME type (e.g., "image/jpeg")
- `type: number` - Picture type (3 = front cover)
- `description: string` - Description text

### Utility Functions

#### `getPictureAsBase64(picture)`
Convert picture to base64 string.

#### `getPictureAsDataURL(picture)`
Convert picture to data URL for direct use in HTML/CSS.

#### `getSupportedExtensions()`
Get list of supported file extensions.

```typescript
console.log(getSupportedExtensions()); // ['mp3', 'mp2']
```

#### `isFormatSupported(filename)`
Check if file format is supported.

### Platform Detection

```typescript
import { Platform } from 'taglib-ts';

console.log(Platform.platform); // 'nodejs' | 'react-native' | 'expo' | 'web'
console.log(Platform.isNodeJS());
console.log(Platform.isReactNative());
console.log(Platform.isExpo());
```

## Advanced Usage

### Reading All ID3v2 Frames

```typescript
const tag = fileRef.tag();
const properties = tag.properties();

Object.entries(properties).forEach(([frameId, value]) => {
  console.log(`${frameId}: ${value}`);
});

// Common ID3v2 frames:
// TIT2 - Title
// TPE1 - Artist
// TALB - Album
// TPE2 - Album Artist
// TPOS - Part of Set
// TBPM - BPM
// TKEY - Initial Key
```

### Editing Metadata

```typescript
const tag = fileRef.tag();

// Edit basic fields
tag.setTitle('New Title');
tag.setArtist('New Artist');
tag.setAlbum('New Album');
tag.setYear(2024);

// Edit ID3v2 frames
tag.setProperties({
  'TPE2': 'Album Artist',
  'TBPM': '128',
  'TKEY': 'Cm'
});

// Save changes
if (fileRef.save()) {
  console.log('Saved successfully!');
  
  // Access modified file data (Node.js)
  const modifiedData = fileRef.data();
  if (modifiedData) {
    const fs = require('fs');
    fs.writeFileSync('modified-song.mp3', modifiedData);
  }
}
```

### Handling Multiple Pictures

```typescript
const pictures = tag.pictures();

pictures.forEach((picture, index) => {
  console.log(`Picture ${index + 1}:`);
  console.log(`  Type: ${picture.type}`);
  console.log(`  MIME: ${picture.mimeType}`);
  console.log(`  Size: ${picture.data.length} bytes`);
  
  // Convert to base64
  const base64 = getPictureAsBase64(picture);
  
  // Save in Node.js
  if (Platform.isNodeJS()) {
    const fs = require('fs');
    const ext = picture.mimeType.split('/')[1];
    fs.writeFileSync(`album-art-${index}.${ext}`, picture.data);
  }
});
```

## Error Handling

```typescript
try {
  const fileRef = await readAudioFile('path/to/file.mp3');
  
  if (!fileRef.isValid()) {
    console.error('Invalid MP3 file');
    return;
  }
  
  // Process file...
} catch (error) {
  console.error('Error reading MP3 file:', error);
}
```

## Performance Tips

1. **Use `readAudioFileSync`** when you already have binary data
2. **Disable audio properties** reading if not needed: `new FileRef(data, filename, false)`
3. **Cache base64 conversions** for repeated use
4. **Process files in batches** for large collections

## Platform-Specific Notes

### React Native
- Requires `react-native-fs` for file system access
- Use document picker for MP3 file selection
- Pictures work as base64 data URLs in Image components

### Expo
- Requires `expo-file-system` for file operations
- Use `expo-document-picker` for MP3 file selection
- Managed workflow compatible

### Node.js
- Full file system access
- Can save modified files directly
- Best performance for batch processing

## Common ID3v2 Frame IDs

| Frame ID | Description | Example |
|----------|-------------|---------|
| TIT2 | Title | "Bohemian Rhapsody" |
| TPE1 | Artist | "Queen" |
| TALB | Album | "A Night at the Opera" |
| TPE2 | Album Artist | "Queen" |
| TDRC | Recording Date | "1975" |
| TRCK | Track Number | "11/12" |
| TPOS | Part of Set | "1/2" |
| TCON | Genre | "Rock" |
| TBPM | BPM | "72" |
| TKEY | Initial Key | "Bb" |

## Future Roadmap

- 🎯 **FLAC support** - Vorbis comments and audio properties
- 🎯 **MP4/M4A support** - iTunes-style metadata
- 🎯 **OGG support** - Vorbis comments
- 🎯 **WAV support** - ID3v2 and INFO chunks
- 🎯 **Web Audio API integration**
- 🎯 **Batch processing utilities**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/krishna2206/taglib-ts/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/krishna2206/taglib-ts/discussions)
