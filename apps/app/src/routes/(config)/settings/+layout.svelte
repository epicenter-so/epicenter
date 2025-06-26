<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import SidebarNav from './SidebarNav.svelte';

	let { children } = $props();

	const isString = (value: unknown): value is string =>
		typeof value === 'string';
	const versionPromise = (async () => {
		const res = await fetch(
			'https://api.github.com/repos/braden-w/whispering/releases/latest',
		);
		const { html_url: latestReleaseUrl, tag_name: latestVersion } =
			await res.json();
		if (!isString(latestVersion) || !isString(latestReleaseUrl)) {
			throw new Error('Failed to fetch latest version');
		}
		if (!window.__TAURI_INTERNALS__)
			return { isOutdated: false, version: latestVersion } as const;
		const { getVersion } = await import('@tauri-apps/api/app');
		const currentVersion = `v${await getVersion()}`;
		if (latestVersion === currentVersion) {
			return { isOutdated: false, version: currentVersion } as const;
		}
		return {
			isOutdated: true,
			latestVersion,
			currentVersion,
			latestReleaseUrl,
		} as const;
	})();
</script>

<main class="sm:container flex w-full flex-1 flex-col pb-4 pt-2 px-4 mx-auto">
	<div class="space-y-0.5">
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
		<p class="text-muted-foreground">
			{#await versionPromise}
				Customize your Whispering experience.
			{:then v}
				{#if v.isOutdated}
					{@const { latestVersion, currentVersion, latestReleaseUrl } = v}
					Customize your experience for Whispering {currentVersion} (latest
					<Button
						class="px-0"
						variant="link"
						size="inline"
						href={latestReleaseUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						{latestVersion}
					</Button>).
				{:else}
					{@const { version } = v}
					Customize your experience for Whispering {version}.
				{/if}
			{:catch error}
				Customize your Whispering experience.
			{/await}
		</p>
	</div>
	<Separator class="my-6" />
	<div class="flex flex-col space-y-8 lg:flex-row lg:gap-8">
		<aside class="lg:w-1/6">
			<SidebarNav />
		</aside>
		<div class="flex-1 lg:max-w-3xl">
			{@render children()}
		</div>
	</div>
</main>
