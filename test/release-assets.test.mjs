import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  getReleaseAssetPlan,
  prepareReleaseAssets,
} from '../scripts/prepare-release-assets.mjs';

test('uses clear names for the Windows installer and portable build', () => {
  assert.deepEqual(getReleaseAssetPlan('win32', 'x64', '1.1.0'), [
    {
      extension: '.exe',
      filename: 'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Installer.exe',
    },
    {
      extension: '.zip',
      filename: 'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Portable.zip',
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

test('copies only the public Windows downloads with their release names', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'messenger-release-assets-'));
  const sourceDirectory = path.join(temporaryDirectory, 'make', 'squirrel.windows', 'x64');
  const zipDirectory = path.join(temporaryDirectory, 'make', 'zip', 'win32', 'x64');
  const targetDirectory = path.join(temporaryDirectory, 'release-assets');

  try {
    await mkdir(sourceDirectory, { recursive: true });
    await mkdir(zipDirectory, { recursive: true });
    await writeFile(path.join(sourceDirectory, 'Setup.exe'), 'installer');
    await writeFile(path.join(sourceDirectory, 'package.nupkg'), 'internal');
    await writeFile(path.join(sourceDirectory, 'RELEASES'), 'internal');
    await writeFile(path.join(zipDirectory, 'application.zip'), 'portable');

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
      ],
    );
    assert.deepEqual((await readdir(targetDirectory)).sort(), [
      'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Installer.exe',
      'Unofficial-Messenger-Desktop-v1.1.0-Windows-x64-Portable.zip',
    ].sort());
    assert.equal(await readFile(preparedFiles[0], 'utf8'), 'installer');
    assert.equal(await readFile(preparedFiles[1], 'utf8'), 'portable');
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
