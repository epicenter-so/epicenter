<script lang="ts">
	import { initCommandsInContext } from '$lib/query/singletons/commands';
	import { initShortcutsRegisterInContext } from '$lib/query/singletons/shortcutsRegister';

	const commandCallbacks = initCommandsInContext();
	const shortcutsRegister = initShortcutsRegisterInContext({
		commandCallbacks,
	});

	let { children } = $props();
</script>

{@render children()}
