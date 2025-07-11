<script lang="ts">
	import type {
		Command as CommandPrimitive,
		Dialog as DialogPrimitive,
	} from 'bits-ui';
	import type { Snippet } from 'svelte';

	import type { WithoutChildrenOrChild } from '@/utils.js';

	import * as Dialog from '../dialog/index.js';
	import Command from './command.svelte';

	let {
		children,
		description = 'Search for a command to run',
		open = $bindable(false),
		portalProps,
		ref = $bindable(null),
		title = 'Command Palette',
		value = $bindable(''),
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.RootProps> &
		WithoutChildrenOrChild<DialogPrimitive.RootProps> & {
			children: Snippet;
			description?: string;
			portalProps?: DialogPrimitive.PortalProps;
			title?: string;
		} = $props();
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Header class="sr-only">
		<Dialog.Title>{title}</Dialog.Title>
		<Dialog.Description>{description}</Dialog.Description>
	</Dialog.Header>
	<Dialog.Content class="overflow-hidden p-0" {portalProps}>
		<Command
			class="**:data-[slot=command-input-wrapper]:h-12 [&_[data-command-group]:not([hidden])_~[data-command-group]]:pt-0 [&_[data-command-group]]:px-2 [&_[data-command-input-wrapper]_svg]:h-5 [&_[data-command-input-wrapper]_svg]:w-5 [&_[data-command-input]]:h-12 [&_[data-command-item]]:px-2 [&_[data-command-item]]:py-3 [&_[data-command-item]_svg]:h-5 [&_[data-command-item]_svg]:w-5"
			{...restProps}
			bind:value
			bind:ref
			{children}
		/>
	</Dialog.Content>
</Dialog.Root>
