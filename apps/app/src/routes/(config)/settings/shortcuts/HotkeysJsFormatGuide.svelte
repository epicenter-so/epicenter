<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { copyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { InfoIcon, KeyboardIcon } from 'lucide-svelte';

	const modifiers = [
		{ symbol: '⇧', name: 'shift' },
		{ symbol: '⌥', name: 'option/alt' },
		{ symbol: '⌃', name: 'ctrl/control' },
		{ symbol: '⌘', name: 'command' },
		{ symbol: '⇪', name: 'caps lock' },
	];

	const specialKeys = [
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
		'num_0-num_9',
		'num_multiply',
		'num_add',
		'num_enter',
		'num_subtract',
		'num_decimal',
		'num_divide',
	];

	const shortcutExamples = [
		'ctrl+a',
		'command+shift+p',
		'alt+s',
		'f5',
		'ctrl+alt+delete',
		'shift+/',
		'⌘+space',
		'⌃+⌥+del',
	];

	// Common class for all clickable badges
	const clickableBadgeClass =
		'cursor-pointer hover:bg-muted/80 hover:scale-105 transition-all duration-150';
</script>

<div class="bg-muted/50 p-4 rounded-md mb-4">
	<div class="flex items-start gap-3">
		<KeyboardIcon class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
		<div>
			<h4 class="font-medium text-sm mb-1">Shortcut Format Guide</h4>
			<p class="text-muted-foreground text-sm mb-2">
				Use the following format for shortcuts:
				<Badge variant="secondary" class="font-mono">modifier+key</Badge>
				or just
				<Badge variant="secondary" class="font-mono">key</Badge>
				for single keys.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
				<div>
					<h5 class="text-xs font-medium mb-2">Supported Modifiers</h5>
					<div class="flex flex-wrap gap-2">
						{#each modifiers as { symbol, name }}
							<div class="flex items-center gap-1.5">
								<Badge
									variant="secondary"
									class="font-mono {clickableBadgeClass}"
									onclick={() =>
										copyTextToClipboardWithToast({
											label: 'modifier',
											text: symbol,
										})}>{symbol}</Badge
								>
								<span class="text-xs text-muted-foreground">{name}</span>
							</div>
						{/each}
					</div>
				</div>

				<div>
					<h5 class="text-xs font-medium mb-2">Special Keys</h5>
					<div class="flex flex-wrap gap-1.5">
						{#each specialKeys as key}
							<Badge
								variant="outline"
								class="text-xs {clickableBadgeClass}"
								onclick={() =>
									copyTextToClipboardWithToast({
										label: 'key',
										text: key,
									})}>{key}</Badge
							>
						{/each}
					</div>
				</div>
			</div>

			<div>
				<h5 class="text-xs font-medium mb-2">Examples</h5>
				<div class="flex flex-wrap gap-2">
					{#each shortcutExamples as example}
						<Badge
							variant="outline"
							class={clickableBadgeClass}
							onclick={() =>
								copyTextToClipboardWithToast({
									label: 'key combination',
									text: example,
								})}
						>
							{example}
						</Badge>
					{/each}
				</div>
			</div>

			<div class="mt-4">
				<h5 class="text-xs font-medium mb-2">Multiple Key Combinations</h5>
				<p class="text-muted-foreground text-xs mb-2">
					You can bind multiple shortcuts to the same action by separating them
					with commas:
				</p>
				<Badge
					variant="secondary"
					class="font-mono mb-2 {clickableBadgeClass}"
					onclick={() =>
						copyTextToClipboardWithToast({
							label: 'key combination',
							text: 'ctrl+r,command+r',
						})}>ctrl+r,command+r</Badge
				>
				<p class="text-muted-foreground text-xs">
					This will trigger the action when either <span class="font-mono">
						ctrl+r
					</span>
					OR <span class="font-mono">command+r</span> is pressed.
				</p>
			</div>

			<div class="mt-3 flex items-center gap-1.5">
				<InfoIcon class="h-3.5 w-3.5 text-blue-500" />
				<a
					href="https://github.com/jaywcjlove/hotkeys-js#documentation"
					target="_blank"
					rel="noopener noreferrer"
					class="text-xs text-blue-500 hover:underline"
				>
					View hotkeys-js documentation
				</a>
			</div>
		</div>
	</div>
</div>
