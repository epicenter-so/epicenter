<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { getShortcutsRegisterFromContext } from '$lib/query/singletons/shortcutsRegister';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { tryAsync } from '@epicenterhq/result';
	import { type Command, commands, WhisperingErr } from '@repo/shared';
	import { Search } from 'lucide-svelte';
	import GlobalKeyboardShortcutRecorder from './GlobalKeyboardShortcutRecorder.svelte';

	let searchQuery = $state('');

	const filteredCommands = $derived(
		commands.filter((command) =>
			command.title.toLowerCase().includes(searchQuery.toLowerCase()),
		),
	);

	const shortcutsRegister = getShortcutsRegisterFromContext();
</script>

<!-- Search input -->
<div class="relative mb-6">
	<Search
		class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
	/>
	<Input
		type="search"
		placeholder="Search commands..."
		class="pl-10"
		bind:value={searchQuery}
	/>
</div>

<!-- Command list with shortcuts -->
<div class="rounded-lg border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Command</Table.Head>
				<Table.Head class="text-right">Shortcut</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each filteredCommands as command}
				<Table.Row>
					<Table.Cell>{command.title}</Table.Cell>

					<Table.Cell class="text-right">
						<GlobalKeyboardShortcutRecorder
							{command}
							keyCombination={settings.value[`shortcuts.global.${command.id}`]}
							onKeyCombinationChange={async (keyCombination) => {
								const oldShortcutKey = settings.value[`shortcuts.global.${command.id}`];
								if (oldShortcutKey) {
							const unregisterOldShortcutKeyResult = await tryAsync({
								try: async () => {
				if (!window.__TAURI_INTERNALS__) return;
				const { unregister } = await import(
					'@tauri-apps/plugin-global-shortcut'
				);
				return await unregister(oldShortcutKey);
			},
			mapErr: (error) =>
				WhisperingErr({
					title: `Error unregistering command with id ${command.id} globally`,
					description: 'Please try again.',
					action: { type: 'more-details', error },
				}),
		});

		if (!unregisterOldShortcutKeyResult.ok) {
			toast.error(unregisterOldShortcutKeyResult.error);
		}
	}

		if (!keyCombination) return;
		shortcutsRegister.registerCommandGlobally({
			command,
			keyCombination,
			onSuccess: () => {
				settings.value = {
					...settings.value,
					[`shortcuts.global.${command.id}`]: keyCombination,
				};
				toast.success({
					title: `Global shortcut set to ${keyCombination}`,
					description: `Press the shortcut to trigger "${command.title}"`,
				});
			},
			onError: (error) => {
				toast.error(error);
			},
		});

								}}
							placeholder={`e.g. ${command.defaultGlobalShortcut}`}
							autoFocus
						/>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
