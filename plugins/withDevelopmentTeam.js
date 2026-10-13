/**
 * Pins the iOS development team onto every build configuration of the app
 * target during prebuild.
 *
 * Why this exists: `expo prebuild --clean` regenerates ios/*.pbxproj from
 * scratch, which wipes the DEVELOPMENT_TEAM that Xcode wrote when you picked a
 * team in Signing & Capabilities. And Xcode only writes it to the *active*
 * configuration, so a Debug-signed project fails a Release build with the
 * useless "requires a development team" error. This applies it to all
 * configurations, every prebuild, so signing survives a clean and is not
 * config-dependent.
 *
 * The team id is deliberately NOT committed. It is not a security secret -- it
 * cannot be used to sign anything without the private key, and it ships inside
 * every distributed iOS app -- but it is a personal identifier tied to a real
 * Apple account, and this is a public repo for a censorship-resistance tool
 * where linking the author's Apple identity to the project is exactly the kind
 * of avoidable exposure worth avoiding. So it is read at build time from, in
 * order:
 *
 *   1. the APPLE_TEAM_ID environment variable, or
 *   2. a gitignored `signing.local.json` next to this repo: {"appleTeamId":"…"}
 *
 * If neither is present the plugin does nothing, so the repo still prebuilds
 * for anyone else -- they just supply their own team when they sign.
 */

const fs = require('fs');
const path = require('path');
const { withXcodeProject } = require('@expo/config-plugins');

function resolveTeamId(projectRoot) {
  if (process.env.APPLE_TEAM_ID) return process.env.APPLE_TEAM_ID.trim();
  try {
    const local = path.join(projectRoot, 'signing.local.json');
    return JSON.parse(fs.readFileSync(local, 'utf8')).appleTeamId || null;
  } catch {
    return null;
  }
}

module.exports = function withDevelopmentTeam(config) {
  return withXcodeProject(config, (cfg) => {
    const teamId = resolveTeamId(cfg.modRequest.projectRoot);
    if (!teamId) {
      // Not an error: a contributor without our local file just signs with
      // their own team in Xcode, exactly as they would for any RN project.
      console.warn(
        '[withDevelopmentTeam] no APPLE_TEAM_ID env or signing.local.json — leaving signing to Xcode',
      );
      return cfg;
    }

    const configs = cfg.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const entry = configs[key];
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;

      const settings = entry.buildSettings;
      // Only the app target's configs, identified by its bundle id, so we do
      // not accidentally sign the Pods project or other targets.
      const bundleId = settings.PRODUCT_BUNDLE_IDENTIFIER;
      if (typeof bundleId === 'string' && bundleId === cfg.ios?.bundleIdentifier) {
        settings.DEVELOPMENT_TEAM = teamId;
        settings.CODE_SIGN_STYLE = 'Automatic';
      }
    }

    return cfg;
  });
};
