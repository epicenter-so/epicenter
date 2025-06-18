- Always prefix files and folders that are only consumed/imported from files in the immediate containing parent folder with an underscore _ . This includes if they are consumed and then reexported by an `index.ts` file—in this case, they should be underscored since index.ts is now the ultimate export path.  You can satisfy this rule either by prefixing individual files with _ OR by placing them in a folder prefixed with _.
- Always use `type` instead of `interface` in Typescript.
- When moving components to new locations, always update relative imports to absolute imports (e.g., change `import Component from '../Component.svelte'` to `import Component from '$lib/components/Component.svelte'`)
- When functions are only used in the return statement of a factory/creator function, use object method shorthand syntax instead of defining them separately. For example, instead of:
  ```typescript
  function myFunction() {
    const helper = () => { /* ... */ };
    return { helper };
  }
  ```
  Use:
  ```typescript
  function myFunction() {
    return {
      helper() { /* ... */ }
    };
  }
  ```

# Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to specs/[feature-name].md where [feature-name] is the name of the feature.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the projectplan.md file with a summary of the changes you made and any other relevant information.


# Human-Readable Control Flow
When refactoring complex control flow, mirror natural human reasoning patterns:

1. **Ask the human question first**: "Can I use what I already have?" → early return for happy path
2. **Assess the situation**: "What's my current state and what do I need to do?" → clear, mutually exclusive conditions  
3. **Take action**: "Get what I need" → consolidated logic at the end
4. **Use natural language variables**: `canReuseCurrentSession`, `isSameSettings`, `hasNoSession` - names that read like thoughts
5. **Avoid artificial constructs**: No nested conditions that don't match how humans actually think through problems

Transform this: nested conditionals with duplicated logic
Into this: linear flow that mirrors human decision-making

# Shadcn-svelte Best Practices

## Component Organization
- Use the CLI for adding/managing shadcn-svelte components: `bunx shadcn-svelte@latest add [component]`
- Each component should be in its own folder under `$lib/components/ui/` with an `index.ts` export file
- Follow kebab-case for component folder names (e.g., `dialog/`, `toggle-group/`)
- Group related sub-components in the same folder (e.g., all dialog parts in `dialog/`)

## Import Patterns
Use the appropriate import pattern based on component complexity:

**Namespace imports** (preferred for multi-part components):
```typescript
import * as Dialog from '$lib/components/ui/dialog';
import * as ToggleGroup from '$lib/components/ui/toggle-group';
```

**Named imports** (for single components):
```typescript
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
```

## Styling and Customization
- Always use the `cn()` utility from `$lib/utils` for combining Tailwind classes
- Modify component code directly rather than overriding styles with complex CSS
- Use `tailwind-variants` for component variant systems
- Follow the `background`/`foreground` convention for colors
- Leverage CSS variables for theme consistency

## Component Usage Patterns
- Use proper component composition following shadcn-svelte patterns:
```svelte
<Dialog.Root bind:open={isOpen}>
  <Dialog.Trigger>
    <Button>Open</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Title</Dialog.Title>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
```

## Custom Components
- When extending shadcn components, create wrapper components that maintain the design system
- Add JSDoc comments for complex component props
- Ensure custom components follow the same organizational patterns
- Consider semantic appropriateness (e.g., use section headers instead of cards for page sections)
