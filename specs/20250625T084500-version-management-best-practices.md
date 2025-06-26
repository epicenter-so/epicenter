# Version Management Best Practices for Tauri Monorepo

## Current State Analysis

### Version Locations
Currently, version `6.5.0` is manually maintained in 4 files:
1. `/package.json` - Root workspace version
2. `/apps/app/package.json` - App package version
3. `/apps/app/src-tauri/tauri.conf.json` - Tauri configuration version
4. `/apps/app/src-tauri/Cargo.toml` - Rust crate version

### Current Process
- Manual find-and-replace across all files
- Risk of version mismatch
- No automated tooling
- GitHub Actions workflow triggers on version tags (`v[0-9]+.[0-9]+.[0-9]+`)

## Problems with Current Approach

1. **Error-prone**: Easy to miss a file or make typos
2. **No validation**: No checks to ensure all versions match
3. **No changelog**: Version bumps aren't tied to change documentation
4. **Manual process**: Time-consuming and repetitive

## Recommended Solutions

### Option 1: Simple Version Bump Script (Recommended for Immediate Implementation)

Create a Node.js script that:
- Updates all 4 version files atomically
- Validates version format
- Provides clear next steps for git operations
- Can be run with: `pnpm bump-version 6.6.0`

**Pros:**
- Quick to implement
- No new dependencies
- Straightforward to understand
- Can be added to package.json scripts

**Cons:**
- Still requires manual changelog updates
- No automated release notes

### Option 2: Changesets (Industry Standard)

Use [@changesets/cli](https://github.com/changesets/changesets) for:
- Automated version management
- Changelog generation
- Monorepo support
- PR-based workflow

**Pros:**
- Industry standard tool
- Automatic changelog generation
- Handles monorepo versioning
- GitHub bot integration available

**Cons:**
- Additional tooling to learn
- Requires workflow changes

### Option 3: Release-it with Plugins

Use [release-it](https://github.com/release-it/release-it) with:
- Custom plugin for Tauri files
- Automated git operations
- GitHub release creation

**Pros:**
- All-in-one solution
- Extensible via plugins
- Can handle complex workflows

**Cons:**
- More complex setup
- May be overkill for current needs

## Implementation Plan

### Phase 1: Immediate Solution (Simple Script)

1. Create `/scripts/bump-version.js` with:
   - JSON file updates (package.json files, tauri.conf.json)
   - TOML file update (Cargo.toml)
   - Version validation
   - Git command suggestions

2. Add npm scripts:
   ```json
   {
     "scripts": {
       "bump-version": "node scripts/bump-version.js",
       "release": "pnpm bump-version && git add -A && git commit -m 'chore: bump version to $VERSION' && git tag v$VERSION"
     }
   }
   ```

3. Update documentation with release process

### Phase 2: Future Enhancement (Optional)

Consider adopting Changesets or similar tool when:
- Team grows
- Release frequency increases
- Changelog automation becomes necessary

## Best Practices to Follow

1. **Single Source of Truth**: All version updates through the script
2. **Validation**: Always validate semantic versioning format
3. **Atomic Updates**: Update all files in one operation
4. **Git Integration**: Tag immediately after version bump
5. **CI/CD Alignment**: Ensure tags match workflow triggers

## Release Workflow

1. `pnpm bump-version 6.6.0` - Update all version files
2. Review changes: `git diff`
3. Commit: `git commit -am "chore: bump version to 6.6.0"`
4. Tag: `git tag v6.6.0`
5. Push: `git push && git push --tags`
6. GitHub Actions automatically builds and creates draft release

## Todo Items

- [ ] Create version bump script
- [ ] Add npm scripts for versioning
- [ ] Update release documentation
- [ ] Consider future tooling upgrades