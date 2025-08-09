<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import { Button } from '@repo/ui/button';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<LabeledInput
	id="openai-api-key"
	label="OpenAI API Key"
	type="password"
	placeholder="Your OpenAI API Key"
	value={settings.value['apiKeys.openai']}
	oninput={({ currentTarget: { value } }) => {
		settings.updateKey('apiKeys.openai', value);
	}}
>
	{#snippet description()}
		<p class="text-muted-foreground text-sm">
			You can find your API key in your <Button
				variant="link"
				class="px-0.3 py-0.2 h-fit"
				href="https://platform.openai.com/api-keys"
				target="_blank"
				rel="noopener noreferrer"
			>
				account settings
			</Button>. Make sure <Button
				variant="link"
				class="px-0.3 py-0.2 h-fit"
				href="https://platform.openai.com/settings/organization/billing/overview"
				target="_blank"
				rel="noopener noreferrer"
			>
				billing
			</Button>
			is enabled.
		</p>
	{/snippet}
</LabeledInput>
