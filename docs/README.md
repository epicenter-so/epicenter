# Documentation

This directory contains all documentation, resources, and planning materials for the Whispering project.

## Directory Structure

### `/assets`
Static resources used throughout the project documentation.

- **`/images`**: Screenshots, demos, and visual assets used in documentation, release notes, and marketing materials

### `/launch`
Launch campaign materials and planning documents.

- **`/demo-videos`**: Video demonstrations of the application
- **`/planning`**: Strategic planning documents for launches
- **`/platform-posts`**: Pre-written posts for various social media and community platforms

### `/release-notes`
Version release notes used by the CI/CD pipeline.

- Contains release notes for each version (e.g., `v7.0.0.md`)
- Automatically read by GitHub Actions when creating releases
- Includes both user-facing summaries and detailed technical changes

### `/specs`
Technical specifications and implementation plans.

- Temporary planning documents created during feature development
- Often committed alongside major features for historical reference
- Provides context in git history for understanding implementation decisions
- See the [specs README](./specs/README.md) for more details