<script module lang="ts">
	export const moreDetailsDialog = (() => {
		let isOpen = $state(false);
		let title = $state<string>('');
		let description = $state<string>('');
		let content = $state<unknown>(null);
		let buttons = $state<
			{
				label: string;
				onClick: () => void;
				variant?: 'default' | 'destructive';
			}[]
		>([]);

		return {
			get buttons() {
				return buttons;
			},
			get content() {
				if (typeof content === 'string') {
					return content;
				}
				if (content instanceof Error) {
					return content.message;
				}
				return JSON.stringify(content, null, 2);
			},
			get description() {
				return description;
			},
			get isOpen() {
				return isOpen;
			},
			set isOpen(value: boolean) {
				isOpen = value;
			},
			open: (payload: {
				buttons?: {
					label: string;
					onClick: () => void;
					variant?: 'default' | 'destructive';
				}[];
				content: unknown;
				description: string;
				title: string;
			}) => {
				title = payload.title;
				description = payload.description;
				content = payload.content;
				buttons = payload.buttons ?? [];
				isOpen = true;
			},
			get title() {
				return title;
			},
		};
	})();
</script>

<script lang="ts">
	import { Button } from '@repo/ui/button';
	import * as Dialog from '@repo/ui/dialog';
</script>

<Dialog.Root bind:open={moreDetailsDialog.isOpen}>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>{moreDetailsDialog.title}</Dialog.Title>
			<Dialog.Description>{moreDetailsDialog.description}</Dialog.Description>
		</Dialog.Header>
		<pre
			class="bg-muted relative whitespace-pre-wrap break-words rounded p-4 pr-12 font-mono text-sm overflow-x-auto">{moreDetailsDialog.content}</pre>
		{#if moreDetailsDialog.buttons.length !== 0}
			<Dialog.Footer>
				{#each moreDetailsDialog.buttons as button}
					<Button
						variant={button.variant}
						onclick={() => {
							button.onClick();
							moreDetailsDialog.isOpen = false;
						}}
					>
						{button.label}
					</Button>
				{/each}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
