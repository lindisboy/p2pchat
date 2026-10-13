const fs = require('fs');
const path = require('path');
const { withAndroidStyles, withDangerousMod, withAndroidManifest, withMainActivity, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withSystemBarContrast(config) {
  config = withAndroidStyles(config, (mod) => {
    for (const name of ['android:windowLightStatusBar', 'android:windowLightNavigationBar']) {
      mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
        add: true, parent: { name: 'AppTheme' }, name,
        value: '@bool/p2pchat_light_system_bars',
      });
    }
    return mod;
  });
  config = withAndroidManifest(config, (mod) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(mod.modResults);
    // Recreate the window when its theme resources change. Keeping the old
    // window retains initial system-bar traits under native edge-to-edge.
    activity.$['android:configChanges'] = (activity.$['android:configChanges'] ?? '')
      .split('|').filter((change) => change !== 'uiMode').join('|');
    return mod;
  });
  config = withMainActivity(config, (mod) => {
    if (!mod.modResults.contents.includes('// P2PCHAT appearance resync')) {
      mod.modResults.contents = mod.modResults.contents.replace('super.onCreate(null)',
        'super.onCreate(null)\n    // P2PCHAT appearance resync after window recreation.\n    super.onConfigurationChanged(resources.configuration)');
    }
    return mod;
  });
  return withDangerousMod(config, ['android', async (mod) => {
    for (const [directory, value] of [['values', 'true'], ['values-night', 'false']]) {
      const folder = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res', directory);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'p2pchat-system-bars.xml'),
        `<resources><bool name="p2pchat_light_system_bars">${value}</bool></resources>\n`);
    }
    return mod;
  }]);
};
