<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { copyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { InfoIcon, MonitorIcon } from 'lucide-svelte';

	const modifiers = [
		{ symbol: 'Shift', name: 'shift' },
		{ symbol: 'Alt', name: 'alt' },
		{ symbol: 'Control', name: 'ctrl/control' },
		{ symbol: 'Super', name: 'command/windows' },
		{ symbol: 'Meta', name: 'meta key' },
	];

	const specialKeys = [
		'Backspace',
		'Tab',
		'Enter',
		'Escape',
		'Space',
		'CapsLock',
		'F1-F24',
		'PrintScreen',
		'ScrollLock',
		'Pause',
		'Insert',
		'Home',
		'Delete',
		'End',
		'PageDown',
		'PageUp',
		'ArrowLeft',
		'ArrowUp',
		'ArrowRight',
		'ArrowDown',
		'NumLock',
		'Numpad0-Numpad9',
		'NumpadAdd',
		'NumpadSubtract',
		'NumpadMultiply',
		'NumpadDivide',
		'NumpadDecimal',
		'NumpadEnter',
	];

	const shortcutExamples = [
		'Control+A',
		'Super+Shift+P',
		'Alt+S',
		'F5',
		'Control+Alt+Delete',
		'Shift+Slash',
		'Super+Space',
		'Control+Alt+Delete',
	];

	const platformSpecificExamples = [
		{ platform: 'Windows/Linux', example: 'Control+C' },
		{ platform: 'macOS', example: 'Command+C' },
		{ platform: 'Cross-platform', example: 'CommandOrControl+C' },
	];

	// Common class for all clickable badges
	const clickableBadgeClass =
		'cursor-pointer hover:bg-muted/80 hover:scale-105 transition-all duration-150';
</script>

<div class="bg-muted/50 p-4 rounded-md mb-4">
	<div class="flex items-start gap-3">
		<MonitorIcon class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
		<div>
			<h4 class="font-medium text-sm mb-1">
				Tauri Global Shortcut Format Guide
			</h4>
			<p class="text-muted-foreground text-sm mb-2">
				Use the following format for Tauri global shortcuts:
				<Badge variant="secondary" class="font-mono">Modifier+Key</Badge>
				or just
				<Badge variant="secondary" class="font-mono">Key</Badge>
				for single keys. Note that Tauri uses Pascal case for keys and modifiers.
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
				<h5 class="text-xs font-medium mb-2">Cross-Platform Shortcuts</h5>
				<p class="text-muted-foreground text-xs mb-2">
					Tauri provides special modifiers for cross-platform compatibility:
				</p>
				<div class="space-y-2">
					{#each platformSpecificExamples as { platform, example }}
						<div>
							<Badge variant="outline" class="mb-1">{platform}</Badge>
							<Badge
								variant="secondary"
								class="font-mono ml-2 {clickableBadgeClass}"
								onclick={() =>
									copyTextToClipboardWithToast({
										label: 'key combination',
										text: example,
									})}>{example}</Badge
							>
						</div>
					{/each}
				</div>
				<p class="text-muted-foreground text-xs mt-2">
					Use <Badge variant="secondary" class="font-mono"
						>CommandOrControl</Badge
					> for cross-platform shortcuts that use Command on macOS and Control on
					Windows/Linux.
				</p>
			</div>

			<div class="mt-4">
				<h5 class="text-xs font-medium mb-2">Important Notes</h5>
				<ul class="text-muted-foreground text-xs space-y-1 list-disc pl-4">
					<li>
						Tauri uses Pascal case for keys (e.g., <span class="font-mono"
							>ArrowUp</span
						>
						not <span class="font-mono">arrow up</span>)
					</li>
					<li>Shortcuts are case-sensitive</li>
					<li>Global shortcuts work even when your app doesn't have focus</li>
					<li>
						Avoid using shortcuts that might conflict with system shortcuts
					</li>
					<li>
						Some shortcuts may be reserved by the operating system and cannot be
						registered
					</li>
				</ul>
			</div>

			<div class="mt-3 flex items-center gap-1.5">
				<InfoIcon class="h-3.5 w-3.5 text-green-500" />
				<a
					href="https://v2.tauri.app/plugin/global-shortcut/"
					target="_blank"
					rel="noopener noreferrer"
					class="text-xs text-green-500 hover:underline"
				>
					View Tauri Global Shortcut documentation
				</a>
			</div>
		</div>
	</div>
</div>
