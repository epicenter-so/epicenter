<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import { Button } from '@repo/ui/button';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<LabeledInput
	id="anthropic-api-key"
	label="Anthropic API Key"
	type="password"
	placeholder="Your Anthropic API Key"
	value={settings.value['apiKeys.anthropic']}
	oninput={({ currentTarget: { value } }) => {
		settings.updateKey('apiKeys.anthropic', value);
	}}
>
	{#snippet description()}
		<p class="text-muted-foreground text-sm">
			You can find your Anthropic API key in your <Button
				variant="link"
				class="px-0.3 py-0.2 h-fit"
				href="https://console.anthropic.com/settings/keys"
				target="_blank"
				rel="noopener noreferrer"
			>
				Anthropic console
			</Button>.
		</p>
	{/snippet}
</LabeledInput>
