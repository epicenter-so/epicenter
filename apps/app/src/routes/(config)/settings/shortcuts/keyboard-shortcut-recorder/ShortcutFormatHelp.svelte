<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HelpCircle, ExternalLink } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import {
		LOCAL_SHORTCUTS,
		GLOBAL_SHORTCUTS,
		SHORTCUT_EXAMPLES,
	} from '@repo/shared';

	let { type }: { type: 'local' | 'global' } = $props();
	let dialogOpen = $state(false);

	const isLocal = $derived(type === 'local');
</script>

<WhisperingButton
	variant="ghost"
	size="icon"
	class="size-6"
	onclick={() => (dialogOpen = true)}
	tooltipContent="Click for shortcut format guide"
>
	<HelpCircle class="size-4" />
	<span class="sr-only">Shortcut format help</span>
</WhisperingButton>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>
				{isLocal ? 'Local' : 'Global'} Shortcut Format Guide
			</Dialog.Title>
			<Dialog.Description>
				Learn how to format keyboard shortcuts for {isLocal
					? 'in-app'
					: 'system-wide'} use.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<!-- Quick format summary -->
			<div class="rounded-lg bg-muted p-4">
				<p class="text-sm">
					Use <code class="font-mono text-xs">modifier+key</code> format or just
					<code class="font-mono text-xs">key</code> for single keys.
				</p>
				{#if isLocal}
					<p class="text-sm text-muted-foreground mt-1">
						Any key from your keyboard can be used (lowercase). Below are common
						examples:
					</p>
				{/if}
			</div>

			<!-- Keyboard sections -->
			<div class="space-y-4">
				{#each Object.entries(isLocal ? LOCAL_SHORTCUTS : GLOBAL_SHORTCUTS) as [section, { keys, description }]}
					<div>
						<h4 class="mb-1 font-medium">{section}</h4>
						<p class="text-xs text-muted-foreground mb-2">{description}</p>

						{#if section === 'Modifiers'}
							<!-- Show modifiers in a list format -->
							<div class="space-y-1">
								{#each keys as key}
									<div class="flex items-center gap-2">
										<Badge variant="outline" class="font-mono">
											{key}
										</Badge>
									</div>
								{/each}
							</div>
						{:else}
							<!-- Show other keys in a wrapped format -->
							<div class="flex flex-wrap gap-1">
								{#each keys as key}
									{@const isPlaceholder =
										key.includes('-') &&
										(key.includes('a-z') ||
											key.includes('A-Z') ||
											key.includes('0-9') ||
											key.includes('f1') ||
											key.includes('F1'))}
									<Badge
										variant={isPlaceholder ? 'ghost' : 'secondary'}
										class="font-mono text-xs"
									>
										{key}
									</Badge>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Examples -->
			<div>
				<h4 class="mb-2 font-medium">Examples</h4>
				<div class="space-y-2 rounded-lg border p-3">
					{#each SHORTCUT_EXAMPLES[isLocal ? 'local' : 'global'] as example}
						<code class="block text-sm">{example}</code>
					{/each}
				</div>
			</div>
		</div>

		<Dialog.Footer>
			{#if !isLocal}
				<Button
					variant="outline"
					href="https://www.electronjs.org/docs/latest/api/accelerator"
					target="_blank"
					rel="noreferrer"
				>
					<ExternalLink class="mr-2 size-4" />
					View documentation
				</Button>
			{/if}
			<Button onclick={() => (dialogOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
