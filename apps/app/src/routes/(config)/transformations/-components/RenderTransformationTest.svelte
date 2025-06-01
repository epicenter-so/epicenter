<script lang="ts">
	import * as SectionHeader from '$lib/components/ui/section-header';
	import { LabeledTextarea } from '$lib/components/labeled/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { getTransformerFromContext } from '$lib/query/singletons/transformer';
	import type { Transformation } from '$lib/services/db';
	import { Loader2Icon, PlayIcon } from 'lucide-svelte';
	import { nanoid } from 'nanoid/non-secure';
	import { Separator } from '$lib/components/ui/separator';

	let { transformation }: { transformation: Transformation } = $props();

	let input = $state('');
	let output = $state('');

	const transformer = getTransformerFromContext();
</script>

<div class="flex flex-col gap-6 overflow-y-auto h-full px-2">
	<SectionHeader.Root>
		<SectionHeader.Title>Test Transformation</SectionHeader.Title>
		<SectionHeader.Description>
			Try out your transformation with sample input
		</SectionHeader.Description>
	</SectionHeader.Root>

	<Separator />

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<LabeledTextarea
			id="input"
			label="Input Text"
			bind:value={input}
			placeholder="Enter text to transform..."
			rows={5}
		/>

		<LabeledTextarea
			id="output"
			label="Output Text"
			value={output}
			placeholder="Transformed text will appear here..."
			rows={5}
			readonly
		/>
	</div>

	<Button
		onclick={() =>
			transformer.transformInput.mutate(
				{ input, transformationId: transformation.id, toastId: nanoid() },
				{ onSuccess: (o) => (output = o) },
			)}
		disabled={!input.trim() || transformation.steps.length === 0}
		class="w-full"
	>
		{#if transformer.transformInput.isPending}
			<Loader2Icon class="mr-2 size-4 animate-spin" />
		{:else}
			<PlayIcon class="mr-2 size-4" />
		{/if}
		{transformer.transformInput.isPending
			? 'Running Transformation...'
			: 'Run Transformation'}
	</Button>
</div>
