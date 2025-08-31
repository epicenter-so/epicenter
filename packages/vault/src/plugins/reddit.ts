import { definePlugin, defineQuery, defineMutation } from '../plugin';
import { type } from 'arktype';

/**
 * Reddit plugin for the vault system
 * Provides tables and methods for Reddit data
 */
export const redditPlugin = definePlugin({
	id: 'reddit',
	name: 'Reddit Integration',

	tables: {
		posts: {
			schema: {
				title: { type: 'string', required: true },
				author: { type: 'string', required: true },
				subreddit: { type: 'string', required: true },
				score: { type: 'number', default: 0 },
				num_comments: { type: 'number', default: 0 },
				created_at: { type: 'date', required: true },
				url: { type: 'string' },
				selftext: { type: 'string' },
				is_video: { type: 'boolean', default: false },
				is_nsfw: { type: 'boolean', default: false },
			}
		},

		comments: {
			schema: {
				body: { type: 'string', required: true },
				author: { type: 'string', required: true },
				post_id: { type: 'string', required: true, references: 'posts' },
				parent_id: { type: 'string', references: 'comments' },
				score: { type: 'number', default: 0 },
				created_at: { type: 'date', required: true },
				edited: { type: 'boolean', default: false },
				awards: { type: 'string[]' },
			}
		},

		subreddits: {
			schema: {
				name: { type: 'string', required: true, unique: true },
				title: { type: 'string' },
				description: { type: 'string' },
				subscribers: { type: 'number' },
				created_at: { type: 'date' },
				is_nsfw: { type: 'boolean', default: false },
			}
		}
	},

	// Transform to add methods
	transform: (vault) => ({
		...vault,
		reddit: {
			...vault.reddit,
			
			// Post methods
			posts: {
				...vault.reddit.posts,
				
				getTopPosts: defineQuery({
					input: type({ limit: 'number = 10' }),
					handler: async ({ limit }) => {
						const posts = await vault.reddit.posts.list();
						return posts.sort((a, b) => b.score - a.score).slice(0, limit);
					}
				}),
				
				getBySubreddit: defineQuery({
					input: type({ subreddit: 'string' }),
					handler: async ({ subreddit }) => {
						const posts = await vault.reddit.posts.list();
						return posts
							.filter(p => p && p.subreddit === subreddit)
							.sort((a, b) => 
								new Date(b.created_at).getTime() - 
								new Date(a.created_at).getTime()
							);
					}
				}),
				
				searchPosts: defineQuery({
					input: type({ query: 'string' }),
					handler: async ({ query }) => {
						const all = await vault.reddit.posts.list();
						const lowercaseQuery = query.toLowerCase();
						
						return all.filter(post => {
							if (!post || !post.title) return false;
							return (
								post.title.toLowerCase().includes(lowercaseQuery) ||
								(post.selftext && post.selftext.toLowerCase().includes(lowercaseQuery))
							);
						});
					}
				})
			},
			
			// Comment methods
			comments: {
				...vault.reddit.comments,
				
				getCommentThread: defineQuery({
					input: type({ postId: 'string' }),
					handler: async ({ postId }) => {
						const comments = await vault.reddit.comments.list();
						const postComments = comments
							.filter(c => c.post_id === postId)
							.sort((a, b) => 
								new Date(a.created_at).getTime() - 
								new Date(b.created_at).getTime()
							);
						
						// Build comment tree
						function buildTree(parentId: string | null): any[] {
							return postComments
								.filter(c => c.parent_id === parentId)
								.map(comment => ({
									...comment,
									replies: buildTree(comment.id)
								}));
						}
						
						return buildTree(null);
					}
				}),
				
				getTopComments: defineQuery({
					input: type({ limit: 'number = 20' }),
					handler: async ({ limit }) => {
						const comments = await vault.reddit.comments.list();
						return comments.sort((a, b) => b.score - a.score).slice(0, limit);
					}
				})
			},
			
			// Subreddit methods
			subreddits: {
				...vault.reddit.subreddits,
				
				getTrending: defineQuery({
					input: type({ limit: 'number = 10' }),
					handler: async ({ limit }) => {
						const subreddits = await vault.reddit.subreddits.list();
						return subreddits
							.sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0))
							.slice(0, limit);
					}
				})
			},
			
			// Plugin-level methods
			getStats: defineQuery({
				input: type({}),
				handler: async () => {
					const postCount = await vault.reddit.posts.count();
					const commentCount = await vault.reddit.comments.count();
					const subredditCount = await vault.reddit.subreddits.count();
					
					const posts = await vault.reddit.posts.list();
					const comments = await vault.reddit.comments.list();
					
					const topPost = posts.sort((a, b) => b.score - a.score)[0] || null;
					const topComment = comments.sort((a, b) => b.score - a.score)[0] || null;
					
					return {
						posts: postCount,
						comments: commentCount,
						subreddits: subredditCount,
						topPost,
						topComment
					};
				}
			}),
			
			exportAll: defineQuery({
				input: type({}),
				handler: async () => {
					const posts = await vault.reddit.posts.list();
					const comments = await vault.reddit.comments.list();
					const subreddits = await vault.reddit.subreddits.list();
					
					return {
						posts,
						comments,
						subreddits,
						exported_at: new Date()
					};
				}
			}),
			
			searchAll: defineQuery({
				input: type({ query: 'string' }),
				handler: async ({ query }) => {
					const lowercaseQuery = query.toLowerCase();
					
					const posts = await vault.reddit.posts.list();
					const comments = await vault.reddit.comments.list();
					
					return {
						posts: posts.filter(p => {
							if (!p || !p.title) return false;
							return (
								p.title.toLowerCase().includes(lowercaseQuery) ||
								(p.selftext && p.selftext.toLowerCase().includes(lowercaseQuery))
							);
						}),
						comments: comments.filter(
							c => c && c.body && c.body.toLowerCase().includes(lowercaseQuery)
						)
					};
				}
			})
		}
	})
});