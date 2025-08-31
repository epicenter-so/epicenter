import { definePlugin, defineQuery, defineMutation } from '../plugin';
import { type } from 'arktype';

/**
 * Tags plugin for categorization and labeling
 * Simple plugin with no dependencies using transform pattern
 */
export const tagsPlugin = definePlugin({
	id: 'tags',
	name: 'Tag System',
	
	tables: {
		tags: {
			schema: {
				name: { type: 'string', required: true, unique: true },
				color: { type: 'string', default: '#808080' },
				category: { type: 'string' },
				description: { type: 'string' },
				usage_count: { type: 'number', default: 0 },
				created_at: { type: 'date', required: true }
			}
		},
		
		tag_groups: {
			schema: {
				name: { type: 'string', required: true, unique: true },
				description: { type: 'string' },
				tag_ids: { type: 'string[]', default: [] },
				created_at: { type: 'date', required: true }
			}
		}
	},
	
	// Using transform pattern to add methods
	transform: (vault) => ({
		...vault,
		tags: {
			...vault.tags,
			
			// Add methods to tags table
			tags: {
				...vault.tags.tags,
				
				findByName: defineQuery({
					input: type({ name: 'string' }),
					handler: async ({ name }) => {
						const tags = await vault.tags.tags.list();
						return tags.filter(t => 
							t.name.toLowerCase().includes(name.toLowerCase())
						);
					}
				}),
				
				findByCategory: defineQuery({
					input: type({ category: 'string' }),
					handler: async ({ category }) => {
						const tags = await vault.tags.tags.list();
						return tags.filter(t => t.category === category);
					}
				}),
				
				incrementUsage: defineMutation({
					input: type({ tagId: 'string' }),
					handler: async ({ tagId }) => {
						const tag = await vault.tags.tags.get({ id: tagId });
						if (!tag) throw new Error(`Tag ${tagId} not found`);
						
						return vault.tags.tags.update({
							id: tagId,
							usage_count: (tag.usage_count || 0) + 1
						});
					}
				})
			},
			
			// Add methods to tag_groups table
			tag_groups: {
				...vault.tags.tag_groups,
				
				getWithTags: defineQuery({
					input: type({ groupId: 'string' }),
					handler: async ({ groupId }) => {
						const group = await vault.tags.tag_groups.get({ id: groupId });
						if (!group) return null;
						
						const tags = await Promise.all(
							(group.tag_ids || []).map(id => 
								vault.tags.tags.get({ id })
							)
						);
						
						return {
							...group,
							tags: tags.filter(Boolean)
						};
					}
				})
			},
			
			// Plugin-level methods
			getPopularTags: defineQuery({
				input: type({ limit: 'number = 10' }),
				handler: async ({ limit }) => {
					const tags = await vault.tags.tags.list();
					return tags
						.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
						.slice(0, limit);
				}
			}),
			
			getCategories: defineQuery({
				input: type({}),
				handler: async () => {
					const tags = await vault.tags.tags.list();
					const categories = new Set(tags.map(t => t.category).filter(Boolean));
					return Array.from(categories);
				}
			}),
			
			createWithGroup: defineMutation({
				input: type({
					tag: {
						name: 'string',
						color: 'string = "#808080"',
						category: 'string?',
						description: 'string?'
					},
					groupId: 'string?'
				}),
				handler: async ({ tag, groupId }) => {
					// Create the tag
					const createdTag = await vault.tags.tags.create({
						...tag,
						created_at: new Date()
					});
					
					// Add to group if specified
					if (groupId) {
						const group = await vault.tags.tag_groups.get({ id: groupId });
						if (group) {
							await vault.tags.tag_groups.update({
								id: groupId,
								tag_ids: [...(group.tag_ids || []), createdTag.id]
							});
						}
					}
					
					return createdTag;
				}
			})
		}
	})
});