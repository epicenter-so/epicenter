<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import { Button } from '@repo/ui/button';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<LabeledInput
	id="elevenlabs-api-key"
	label="ElevenLabs API Key"
	type="password"
	placeholder="Your ElevenLabs API Key"
	value={settings.value['apiKeys.elevenlabs']}
	oninput={({ currentTarget: { value } }) => {
		settings.updateKey('apiKeys.elevenlabs', value);
	}}
>
	{#snippet description()}
		<p class="text-muted-foreground text-sm">
			You can find your ElevenLabs API key in your <Button
				variant="link"
				class="px-0.3 py-0.2 h-fit"
				href="https://elevenlabs.io/app/settings/api-keys"
				target="_blank"
				rel="noopener noreferrer"
			>
				ElevenLabs console
			</Button>.
		</p>
	{/snippet}
</LabeledInput>
