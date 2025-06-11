<script lang="ts">
	import { initShortcutsRegisterInContext } from '$lib/query/singletons/shortcutsRegister';

	const shortcutsRegister = initShortcutsRegisterInContext({
		commandCallbacks,
	});

	let { children } = $props();
</script>

{@render children()}
