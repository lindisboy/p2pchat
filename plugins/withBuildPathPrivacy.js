const os = require('os');
const { withAppBuildGradle } = require('@expo/config-plugins');

function mapBuildPaths(contents) {
  const marker = '// P2PCHAT native diagnostic path mapping';
  if (contents.includes(marker)) return contents;
  const home = os.homedir();
  const flag = `-DCMAKE_CXX_FLAGS=-ffile-prefix-map="${home}=/build-home"`;
  const literal = "'" + flag.replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'";
  return contents.replace('defaultConfig {', `defaultConfig {\n        ${marker}\n        externalNativeBuild {\n            cmake { arguments ${literal} }\n        }`);
}

module.exports = function withBuildPathPrivacy(config) {
  return withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = mapBuildPaths(mod.modResults.contents);
    return mod;
  });
};
module.exports.mapBuildPaths = mapBuildPaths;
