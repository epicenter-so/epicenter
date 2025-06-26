#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import { join } from 'node:path';

const newVersion = process.argv[2];
if (!newVersion) {
	console.error('Usage: node scripts/bump-version.js <new-version>');
	console.error('Example: node scripts/bump-version.js 6.6.0');
	process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
	console.error(
		'Invalid version format. Use semantic versioning (e.g., 6.6.0)',
	);
	process.exit(1);
}

const files = [
	{ path: 'package.json', type: 'json' },
	{ path: 'apps/app/package.json', type: 'json' },
	{ path: 'apps/app/src-tauri/tauri.conf.json', type: 'json' },
	{ path: 'apps/app/src-tauri/Cargo.toml', type: 'toml' },
];

let oldVersion: string | null = null;

for (const { path, type } of files) {
	const fullPath = join(process.cwd(), path);
	const content = await fs.readFile(fullPath, 'utf-8');

	if (type === 'json') {
		const json = JSON.parse(content);
		if (!oldVersion && json.version) {
			oldVersion = json.version;
		}
		json.version = newVersion;
		await fs.writeFile(fullPath, `${JSON.stringify(json, null, '\t')}\n`);
	} else if (type === 'toml') {
		// Simple regex replacement for Cargo.toml
		const versionRegex = /^version\s*=\s*"[\d.]+"/m;
		const match = content.match(versionRegex);
		if (match && !oldVersion) {
			oldVersion = match[0].match(/"([\d.]+)"/)?.[1] ?? null;
		}
		const updated = content.replace(versionRegex, `version = "${newVersion}"`);
		await fs.writeFile(fullPath, updated);
	}

	console.log(`✅ Updated ${path}`);
}

console.log(`\n📦 Version bumped from ${oldVersion} to ${newVersion}`);
console.log('\nNext steps:');
console.log('1. Review the changes: git diff');
console.log(`2. Commit: git commit -am "chore: bump version to ${newVersion}"`);
console.log(`3. Tag: git tag v${newVersion}`);
console.log('4. Push: git push && git push --tags');
