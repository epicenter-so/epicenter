import { createQueryFactories } from 'wellcrafted/query';
import { queryClient } from './index';

export const { defineQuery, defineMutation } =
	createQueryFactories(queryClient);
