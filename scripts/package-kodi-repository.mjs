#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, relative } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import { spawn } from 'node:child_process';

import { packageKodiWebinterface, renderAddonXml } from './package-kodi-webinterface.mjs';

const REPOSITORY_ID = 'repository.keithah.kodi';
const REPOSITORY_NAME = 'Keithah Kodi Add-ons';
const REPOSITORY_VERSION = '0.1.0';
const REPOSITORY_ROOT = 'dist/kodi-repository';
const RAW_REPOSITORY_BASE_URL = 'https://raw.githubusercontent.com/keithah/kodi/main';
const GITHUB_REPOSITORY_URL = 'https://github.com/keithah/kodi';
const WEBINTERFACE_ADDON_ID = 'webinterface.chorus3';

export async function packageKodiRepository({ root = cwd(), runZip = runSystemZip } = {}) {
  const webinterfacePackage = await packageKodiWebinterface({ root, runZip });

  if (!webinterfacePackage.ok) {
    return webinterfacePackage;
  }

  const repositoryRoot = join(root, REPOSITORY_ROOT);
  const stageRoot = join(repositoryRoot, '_stage');
  const repositoryStageDir = join(stageRoot, REPOSITORY_ID);
  const repositoryZipDir = join(repositoryRoot, REPOSITORY_ID);
  const webinterfaceDir = join(repositoryRoot, WEBINTERFACE_ADDON_ID);
  const repositoryZipPath = join(repositoryZipDir, `${REPOSITORY_ID}-${REPOSITORY_VERSION}.zip`);
  const webinterfaceZipPath = join(webinterfaceDir, basename(webinterfacePackage.zipPath));

  rmSync(repositoryRoot, { force: true, recursive: true });
  mkdirSync(repositoryStageDir, { recursive: true });
  mkdirSync(repositoryZipDir, { recursive: true });
  mkdirSync(webinterfaceDir, { recursive: true });

  const repositoryAddonXml = renderRepositoryAddonXml();
  writeFileSync(join(repositoryStageDir, 'addon.xml'), `${repositoryAddonXml.trim()}\n`);
  copyRepositoryAsset({
    root,
    source: 'src/lib/assets/classic/logo.png',
    target: join(repositoryStageDir, 'icon.png')
  });
  copyRepositoryAsset({
    root,
    source: 'src/lib/assets/classic/tweeter.jpg',
    target: join(repositoryStageDir, 'fanart.jpg')
  });
  writeFileSync(
    join(repositoryStageDir, `changelog-${REPOSITORY_VERSION}.txt`),
    `0.1.0\n- Initial Keithah Kodi add-on repository with Chorus3.\n`
  );

  const zipResult = await runZip({
    cwd: stageRoot,
    args: ['-X', '-r', relative(stageRoot, repositoryZipPath), REPOSITORY_ID]
  });

  if (zipResult.status !== 0) {
    return {
      ok: false,
      lines: [
        ...webinterfacePackage.lines,
        `[repository] zip failed with exit code ${zipResult.status}: ${zipResult.stderr || zipResult.stdout || 'no output'}`
      ]
    };
  }

  copyFileSync(webinterfacePackage.zipPath, webinterfaceZipPath);

  const { addonXml: webinterfaceAddonXml } = renderAddonXml({ root });
  const addonsXml = renderAddonsXml([repositoryAddonXml, webinterfaceAddonXml]);
  const addonsXmlPath = join(repositoryRoot, 'addons.xml');
  writeFileSync(addonsXmlPath, addonsXml);
  writeFileSync(join(repositoryRoot, 'addons.xml.md5'), `${md5(addonsXml)}\n`);
  writeFileSync(join(repositoryRoot, 'README.md'), renderRepositoryReadme());
  rmSync(stageRoot, { force: true, recursive: true });

  return {
    ok: true,
    repositoryRoot,
    lines: [
      ...webinterfacePackage.lines,
      `[repository] created ${toPosixPath(relative(root, repositoryZipPath))}.`,
      `[repository] copied ${toPosixPath(relative(root, webinterfaceZipPath))}.`,
      `[repository] wrote ${toPosixPath(relative(root, addonsXmlPath))}.`
    ]
  };
}

function renderRepositoryAddonXml() {
  const infoUrl = `${RAW_REPOSITORY_BASE_URL}/addons.xml`;
  const checksumUrl = `${RAW_REPOSITORY_BASE_URL}/addons.xml.md5`;
  const dataUrl = `${RAW_REPOSITORY_BASE_URL}/`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<addon id="${REPOSITORY_ID}" name="${REPOSITORY_NAME}" version="${REPOSITORY_VERSION}" provider-name="Keith A. H.">
  <requires>
    <import addon="xbmc.addon" version="12.0.0" />
  </requires>
  <extension point="xbmc.addon.repository" name="${REPOSITORY_NAME}">
    <dir>
      <info compressed="false">${infoUrl}</info>
      <checksum>${checksumUrl}</checksum>
      <datadir zip="true">${dataUrl}</datadir>
      <hashes>false</hashes>
    </dir>
  </extension>
  <extension point="xbmc.addon.metadata">
    <summary lang="en_GB">Keithah Kodi add-on repository.</summary>
    <description lang="en_GB">Install and update Chorus3 and future Keithah Kodi add-ons.</description>
    <license>GPL-2.0-or-later</license>
    <source>${GITHUB_REPOSITORY_URL}</source>
    <platform>all</platform>
  </extension>
</addon>`;
}

function renderAddonsXml(addonXmls) {
  const body = addonXmls.map((xml) => xml.replace(/^\s*<\?xml[^>]*>\s*/i, '').trim()).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<addons>\n${body}\n</addons>\n`;
}

function renderRepositoryReadme() {
  return `# Keithah Kodi Add-ons\n\nThis repository is a Kodi add-on repository. Install the repository zip, then use Kodi's add-on browser to install or update Chorus3.\n\n## Install\n\n1. Download the repository add-on zip:\n   ${RAW_REPOSITORY_BASE_URL}/${REPOSITORY_ID}/${REPOSITORY_ID}-${REPOSITORY_VERSION}.zip\n2. In Kodi, use Add-ons > Install from zip file.\n3. Then use Install from repository > ${REPOSITORY_NAME} > Web interfaces > Chorus3.\n\nKodi repository metadata is served from:\n\n- ${RAW_REPOSITORY_BASE_URL}/addons.xml\n- ${RAW_REPOSITORY_BASE_URL}/addons.xml.md5\n`;
}

function copyRepositoryAsset({ root, source, target }) {
  const sourcePath = join(root, source);

  if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
    throw new Error(`[repository] missing repository asset ${source}`);
  }

  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(sourcePath, target);
}

function md5(value) {
  return createHash('md5').update(value).digest('hex');
}

function runSystemZip({ cwd, args }) {
  return new Promise((resolve, reject) => {
    const child = spawn('zip', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      resolve({ status: status ?? 1, stdout, stderr });
    });
  });
}

function toPosixPath(value) {
  return value.split(/[\\/]+/).join('/');
}

if (import.meta.url === `file://${argv[1]}`) {
  const result = await packageKodiRepository();
  for (const line of result.lines ?? []) {
    console.log(line);
  }

  if (!result.ok) {
    exit(1);
  }
}
