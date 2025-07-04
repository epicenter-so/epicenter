<script module lang="ts">
	export const macOSAppNapExplainedDialog = (() => {
		let isOpen = $state(false);
		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(v) {
				isOpen = v;
			},
			open() {
				isOpen = true;
			},
		};
	})();
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
</script>

<Dialog.Root bind:open={macOSAppNapExplainedDialog.isOpen}>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>About macOS App Behavior</Dialog.Title>
			<Dialog.Description>
				Why we don't recommend closing to tray on macOS
			</Dialog.Description>
		</Dialog.Header>
		<p class="text-sm leading-7">
			Due to macOS's App Nap feature, minimizing or hiding the app window can
			cause unexpected behavior.
		</p>
		<p class="text-sm leading-7">
			When the app is put out of focus, macOS may suspend its event loop to
			conserve energy. This means any background tasks or jobs won't execute
			until the app is brought back to the foreground.
		</p>
		<p class="text-sm leading-7">
			For the best experience on macOS, we recommend keeping the app window
			open, even if it's behind other windows. This ensures all features work
			reliably without interruption.
		</p>
		<p class="text-sm leading-7">
			You can still move the window behind other applications - just avoid
			explicitly minimizing or hiding it to prevent App Nap from affecting
			functionality.
		</p>
	</Dialog.Content>
</Dialog.Root>
