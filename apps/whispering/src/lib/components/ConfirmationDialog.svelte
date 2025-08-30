<script module lang="ts">
	export const confirmationDialog = createConfirmationDialog();

	function createConfirmationDialog() {
		let isOpen = $state(false);
		let title = $state('');
		let subtitle = $state('');
		let confirmText = $state('');
		let onConfirm = () => {};
		return {
			close() {
				isOpen = false;
			},
			get confirmText() {
				return confirmText;
			},
			get isOpen() {
				return isOpen;
			},
			set isOpen(v) {
				isOpen = v;
			},
			get onConfirm() {
				return onConfirm;
			},
			open(dialog: {
				confirmText: string;
				onConfirm: () => void;
				subtitle: string;
				title: string;
			}) {
				title = dialog.title;
				subtitle = dialog.subtitle;
				confirmText = dialog.confirmText;
				onConfirm = dialog.onConfirm;
				isOpen = true;
			},
			get subtitle() {
				return subtitle;
			},
			get title() {
				return title;
			},
		};
	}
</script>

<script lang="ts">
	import * as AlertDialog from '@repo/ui/alert-dialog';
</script>

<AlertDialog.Root bind:open={confirmationDialog.isOpen}>
	<AlertDialog.Content class="sm:max-w-xl">
		<AlertDialog.Header>
			<AlertDialog.Title>{confirmationDialog.title}</AlertDialog.Title>
			<AlertDialog.Description>
				{confirmationDialog.subtitle}
			</AlertDialog.Description>
		</AlertDialog.Header>

		<AlertDialog.Footer>
			<AlertDialog.Cancel
				onclick={() => {
					confirmationDialog.close();
				}}
			>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => {
					confirmationDialog.onConfirm();
					confirmationDialog.close();
				}}
			>
				{confirmationDialog.confirmText}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
