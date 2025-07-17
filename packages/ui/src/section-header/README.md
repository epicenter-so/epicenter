# Section Header Components

Use these components for semantic section headers instead of misusing Card components.

## Usage

```svelte
<script>
	import * as SectionHeader from '$lib/components/ui/section-header';
</script>

<!-- Good: Semantic section header -->
<SectionHeader.Root class="px-6 py-6 border-b">
	<SectionHeader.Title level={2}>Configuration</SectionHeader.Title>
	<SectionHeader.Description>
		Configure the title, description, and steps for how your transformation will
		process your text
	</SectionHeader.Description>
</SectionHeader.Root>

<!-- Bad: Misusing Card components without Card.Root -->
<Card.Header>
	<Card.Title>Configuration</Card.Title>
	<Card.Description>
		Configure the title, description, and steps...
	</Card.Description>
</Card.Header>

<!-- Good: Proper Card usage -->
<Card.Root>
	<Card.Header>
		<Card.Title>Test Transformation</Card.Title>
		<Card.Description>
			Try out your transformation with sample input
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<!-- Card content here -->
	</Card.Content>
</Card.Root>
```

## When to Use

- **SectionHeader**: For page sections, form sections, or any content grouping that needs a header
- **Card**: For distinct, card-like content blocks that represent a single entity or action

## Components

- **SectionHeader.Root**: Container with proper spacing
- **SectionHeader.Title**: Semantic heading with customizable level (h1-h6)
- **SectionHeader.Description**: Styled description text
