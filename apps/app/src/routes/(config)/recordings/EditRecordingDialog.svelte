<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { recordings } from '$lib/query/recordings';
	import { createResultMutation } from '@tanstack/svelte-query';
	import type { Recording } from '$lib/services/db';
	import { createBlobUrlManager } from '$lib/utils/blobUrlManager';
	import { PencilIcon as EditIcon, Loader2Icon } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { toast } from '$lib/services/toast';

	const deleteRecordingWithToast = createResultMutation(() => ({
		...recordings.deleteRecording(),
		onSuccess: () => {
			toast.success({
				title: 'Deleted recording!',
				description: 'Your recording has been deleted successfully.',
			});
		},
		onError: (error) => {
			toast.error({
				title: 'Failed to delete recording!',
				description: 'Your recording could not be deleted.',
				action: { type: 'more-details', error },
			});
		},
	}));

	let {
		recording,
		onChange,
	}: { recording: Recording; onChange: (newRecording: Recording) => void } =
		$props();

	let isDialogOpen = $state(false);

	const blobUrlManager = createBlobUrlManager();

	const blobUrl = $derived.by(() => {
		if (!recording?.blob) return undefined;
		return blobUrlManager.createUrl(recording.blob);
	});

	onDestroy(() => {
		blobUrlManager.revokeCurrentUrl();
	});
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<WhisperingButton
				tooltipContent="Edit recording"
				variant="ghost"
				size="icon"
				{...props}
			>
				<EditIcon class="size-4" />
			</WhisperingButton>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit recording</Dialog.Title>
			<Dialog.Description>Changes are saved automatically.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="title" class="text-right">Title</Label>
				<Input
					id="title"
					value={recording.title}
					oninput={(e) => {
						onChange({ ...recording, title: e.currentTarget.value });
					}}
					class="col-span-3"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="subtitle" class="text-right">Subtitle</Label>
				<Input
					id="subtitle"
					value={recording.subtitle}
					oninput={(e) => {
						onChange({ ...recording, subtitle: e.currentTarget.value });
					}}
					class="col-span-3"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="timestamp" class="text-right">Created At</Label>
				<Input
					id="timestamp"
					value={recording.timestamp}
					oninput={(e) => {
						onChange({ ...recording, timestamp: e.currentTarget.value });
					}}
					class="col-span-3"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="transcribedText" class="text-right">Transcribed Text</Label>
				<Textarea
					id="transcribedText"
					value={recording.transcribedText}
					oninput={(e) => {
						onChange({ ...recording, transcribedText: e.currentTarget.value });
					}}
					class="col-span-3"
				/>
			</div>
			{#if blobUrl}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="blob" class="text-right">Audio</Label>
					<audio src={blobUrl} controls class="col-span-3 h-8 w-full"></audio>
				</div>
			{/if}
		</div>
		<Dialog.Footer>
			<Button
				onclick={() =>
					deleteRecordingWithToast.mutate(recording, {
						onSettled: () => {
							isDialogOpen = false;
						},
					})}
				variant="destructive"
				disabled={deleteRecordingWithToast.isPending}
			>
				{#if deleteRecordingWithToast.isPending}
					<Loader2Icon class="mr-2 size-4 animate-spin" />
				{/if}
				Delete
			</Button>
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
