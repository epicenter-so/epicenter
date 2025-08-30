<script lang="ts">
	import { rpc } from '$lib/query';
	import * as services from '$lib/services';
	import { CheckCircle2, SettingsIcon } from '@lucide/svelte';
	import { Button } from '@repo/ui/button';
	import * as Card from '@repo/ui/card';
	import { createQuery } from '@tanstack/svelte-query';
	import { Command } from '@tauri-apps/plugin-shell';
	import { toast } from 'svelte-sonner';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const isAccessibilityGranted = $derived(data.isAccessibilityGranted);

	async function requestAccessibilityPermission() {
		const { error } = await services.permissions.accessibility.request();

		if (error) {
			toast.error('Failed to open accessibility settings', {
				description:
					'Please enable Accessibility in System Settings > Privacy & Security > Accessibility manually',
				action: {
					label: 'Open Accessibility Settings',
					onClick: () => openAccessibilitySettings(),
				},
			});
		}
	}

	async function openAccessibilitySettings() {
		const command = Command.create('open', [
			'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
		]);
		await command.execute();
	}
</script>

<svelte:head>
	<title>MacOS Accessibility</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center">
	<Card.Root class="w-full max-w-2xl">
		<Card.Header>
			<Card.Title class="text-xl">MacOS Accessibility</Card.Title>
			<Card.Description class="leading-7">
				Follow the steps below to re-enable Whispering in your <Button
					variant="link"
					size="inline"
					onclick={() => openAccessibilitySettings()}
				>
					MacOS Accessibility settings
				</Button>. This often is needed after installing new versions of
				Whispering due to a macOS bug.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col items-center gap-2">
				{#if window.__TAURI_INTERNALS__}
					<!-- YouTube embed for Tauri app (external videos don't work well) -->
					<iframe
						class="max-w-md rounded-lg border"
						width="560"
						height="315"
						src="https://www.youtube.com/embed/FJRktNkr1Fs"
						title="macOS Accessibility Settings Guide"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				{:else}
					<!-- Direct video for web version -->
					<video
						class="max-w-md rounded-lg border"
						src="https://github.com/epicenter-so/epicenter/releases/download/_assets/macos_enable_accessibility.mp4"
						autoplay
						loop
						controls
						muted
						playsinline
					>
						<p class="text-muted-foreground text-sm">
							Video guide not available. Please follow the written instructions
							below.
						</p>
					</video>
				{/if}
				<ol
					class="text-muted-foreground list-inside list-decimal space-y-1 text-sm leading-7"
				>
					<li>
						Go to <span class="text-primary font-semibold tracking-tight">
							System Preferences > Privacy & Security > Accessibility
						</span> or click the button below.
					</li>

					<li>
						Click on <span class="text-primary font-semibold tracking-tight"
							>🎙️ Whispering</span
						> and remove it using the minus icon (-).
					</li>
					<li>
						Re-add Whispering by pressing the plus icon (+) and selecting <span
							class="text-primary font-semibold tracking-tight"
							>🎙️ Whispering.app</span
						>
					</li>
				</ol>
			</div>
		</Card.Content>
		<Card.Footer>
			{#if !isAccessibilityGranted}
				<Button
					onclick={() => requestAccessibilityPermission()}
					class="w-full text-sm"
				>
					<SettingsIcon class="mr-2 size-4" />
					Request Accessibility Permission
				</Button>
			{:else}
				<div class="flex flex-col gap-3 w-full">
					<div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
						<CheckCircle2 class="size-5" />
						<span class="font-medium">Accessibility permissions granted</span>
					</div>
					<Button
						onclick={() => openAccessibilitySettings()}
						variant="outline"
						class="w-full text-sm"
					>
						<SettingsIcon class="mr-2 size-4" />
						Open Accessibility Settings
					</Button>
				</div>
			{/if}
		</Card.Footer>
	</Card.Root>
</main>
