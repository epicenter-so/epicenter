import { Select as SelectPrimitive } from 'bits-ui';

import Content from './select-content.svelte';
import Group from './select-group.svelte';
import Item from './select-item.svelte';
import Label from './select-label.svelte';
import ScrollDownButton from './select-scroll-down-button.svelte';
import ScrollUpButton from './select-scroll-up-button.svelte';
import Separator from './select-separator.svelte';
import Trigger from './select-trigger.svelte';

const Root = SelectPrimitive.Root;

export {
	Content,
	Group,
	Item,
	Label,
	Root,
	ScrollDownButton,
	ScrollUpButton,
	//
	Root as Select,
	Content as SelectContent,
	Group as SelectGroup,
	Item as SelectItem,
	Label as SelectLabel,
	ScrollDownButton as SelectScrollDownButton,
	ScrollUpButton as SelectScrollUpButton,
	Separator as SelectSeparator,
	Trigger as SelectTrigger,
	Separator,
	Trigger,
};
