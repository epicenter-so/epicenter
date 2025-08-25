<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import { Button } from '@repo/ui/button';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<LabeledInput
	id="cartesia-api-key"
	label="Cartesia API Key"
	type="password"
	placeholder="Your Cartesia API Key"
	value={settings.value['apiKeys.cartesia']}
	oninput={({ currentTarget: { value } }) => {
		settings.updateKey('apiKeys.cartesia', value);
	}}
>
	{#snippet description()}
		<p class="text-muted-foreground text-sm">
			You can find your Cartesia API key in your <Button
				variant="link"
				class="px-0.3 py-0.2 h-fit"
				href="https://play.cartesia.ai/keys"
				target="_blank"
				rel="noopener noreferrer"
			>
				Cartesia console
			</Button>.
		</p>
	{/snippet}
</LabeledInput>
