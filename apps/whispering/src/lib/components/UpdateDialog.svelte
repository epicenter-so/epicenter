<script module lang="ts">
	import type { Update } from '@tauri-apps/plugin-updater';

	export const updateDialog = createUpdateDialog();
	export type UpdateInfo = null | Pick<
		Update,
		'body' | 'date' | 'downloadAndInstall' | 'version'
	>;

	function createUpdateDialog() {
		let isOpen = $state(false);
		let update = $state<null | UpdateInfo>(null);
		let downloadProgress = $state(0);
		let downloadTotal = $state(0);
		let error = $state<null | string>(null);

		return {
			close() {
				isOpen = false;
			},
			get error() {
				return error;
			},
			get isDownloadComplete() {
				return downloadTotal > 0 && downloadProgress >= downloadTotal && !error;
			},
			get isDownloading() {
				return downloadTotal > 0 && downloadProgress < downloadTotal && !error;
			},
			get isOpen() {
				return isOpen;
			},
			set isOpen(v) {
				isOpen = v;
			},
			open(newUpdate: UpdateInfo) {
				update = newUpdate;
				isOpen = true;
				downloadProgress = 0;
				downloadTotal = 0;
				error = null;
			},
			get progressPercentage() {
				return downloadTotal > 0 ? (downloadProgress / downloadTotal) * 100 : 0;
			},
			setError(err: null | string) {
				error = err;
				downloadTotal = 0;
			},
			get update() {
				return update;
			},
			updateProgress(progress: number, total: number) {
				downloadProgress = progress;
				downloadTotal = total;
			},
		};
	}
</script>

<script lang="ts">
	import { rpc } from '$lib/query';
	import { AlertTriangle } from '@lucide/svelte';
	import * as Alert from '@repo/ui/alert';
	import { Button } from '@repo/ui/button';
	import * as Dialog from '@repo/ui/dialog';
	import { relaunch } from '@tauri-apps/plugin-process';
	import { extractErrorMessage } from 'wellcrafted/error';

	async function handleDownloadAndInstall() {
		if (!updateDialog.update) return;

		updateDialog.setError(null);

		try {
			let downloaded = 0;
			let contentLength = 0;

			await updateDialog.update.downloadAndInstall((event) => {
				switch (event.event) {
					case 'Finished':
						rpc.notify.success.execute({
							title: 'Update installed successfully!',
							description: 'Restart Whispering to apply the update.',
							action: {
								label: 'Restart Whispering',
								onClick: () => relaunch(),
								type: 'button',
							},
						});
						break;
					case 'Progress':
						downloaded += event.data.chunkLength;
						updateDialog.updateProgress(downloaded, contentLength);
						break;
					case 'Started':
						contentLength = event.data.contentLength ?? 0;
						updateDialog.updateProgress(0, contentLength);
						break;
				}
			});
		} catch (err) {
			updateDialog.setError(extractErrorMessage(err));
			rpc.notify.error.execute({
				title: 'Failed to install update',
				description: extractErrorMessage(err),
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

		{#if updateDialog.isDownloading || updateDialog.isDownloadComplete}
			<div class="space-y-2">
				<div class="text-sm text-muted-foreground">
					{#if updateDialog.isDownloadComplete}
						Download complete! Ready to restart.
					{:else}
						Downloading update... {Math.round(updateDialog.progressPercentage)}%
					{/if}
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
			<Alert.Root variant="destructive">
				<AlertTriangle class="size-4" />
				<Alert.Title>Error installing update</Alert.Title>
				<Alert.Description>
					{updateDialog.error}
				</Alert.Description>
			</Alert.Root>
		{/if}

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => updateDialog.close()}
				disabled={updateDialog.isDownloading}
			>
				Later
			</Button>
			{#if updateDialog.isDownloadComplete}
				<Button onclick={() => relaunch()}>Restart Now</Button>
			{:else}
				<Button
					onclick={handleDownloadAndInstall}
					disabled={updateDialog.isDownloading}
				>
					{updateDialog.isDownloading ? 'Downloading...' : 'Download & Install'}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
