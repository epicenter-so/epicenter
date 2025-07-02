# Transformation Editor Components

This folder contains the components that make up the transformation editing workspace, providing a unified interface for configuring, testing, and monitoring transformations.

## Component Architecture

The transformation editor follows a hierarchical structure with a main combined view that displays three specialized child components:

```
Editor.svelte (Combined View)
├── Configuration.svelte (Left Pane)
├── Test.svelte (Top Right Pane)
└── Runs.svelte (Bottom Right Pane)
```

## Layout Structure

The editor uses a resizable 3-pane layout:

```
┌─────────────────┬─────────────────┐
│                 │                 │
│                 │     Test        │
│  Configuration  │   (Input/Output)│
│                 │                 │
│                 ├─────────────────┤
│                 │                 │
│                 │     Runs        │
│                 │   (History)     │
└─────────────────┴─────────────────┘
```

### Resizable Panes

- Horizontal split: Configuration vs (Test + Runs)
- Vertical split: Test vs Runs (right side only)
- All panes are user-resizable with handles

## Component Responsibilities

### Editor.svelte

Role: Combined view that manages the resizable pane layout and handles loading/error states for transformation runs.

### Configuration.svelte

Role: Complex transformation configuration interface

- Manages transformation metadata (title, description)
- Handles transformation steps (add, remove, duplicate, configure)
- Supports multiple step types: `find_replace`, `prompt_transform`
- Provides provider-specific configurations (OpenAI, Groq, Anthropic, Google)
- Implements real-time validation and debounced saving

Key Features:

- Multi-step pipeline editor
- Provider/model selection with API key management
- Advanced options in collapsible accordions
- Visual step numbering and type indicators

### Test.svelte

Role: Simple transformation testing interface

- Provides input/output text areas for testing
- Triggers transformation execution via RPC mutation
- Shows loading states during transformation
- Displays results or errors from transformation runs

Key Features:

- Real-time input validation
- Async transformation execution
- Loading indicators and error handling

### Runs.svelte

Role: Historical transformation run display

- Displays transformation runs in an expandable table
- Shows run status, timestamps, and execution details
- Provides expandable views for input/output/error details
- Supports nested step run details with individual statuses
