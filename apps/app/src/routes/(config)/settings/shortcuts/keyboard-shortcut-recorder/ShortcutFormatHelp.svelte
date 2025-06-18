<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HelpCircle, ExternalLink } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';

	interface Props {
		type: 'local' | 'global';
	}

	let { type }: Props = $props();
	let dialogOpen = $state(false);

	const isLocal = $derived(type === 'local');
	const documentationUrl = isLocal
		? 'https://github.com/jaywcjlove/hotkeys-js'
		: 'https://www.electronjs.org/docs/latest/api/accelerator';
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
			</div>

			<!-- Modifiers and keys -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<h4 class="mb-2 font-medium">Supported Modifiers</h4>
					<div class="space-y-1">
						{#if isLocal}
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono">⇧</Badge>
								<span>shift</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono">⌥</Badge>
								<span>option/alt</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono">⌃</Badge>
								<span>ctrl/control</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono">⌘</Badge>
								<span>command</span>
							</div>
						{:else}
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono">Shift</Badge>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono">Alt</Badge>
								<span class="text-muted-foreground">/ Option on macOS</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono">Control</Badge>
								<span class="text-muted-foreground">/ Ctrl</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Badge variant="outline" class="font-mono"
									>CommandOrControl</Badge
								>
								<span class="text-muted-foreground">/ Cmd on macOS</span>
							</div>
						{/if}
					</div>
				</div>

				<div>
					<h4 class="mb-2 font-medium">Special Keys</h4>
					<div class="flex flex-wrap gap-1">
						{#if isLocal}
							{@const keys = [
								'backspace',
								'tab',
								'clear',
								'enter',
								'return',
								'esc',
								'escape',
								'space',
								'up',
								'down',
								'left',
								'right',
								'home',
								'end',
								'pageup',
								'pagedown',
								'del',
								'delete',
								'f1-f19',
							]}
							{#each keys as key}
								<Badge variant="secondary" class="font-mono text-xs"
									>{key}</Badge
								>
							{/each}
						{:else}
							{@const keys = [
								'Backspace',
								'Tab',
								'Enter',
								'Escape',
								'Space',
								'ArrowUp',
								'ArrowDown',
								'ArrowLeft',
								'ArrowRight',
								'Home',
								'End',
								'PageUp',
								'PageDown',
								'Delete',
								'F1-F12',
							]}
							{#each keys as key}
								<Badge variant="secondary" class="font-mono text-xs"
									>{key}</Badge
								>
							{/each}
						{/if}
					</div>
				</div>
			</div>

			<!-- Examples -->
			<div>
				<h4 class="mb-2 font-medium">Examples</h4>
				<div class="space-y-2 rounded-lg border p-3">
					{#if isLocal}
						<code class="block text-sm">ctrl+a</code>
						<code class="block text-sm">command+shift+p</code>
						<code class="block text-sm">alt+s</code>
						<code class="block text-sm">f5</code>
						<code class="block text-sm">space</code>
					{:else}
						<code class="block text-sm">Control+A</code>
						<code class="block text-sm">CommandOrControl+Shift+P</code>
						<code class="block text-sm">Alt+S</code>
						<code class="block text-sm">F5</code>
						<code class="block text-sm">Space</code>
					{/if}
				</div>
			</div>

			<!-- Multiple shortcuts -->
			{#if isLocal}
				<div>
					<h4 class="mb-2 font-medium">Multiple Shortcuts</h4>
					<p class="mb-2 text-sm text-muted-foreground">
						Bind multiple shortcuts to the same action by separating with
						commas:
					</p>
					<code class="block rounded-lg border p-3 text-sm"
						>ctrl+r,command+r</code
					>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				href={documentationUrl}
				target="_blank"
				rel="noreferrer"
			>
				<ExternalLink class="mr-2 size-4" />
				View full documentation
			</Button>
			<Button onclick={() => (dialogOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
