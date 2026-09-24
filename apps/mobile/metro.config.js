const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);
// 모노레포: packages/core와 루트 node_modules를 함께 본다
config.watchFolders = [root];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules'), path.resolve(root, 'node_modules')];

// 루트(웹)와 모바일의 React 버전이 달라 두 벌이 번들되는 것을 막는다:
// react/react-dom/scheduler는 항상 apps/mobile/node_modules 의 것으로 해석
const forced = ['react', 'react-dom', 'scheduler'].filter((m) => fs.existsSync(path.join(__dirname, 'node_modules', m)));
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const hit = forced.find((m) => moduleName === m || moduleName.startsWith(m + '/'));
  const ctx = hit ? { ...context, originModulePath: path.join(__dirname, 'index.js') } : context;
  return (defaultResolve || ctx.resolveRequest)(ctx, moduleName, platform);
};

module.exports = config;
