# Release Notes System

This directory contains all release notes for Whispering. The release notes serve two important purposes:

1. **Update Dialog Summary** - A concise summary shown to users in the app's update dialog
2. **GitHub Release Description** - Full release notes for the GitHub release page

## 📁 File Structure

- `v{VERSION}.md` - Release notes for each version (e.g., `v7.0.0.md`)
- `template.md` - Template for creating new release notes
- `README.md` - This documentation file

## 📝 Creating Release Notes

When preparing a new release:

1. Copy `template.md` to a new file named after your version tag (e.g., `v7.1.0.md`)
2. Fill in the summary section between the markers
3. Add detailed release notes below the summary
4. Commit the file before creating the release tag

## 🏷️ Release Notes Format

Each release file must include:

### Summary Section (Required)
```markdown
<!-- SUMMARY:START -->
## Whispering vX.X.X - Brief Title

Major highlights:
• Key feature or improvement 1
• Key feature or improvement 2
• Important bug fixes
• Performance improvements

⚠️ Any breaking changes or important notes
<!-- SUMMARY:END -->
```

**Summary Guidelines:**
- Keep it under 1000 characters for the update dialog
- Use bullet points (•) for better readability
- Focus on user-facing changes
- Include breaking changes with ⚠️ emoji
- Write in present tense ("adds" not "added")

### Full Release Notes (Required)
After the summary section, include comprehensive release notes with:
- Detailed feature descriptions
- Complete list of bug fixes
- Technical improvements
- Breaking changes with migration instructions
- Credits and acknowledgments

## 🔄 GitHub Actions Integration

The CI/CD workflow automatically:
1. Reads the release file matching the git tag (e.g., `v7.0.0` tag → `v7.0.0.md` file)
2. Extracts the summary section for the Tauri updater's `latest.json`
3. Uses the full content for the GitHub release description

### How It Works

```yaml
# The workflow reads docs/release-notes/{tag}.md
RELEASE_FILE=\"docs/release-notes/${{ github.ref_name }}.md\"

# Extracts summary for the update dialog
SUMMARY=$(sed -n '/<!-- SUMMARY:START -->/,/<!-- SUMMARY:END -->/p' \"$RELEASE_FILE\")

# Uses full content for GitHub release
FULL_NOTES=$(cat \"$RELEASE_FILE\")
```

## 🎯 Best Practices

1. **Write for Two Audiences**
   - Summary: Quick overview for users updating through the app
   - Full notes: Detailed information for developers and power users

2. **Version Consistency**
   - File name must match the git tag exactly
   - Include version in the summary title

3. **Update Before Tagging**
   - Commit release notes before creating the git tag
   - This ensures the workflow can find the file

4. **Use Clear Categories**
   - Group changes by type (Features, Fixes, Breaking Changes)
   - Order by importance to users

## 📌 Example Workflow

1. Finish development for v7.1.0
2. Create `docs/release-notes/v7.1.0.md` from template
3. Write summary and full release notes
4. Commit: `git add release-notes/v7.1.0.md && git commit -m "docs: add v7.1.0 release notes"`
5. Tag: `git tag -a v7.1.0 -m "..."`
6. Push: `git push origin v7.1.0`
7. GitHub Actions automatically creates release with your notes

## 🔍 Viewing Release Notes

- **In App**: Users see the summary in the update dialog
- **On GitHub**: Full notes appear on the release page
- **In Repo**: All historical releases are preserved here

## ❓ Troubleshooting

**Release notes not showing in update dialog:**
- Check that file name matches tag exactly
- Verify summary markers are present and correctly formatted
- Ensure file was committed before tag was created

**Workflow can't find release file:**
- File must be in `docs/release-notes/` directory
- File name must be `{tag}.md` (e.g., `v7.1.0.md` for tag `v7.1.0`)
- Check workflow logs for the exact file path it's looking for