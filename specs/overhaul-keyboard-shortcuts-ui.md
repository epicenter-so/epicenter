# Overhaul Keyboard Shortcuts UI

## Overview
Redesign the keyboard shortcuts interface to be more intuitive, less cluttered, and better aligned with shadcn-svelte best practices.

## Current Issues
1. Confusing dual input methods (raw text input + keyboard recorder)
2. Overly prominent format guides taking up valuable space
3. Duplicate code between LocalShortcutTable and GlobalShortcutTable
4. Poor terminology ("raw command" is unclear)
5. No visual feedback for active shortcuts
6. Poor mobile responsiveness

## Proposed Solution

### 1. Unified Shortcut Input
- Remove the separate "raw command" input field
- Make the keyboard recorder the primary input method
- Add an "Edit manually" option within the recorder popover for advanced users
- Rename "Raw Command" to "Shortcut" or remove the label entirely

### 2. Minimized Format Guide
- Replace the large format guide cards with a small help tooltip/popover
- Move detailed format information to a collapsible section or help dialog
- Use shadcn-svelte Tooltip or Popover components for contextual help

### 3. Component Consolidation
- Create a single reusable ShortcutTable component
- Pass configuration props to differentiate between local/global behavior
- Use composition to handle the minor differences

### 4. Enhanced Visual Design
- Use shadcn-svelte Card components for better visual grouping
- Add visual indicators for set shortcuts (e.g., Badge components)
- Implement better empty states with clear CTAs
- Add shortcut conflict detection and warnings

### 5. Improved Interaction Pattern
- Single click to open keyboard recorder
- Show current shortcut as a badge/chip that can be clicked to edit
- Add "Clear" button as part of the recorder interface
- Show real-time feedback during recording

## Implementation Steps

### Phase 1: Component Refactoring
- [ ] Create unified ShortcutTable component
- [ ] Create minimized ShortcutFormatHelp component
- [ ] Update keyboard recorder to include manual edit option

### Phase 2: UI Improvements
- [ ] Redesign table layout with better visual hierarchy
- [ ] Add Badge components for active shortcuts
- [ ] Implement responsive design for mobile
- [ ] Add empty states with helpful guidance

### Phase 3: Enhanced Features
- [ ] Add shortcut conflict detection
- [ ] Implement "Reset to defaults" functionality
- [ ] Add import/export shortcuts capability
- [ ] Create shortcut categories/groups

### Phase 4: Polish
- [ ] Add animations and transitions
- [ ] Implement proper focus management
- [ ] Add keyboard navigation within the table
- [ ] Create comprehensive accessibility features

## Design Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Keyboard Shortcuts                                    [?]    │
│ Configure shortcuts to quickly access features              │
├─────────────────────────────────────────────────────────────┤
│ [Local Shortcuts] [Global Shortcuts]                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔍 Search commands...                                       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Command                          Shortcut               │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Toggle manual recording          [Cmd+Shift+R] [Clear]  │ │
│ │ Cancel recording                 [Not set] [+ Add]      │ │
│ │ Toggle CPAL recording            [Cmd+Alt+C] [Clear]    │ │
│ │ Push to talk                     [Not set] [+ Add]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Reset all to defaults]                                     │
└─────────────────────────────────────────────────────────────┘
```

## Technical Considerations
- Maintain backward compatibility with existing shortcut settings
- Ensure proper validation of shortcut combinations
- Handle platform-specific key differences (Mac vs Windows/Linux)
- Implement proper error handling for invalid shortcuts

## Success Metrics
- Reduced user confusion about how to set shortcuts
- Decreased support requests about shortcut configuration
- Improved mobile usability
- Cleaner, more maintainable codebase

## Review

### Completed Tasks
1. ✅ Created unified `ShortcutTable` component to replace duplicate Local/Global tables
2. ✅ Created minimized `ShortcutFormatHelp` component to replace large format guides
3. ✅ Updated keyboard recorder to include manual edit option within popover
4. ✅ Redesigned table layout with badges for active shortcuts
5. ✅ Implemented responsive design for mobile devices
6. ✅ Added reset to defaults functionality

### Key Changes Made
- **Unified Components**: Replaced `LocalShortcutTable` and `GlobalShortcutTable` with a single `ShortcutTable` component that accepts a `type` prop
- **Minimized Help**: Replaced large format guide cards with a small help icon that opens a dialog with formatting information
- **Enhanced Recorder**: Added manual edit mode to the keyboard recorder popover, allowing users to type shortcuts directly
- **Improved Visual Hierarchy**: 
  - Moved format help to a small icon next to the heading
  - Added badges to show active shortcuts
  - Removed confusing "raw command" terminology
  - Simplified the "Add shortcut" button
- **Better Mobile Support**: Added responsive breakpoints and proper overflow handling for tables
- **Reset Functionality**: Added "Reset to defaults" button for both local and global shortcuts

### Files Removed
- `HotkeysJsFormatGuide.svelte`
- `TauriGlobalShortcutFormatGuide.svelte`  
- `LocalShortcutTable.svelte`
- `GlobalShortcutTable.svelte`

### Files Added
- `ShortcutTable.svelte` - Unified table component
- `ShortcutFormatHelp.svelte` - Minimized help component

### Files Modified
- `+page.svelte` - Updated to use new components and responsive layout
- `KeyboardShortcutRecorder.svelte` - Added manual edit mode
- `LocalKeyboardShortcutRecorder.svelte` - Added manual set support
- `GlobalKeyboardShortcutRecorder.svelte` - Added manual set support
- `index.svelte.ts` - Updated exports and exposed callbacks

### Future Enhancements (Not Implemented)
- Shortcut conflict detection and warnings
- Import/export shortcuts capability
- Shortcut categories/groups
- Enhanced keyboard navigation within the table