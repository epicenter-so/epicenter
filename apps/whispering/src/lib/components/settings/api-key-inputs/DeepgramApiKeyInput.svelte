<script lang="ts">
    import { LabeledInput } from '$lib/components/labeled/index.js';
    import { settings } from '$lib/stores/settings.svelte';
    import { Button } from '@repo/ui/button';
</script>

<LabeledInput
    id="deepgram-api-key"
    label="Deepgram API Key"
    type="password"
    placeholder="Your Deepgram API Key"
    value={settings.value['apiKeys.deepgram']}
    oninput={({ currentTarget: { value } }) => {
        settings.updateKey('apiKeys.deepgram', value);
    }}
>
    {#snippet description()}
        <p class="text-muted-foreground text-sm">
            You can find your API key in your <Button
                variant="link"
                class="px-0.3 py-0.2 h-fit"
                href="https://console.deepgram.com/project"
                target="_blank"
                rel="noopener noreferrer"
            >
                Deepgram Console
            </Button>. Make sure you have <Button
                variant="link"
                class="px-0.3 py-0.2 h-fit"
                href="https://console.deepgram.com/billing"
                target="_blank"
                rel="noopener noreferrer"
            >
                credits
            </Button>
            available.
        </p>
    {/snippet}
</LabeledInput>
