const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const existing = config.resolver.blockList;
const extraIgnores = [
  /(?:^|[\\/])\.gradle-home(?:[\\/]|$)/,
  /(?:^|[\\/])\.npm-cache(?:[\\/]|$)/,
  /(?:^|[\\/])\.jtmp(?:[\\/]|$)/,
];

config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  ...extraIgnores,
];

module.exports = config;
