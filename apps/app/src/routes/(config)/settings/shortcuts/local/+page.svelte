<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { toast } from '$lib/toast';
	import { RotateCcw } from 'lucide-svelte';
	import ShortcutFormatHelp from '../keyboard-shortcut-recorder/ShortcutFormatHelp.svelte';
	import ShortcutTable from '../keyboard-shortcut-recorder/ShortcutTable.svelte';
	import { resetShortcutsToDefaults } from '../reset-shortcuts-to-defaults';
</script>

<svelte:head>
	<title>Local Shortcuts - Whispering</title>
</svelte:head>

<section>
	<div
		class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
	>
		<header class="space-y-1">
			<div class="flex items-center gap-2">
				<h2 class="text-xl font-semibold tracking-tight sm:text-2xl">
					Local Shortcuts
				</h2>
				<ShortcutFormatHelp type="local" />
			</div>
			<p class="text-sm text-muted-foreground">
				Set keyboard shortcuts that work when the app is in focus. These
				shortcuts will only trigger when Whispering is the active application.
			</p>
		</header>
		<Button
			variant="outline"
			size="sm"
			onclick={() => {
				resetShortcutsToDefaults('local');
				toast.success({
					title: 'Shortcuts reset',
					description: 'All local shortcuts have been reset to defaults.',
				});
			}}
			class="shrink-0"
		>
			<RotateCcw class="mr-2 size-4" />
			Reset to defaults
		</Button>
	</div>

	<Separator class="my-6" />

	<ShortcutTable type="local" />
</section>
