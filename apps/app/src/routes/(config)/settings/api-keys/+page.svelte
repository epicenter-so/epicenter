<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import AnthropicApiKeyInput from '../../-components/AnthropicApiKeyInput.svelte';
	import ElevenLabsApiKeyInput from '../../-components/ElevenLabsApiKeyInput.svelte';
	import GoogleApiKeyInput from '../../-components/GoogleApiKeyInput.svelte';
	import GroqApiKeyInput from '../../-components/GroqApiKeyInput.svelte';
	import OpenAiApiKeyInput from '../../-components/OpenAiApiKeyInput.svelte';
</script>

<svelte:head>
	<title>API Keys - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">API Keys</h3>
		<p class="text-muted-foreground text-sm">
			Configure your API keys for Whispering.
		</p>
	</div>
	<Separator />

	<OpenAiApiKeyInput />
	<AnthropicApiKeyInput />
	<GroqApiKeyInput />
	<GoogleApiKeyInput />
	<ElevenLabsApiKeyInput />
</div>
