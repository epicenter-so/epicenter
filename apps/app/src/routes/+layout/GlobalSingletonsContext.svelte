<script lang="ts">
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
	const shortcutsRegister = initShortcutsRegisterInContext({ manualRecorder });

	let { children } = $props();
</script>

{@render children()}initManualRecorderInContext
