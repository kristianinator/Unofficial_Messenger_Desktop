const path = require('path');
const fs = require('fs/promises');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const productName = 'Unofficial Messenger Desktop';
const repositoryUrl = 'https://github.com/kristianinator/Unofficial_Messenger_Desktop';

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '**/node_modules/canvas/build/Release/**',
    },
    name: productName,
    icon: path.join(__dirname, 'assets', 'icon'),
    extraResource: [path.join(__dirname, 'assets')],
    appBundleId: 'com.kspasov.unofficial-messenger-desktop',
    appCategoryType: 'public.app-category.social-networking',
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      await fs.cp(
        path.join(__dirname, 'node_modules', 'canvas'),
        path.join(buildPath, 'node_modules', 'canvas'),
        { recursive: true }
      );
    },
  },
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
        name: productName,
        icon: path.join(__dirname, 'assets', 'icon.icns'),
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
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
