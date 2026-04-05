#!/usr/bin/env node
// Bumps APP_VERSION in frontend/src/version.ts.
// Format: vYY.MM.NN  (year, month, incrementing build number within that month)
// If the current month matches, increments NN. If month/year has changed, resets NN to 01.

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '../frontend/src/version.ts');
const content = fs.readFileSync(versionFile, 'utf8');

const match = content.match(/APP_VERSION = 'v(\d{2})\.(\d{2})\.(\d{2})'/);
if (!match) {
  console.error('Could not parse version from', versionFile);
  process.exit(1);
}

const [, oldYear, oldMonth, oldBuild] = match;

const now = new Date();
const curYear = String(now.getFullYear()).slice(-2);
const curMonth = String(now.getMonth() + 1).padStart(2, '0');

let newBuild;
if (curYear === oldYear && curMonth === oldMonth) {
  newBuild = String(parseInt(oldBuild, 10) + 1).padStart(2, '0');
} else {
  newBuild = '01';
}

const newVersion = `v${curYear}.${curMonth}.${newBuild}`;
const newContent = content.replace(
  /APP_VERSION = 'v\d{2}\.\d{2}\.\d{2}'/,
  `APP_VERSION = '${newVersion}'`
);

fs.writeFileSync(versionFile, newContent, 'utf8');
console.log(`Bumped version: v${oldYear}.${oldMonth}.${oldBuild} → ${newVersion}`);
