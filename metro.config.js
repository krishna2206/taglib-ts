const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for resolving optional dependencies
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle optional peer dependencies
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;