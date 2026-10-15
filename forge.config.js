const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const productName = 'Unofficial Messenger Desktop';
const repositoryUrl = 'https://github.com/kristianinator/Unofficial_Messenger_Desktop';
const isMacosBuild = process.platform === 'darwin';
const macosSigningIdentity = isMacosBuild
  ? process.env.MACOS_SIGN_IDENTITY?.trim()
  : undefined;
const macosNotarizationValues = [
  process.env.APPLE_ID,
  process.env.APPLE_ID_PASSWORD,
  process.env.APPLE_TEAM_ID,
];
const hasCompleteMacosNotarization = macosNotarizationValues.every(Boolean);

if (macosSigningIdentity && !hasCompleteMacosNotarization) {
  throw new Error(
    'APPLE_ID, APPLE_ID_PASSWORD, and APPLE_TEAM_ID are required with MACOS_SIGN_IDENTITY',
  );
}

const macosAdHocSign = isMacosBuild
  ? {
      identity: '-',
      identityValidation: false,
      preAutoEntitlements: false,
      optionsForFile: () => ({
        hardenedRuntime: false,
      }),
    }
  : undefined;
const macosSign = macosSigningIdentity
  ? { identity: macosSigningIdentity }
  : macosAdHocSign;
const macosNotarize = macosSigningIdentity
  ? {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    }
  : undefined;

module.exports = {
  packagerConfig: {
    asar: true,
    name: productName,
    icon: path.join(__dirname, 'assets', 'icon'),
    extraResource: [path.join(__dirname, 'assets')],
    appBundleId: 'com.kspasov.unofficial-messenger-desktop',
    appCategoryType: 'public.app-category.social-networking',
    ...(macosSign ? { osxSign: macosSign } : {}),
    ...(macosNotarize ? { osxNotarize: macosNotarize } : {}),
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'UnofficialMessengerDesktop',
        setupExe: 'UnofficialMessengerDesktopSetup.exe',
        setupIcon: path.join(__dirname, 'assets', 'icon.ico'),
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'Unofficial Messenger',
        icon: path.join(__dirname, 'assets', 'icon.icns'),
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
          name: 'unofficial-messenger-desktop',
          productName,
          bin: productName,
          maintainer: 'Kristian Spasov',
          homepage: repositoryUrl,
          icon: path.join(__dirname, 'assets', 'icon.png'),
          categories: ['Network'],
          section: 'net',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: {
          name: 'unofficial-messenger-desktop',
          productName,
          bin: productName,
          homepage: repositoryUrl,
          icon: path.join(__dirname, 'assets', 'icon.png'),
          categories: ['Network'],
        },
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'darwin', 'linux'],
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
