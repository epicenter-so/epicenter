<script lang="ts">
	import { initCommandsInContext } from '$lib/query/singletons/commands';
	import { initManualRecorderInContext } from '$lib/query/singletons/manualRecorder';
	import { initShortcutsRegisterInContext } from '$lib/query/singletons/shortcutsRegister';
	import { initTranscriberInContext } from '$lib/query/singletons/transcriber';
	import { initTransformerInContext } from '$lib/query/singletons/transformer';
	import { initVadRecorderInContext } from '$lib/query/singletons/vadRecorder';

	const transcriber = initTranscriberInContext();
	const transformer = initTransformerInContext();
	const manualRecorder = initManualRecorderInContext({
		transcriber,
		transformer,
	});
	const vadRecorder = initVadRecorderInContext({ transcriber, transformer });
	const commandCallbacks = initCommandsInContext({
		manualRecorder,
		vadRecorder,
		transcriber,
		transformer,
	});
	const shortcutsRegister = initShortcutsRegisterInContext({
		commandCallbacks,
	});

	let { children } = $props();
</script>

{@render children()}
