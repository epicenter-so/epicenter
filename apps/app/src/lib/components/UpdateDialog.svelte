<script module lang="ts">
	import type { Update } from '@tauri-apps/plugin-updater';

	export const updateDialog = createUpdateDialog();

	function createUpdateDialog() {
		let isOpen = $state(false);
		let update = $state<Update | null>(null);
		let downloadProgress = $state(0);
		let downloadTotal = $state(0);
		let error = $state<string | null>(null);

		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(v) {
				isOpen = v;
			},
			get update() {
				return update;
			},
			get isDownloading() {
				return downloadTotal > 0 && !error;
			},
			get progressPercentage() {
				return downloadTotal > 0 ? (downloadProgress / downloadTotal) * 100 : 0;
			},
			get error() {
				return error;
			},
			open(newUpdate: Update) {
				update = newUpdate;
				isOpen = true;
				downloadProgress = 0;
				downloadTotal = 0;
				error = null;
			},
			close() {
				isOpen = false;
			},
			updateProgress(progress: number, total: number) {
				downloadProgress = progress;
				downloadTotal = total;
			},
			setError(err: string | null) {
				error = err;
				downloadTotal = 0;
			},
		};
	}
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { relaunch } from '@tauri-apps/plugin-process';
	import { toast } from 'svelte-sonner';

	async function handleDownloadAndInstall() {
		if (!updateDialog.update) return;

		updateDialog.setError(null);

		try {
			let downloaded = 0;
			let contentLength = 0;

			await updateDialog.update.downloadAndInstall((event) => {
				switch (event.event) {
					case 'Started':
						contentLength = event.data.contentLength ?? 0;
						updateDialog.updateProgress(0, contentLength);
						break;
					case 'Progress':
						downloaded += event.data.chunkLength;
						updateDialog.updateProgress(downloaded, contentLength);
						break;
					case 'Finished':
						toast.success('Update installed successfully!', {
							action: {
								label: 'Restart Whispering',
								onClick: () => relaunch(),
							},
							cancel: {
								label: 'Later',
								onClick: () => updateDialog.close(),
							},
						});
						break;
				}
			});
		} catch (err) {
			updateDialog.setError(
				err instanceof Error ? err.message : 'Failed to install update',
			);
			toast.error('Update failed', {
				description:
					err instanceof Error ? err.message : 'An unknown error occurred',
			});
		}
	}
</script>

<Dialog.Root bind:open={updateDialog.isOpen}>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>Update Available</Dialog.Title>
			<Dialog.Description>
				Version {updateDialog.update?.version} is now available
				{#if updateDialog.update?.date}
					(Released: {new Date(updateDialog.update.date).toLocaleDateString()})
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if updateDialog.update?.body}
			<div class="bg-muted rounded-md p-4 max-h-64 overflow-y-auto">
				<h4 class="text-sm font-semibold mb-2">Release Notes:</h4>
				<div class="text-sm whitespace-pre-wrap">
					{updateDialog.update.body}
				</div>
			</div>
		{/if}

		{#if updateDialog.isDownloading}
			<div class="space-y-2">
				<div class="text-sm text-muted-foreground">
					Downloading update... {Math.round(updateDialog.progressPercentage)}%
				</div>
				<div class="w-full bg-secondary rounded-full h-2">
					<div
						class="bg-primary h-2 rounded-full transition-all duration-300"
						style="width: {updateDialog.progressPercentage}%"
					></div>
				</div>
			</div>
		{/if}

		{#if updateDialog.error}
			<div class="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
				Error: {updateDialog.error}
			</div>
		{/if}

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => updateDialog.close()}
				disabled={updateDialog.isDownloading}
			>
				Later
			</Button>
			<Button
				onclick={handleDownloadAndInstall}
				disabled={updateDialog.isDownloading}
			>
				{updateDialog.isDownloading ? 'Downloading...' : 'Download & Install'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
