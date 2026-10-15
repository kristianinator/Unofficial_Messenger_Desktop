import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  getReleaseAssetPlan,
  prepareReleaseAssets,
} from '../scripts/prepare-release-assets.mjs';

test('uses clear Windows downloads and includes Squirrel update metadata', () => {
  assert.deepEqual(getReleaseAssetPlan('win32', 'x64', '1.1.0'), [
    {
      extension: '.exe',
      filename: 'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Installer.exe',
    },
    {
      extension: '.zip',
      filename: 'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Portable.zip',
    },
    {
      extension: '.nupkg',
      preserveFilename: true,
    },
    {
      sourceFilename: 'RELEASES',
      filename: 'RELEASES',
    },
  ]);
});

test('distinguishes Apple silicon and Intel macOS builds', () => {
  assert.deepEqual(
    getReleaseAssetPlan('darwin', 'arm64', '1.1.0').map((asset) => asset.filename),
    [
      'Unofficial-Messenger-Desktop-v1.1.0-macOS-Apple-Silicon.dmg',
      'Unofficial-Messenger-Desktop-v1.1.0-macOS-Apple-Silicon.zip',
    ],
  );
  assert.deepEqual(
    getReleaseAssetPlan('darwin', 'x64', '1.1.0').map((asset) => asset.filename),
    [
      'Unofficial-Messenger-Desktop-v1.1.0-macOS-Intel.dmg',
      'Unofficial-Messenger-Desktop-v1.1.0-macOS-Intel.zip',
    ],
  );
});

test('uses clear names for Linux packages and portable build', () => {
  assert.deepEqual(
    getReleaseAssetPlan('linux', 'x64', '1.1.0').map((asset) => asset.filename),
    [
      'Unofficial-Messenger-Desktop-v1.1.0-Linux-x64-DEB.deb',
      'Unofficial-Messenger-Desktop-v1.1.0-Linux-x64-RPM.rpm',
      'Unofficial-Messenger-Desktop-v1.1.0-Linux-x64-Portable.zip',
    ],
  );
});

test('rejects unsupported release targets', () => {
  assert.throws(
    () => getReleaseAssetPlan('win32', 'arm64', '1.1.0'),
    /Unsupported release target: win32-arm64/,
  );
});

test('copies Windows downloads and the files required by autoUpdater', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'messenger-release-assets-'));
  const sourceDirectory = path.join(temporaryDirectory, 'make', 'squirrel.windows', 'x64');
  const zipDirectory = path.join(temporaryDirectory, 'make', 'zip', 'win32', 'x64');
  const targetDirectory = path.join(temporaryDirectory, 'release-assets');

  try {
    await mkdir(sourceDirectory, { recursive: true });
    await mkdir(zipDirectory, { recursive: true });
    await writeFile(path.join(sourceDirectory, 'Setup.exe'), 'installer');
    const packageContents = 'package';
    const packageHash = createHash('sha1')
      .update(packageContents)
      .digest('hex')
      .toUpperCase();
    await writeFile(path.join(sourceDirectory, 'package-1.0.0-full.nupkg'), 'old package');
    await writeFile(path.join(sourceDirectory, 'package-1.1.0-full.nupkg'), packageContents);
    await writeFile(
      path.join(sourceDirectory, 'RELEASES'),
      `${packageHash} package-1.1.0-full.nupkg ${Buffer.byteLength(packageContents)}\n`,
    );
    await writeFile(path.join(zipDirectory, 'application-1.0.0.zip'), 'old portable');
    await writeFile(path.join(zipDirectory, 'application-1.1.0.zip'), 'portable');

    const preparedFiles = await prepareReleaseAssets({
      platform: 'win32',
      arch: 'x64',
      version: '1.1.0',
      sourceDir: path.join(temporaryDirectory, 'make'),
      targetDir: targetDirectory,
    });

    assert.deepEqual(
      preparedFiles.map((file) => path.basename(file)),
      [
        'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Installer.exe',
        'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Portable.zip',
        'package-1.1.0-full.nupkg',
        'RELEASES',
      ],
    );
    assert.deepEqual((await readdir(targetDirectory)).sort(), [
      'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Installer.exe',
      'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Portable.zip',
      'package-1.1.0-full.nupkg',
      'RELEASES',
    ].sort());
    assert.equal(await readFile(preparedFiles[0], 'utf8'), 'installer');
    assert.equal(await readFile(preparedFiles[1], 'utf8'), 'portable');
    assert.equal(await readFile(preparedFiles[2], 'utf8'), 'package');
    assert.match(
      await readFile(preparedFiles[3], 'utf8'),
      /package-1\.1\.0-full\.nupkg/,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
