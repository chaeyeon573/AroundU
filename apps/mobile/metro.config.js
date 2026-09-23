const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);
// 모노레포: packages/core와 루트 node_modules를 함께 본다
config.watchFolders = [root];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules'), path.resolve(root, 'node_modules')];

module.exports = config;
