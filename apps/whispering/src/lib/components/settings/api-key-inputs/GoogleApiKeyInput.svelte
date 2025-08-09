<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import { Button } from '@repo/ui/button';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<LabeledInput
	id="google-api-key"
	label="Google API Key"
	type="password"
	placeholder="Your Google API Key"
	value={settings.value['apiKeys.google']}
	oninput={({ currentTarget: { value } }) => {
		settings.updateKey('apiKeys.google', value);
	}}
>
	{#snippet description()}
		<p class="text-muted-foreground text-sm">
			You can find your Google API key in your <Button
				variant="link"
				class="px-0.3 py-0.2 h-fit"
				href="https://aistudio.google.com/app/apikey"
				target="_blank"
				rel="noopener noreferrer"
			>
				Google AI Studio
			</Button>.
		</p>
	{/snippet}
</LabeledInput>
