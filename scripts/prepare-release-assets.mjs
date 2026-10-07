import { copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SUPPORTED_TARGETS = new Set([
  'win32-x64',
  'darwin-arm64',
  'darwin-x64',
  'linux-x64',
]);

export function getReleaseAssetPlan(platform, arch, version) {
  const target = `${platform}-${arch}`;

  if (!SUPPORTED_TARGETS.has(target)) {
    throw new Error(`Unsupported release target: ${target}`);
  }

  const prefix = `Unofficial-Messenger-Desktop-v${version}`;

  if (platform === 'win32') {
    return [
      { extension: '.exe', filename: `${prefix}-Windows-x64-Installer.exe` },
      { extension: '.zip', filename: `${prefix}-Windows-x64-Portable.zip` },
    ];
  }

  if (platform === 'darwin') {
    const processor = arch === 'arm64' ? 'Apple-Silicon' : 'Intel';
    return [
      { extension: '.dmg', filename: `${prefix}-macOS-${processor}.dmg` },
      { extension: '.zip', filename: `${prefix}-macOS-${processor}.zip` },
    ];
  }

  return [
    { extension: '.deb', filename: `${prefix}-Linux-x64-DEB.deb` },
    { extension: '.rpm', filename: `${prefix}-Linux-x64-RPM.rpm` },
    { extension: '.zip', filename: `${prefix}-Linux-x64-Portable.zip` },
  ];
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

export async function prepareReleaseAssets({ platform, arch, version, sourceDir, targetDir }) {
  const plan = getReleaseAssetPlan(platform, arch, version);
  const sourceFiles = await listFiles(sourceDir);

  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  const preparedFiles = [];

  for (const asset of plan) {
    const matches = sourceFiles.filter((file) => {
      if (path.extname(file).toLowerCase() !== asset.extension) {
        return false;
      }

      return asset.extension !== '.exe'
        || path.basename(file).toLowerCase().endsWith('setup.exe');
    });

    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one ${asset.extension} file for ${platform}-${arch}, found ${matches.length}`,
      );
    }

    const destination = path.join(targetDir, asset.filename);
    await copyFile(matches[0], destination);
    preparedFiles.push(destination);
  }

  return preparedFiles;
}

function readArgument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const platform = readArgument('platform');
  const arch = readArgument('arch');

  if (!platform || !arch) {
    throw new Error('Usage: node scripts/prepare-release-assets.mjs --platform=<platform> --arch=<arch>');
  }

  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { version } = JSON.parse(
    await readFile(path.join(projectRoot, 'package.json'), 'utf8'),
  );
  const preparedFiles = await prepareReleaseAssets({
    platform,
    arch,
    version,
    sourceDir: path.join(projectRoot, 'out', 'make'),
    targetDir: path.join(projectRoot, 'out', 'release-assets'),
  });

  console.log(`Prepared ${platform}-${arch} release assets:`);
  for (const file of preparedFiles) {
    console.log(`- ${path.basename(file)}`);
  }
}

const isMainModule = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  await main();
}
