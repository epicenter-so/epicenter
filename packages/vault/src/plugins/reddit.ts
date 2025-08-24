import { definePlugin } from '../plugin';
import { defineQuery, defineMutation } from '../actions';
import type { StandardSchemaV1 } from '../actions';
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
			},

			methods: {
				getTopPosts: defineQuery({
					input: type({
						limit: 'number = 10',
					}),
					handler: async ({ limit }, context) => {
						const posts = await context.list();
						return posts.sort((a, b) => b.score - a.score).slice(0, limit);
					},
				}),

				getBySubreddit: defineQuery({
					input: type({
						subreddit: 'string',
					}),
					handler: async ({ subreddit }, context) => {
						const posts = await context.list();
						return posts
							.filter((p) => p && p.subreddit === subreddit)
							.sort(
								(a, b) =>
									new Date(b.created_at).getTime() -
									new Date(a.created_at).getTime(),
							);
					},
				}),

				searchPosts: defineQuery({
					input: type({
						query: 'string',
					}),
					handler: async ({ query }, context) => {
						const all = await context.list();
						const lowercaseQuery = query.toLowerCase();

						return all.filter((post) => {
							if (!post || !post.title) return false;
							return (
								post.title.toLowerCase().includes(lowercaseQuery) ||
								(post.selftext &&
									post.selftext.toLowerCase().includes(lowercaseQuery))
							);
						});
					},
				}),
			},
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
			},

			methods: {
				getCommentThread: defineQuery({
					input: type({
						postId: 'string',
					}),
					handler: async ({ postId }, context) => {
						const comments = await context.list();
						const postComments = comments
							.filter((c) => c.post_id === postId)
							.sort(
								(a, b) =>
									new Date(a.created_at).getTime() -
									new Date(b.created_at).getTime(),
							);

						// Build comment tree
						function buildTree(parentId: string | null): any[] {
							return postComments
								.filter((c) => c.parent_id === parentId)
								.map((comment) => ({
									...comment,
									replies: buildTree(comment.id),
								}));
						}

						return buildTree(null);
					},
				}),

				getTopComments: defineQuery({
					input: type({
						limit: 'number = 20',
					}),
					handler: async ({ limit }, context) => {
						const comments = await context.list();
						return comments.sort((a, b) => b.score - a.score).slice(0, limit);
					},
				}),
			},
		},

		subreddits: {
			schema: {
				name: { type: 'string', required: true, unique: true },
				title: { type: 'string' },
				description: { type: 'string' },
				subscribers: { type: 'number' },
				created_at: { type: 'date' },
				is_nsfw: { type: 'boolean', default: false },
			},

			methods: {
				getTrending: defineQuery({
					input: type({
						limit: 'number = 10',
					}),
					handler: async ({ limit }, context) => {
						const subreddits = await context.list();
						return subreddits
							.sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0))
							.slice(0, limit);
					},
				}),
			},
		},
	},

	// Plugin-level methods
	methods: {
		getStats: defineQuery({
			input: type({}),
			handler: async (_, context) => {
				const postCount = await context.posts.count();
				const commentCount = await context.comments.count();
				const subredditCount = await context.subreddits.count();

				const posts = await context.posts.list();
				const comments = await context.comments.list();

				const topPost = posts.sort((a, b) => b.score - a.score)[0] || null;
				const topComment =
					comments.sort((a, b) => b.score - a.score)[0] || null;

				return {
					posts: postCount,
					comments: commentCount,
					subreddits: subredditCount,
					topPost,
					topComment,
				};
			},
		}),

		exportAll: defineQuery({
			input: type({}),
			handler: async (_, context) => {
				const posts = await context.posts.list();
				const comments = await context.comments.list();
				const subreddits = await context.subreddits.list();

				return {
					posts,
					comments,
					subreddits,
					exported_at: new Date(),
				};
			},
		}),

		searchAll: defineQuery({
			input: type({
				query: 'string',
			}),
			handler: async ({ query }, context) => {
				const lowercaseQuery = query.toLowerCase();

				const posts = await context.posts.list();
				const comments = await context.comments.list();

				return {
					posts: posts.filter((p) => {
						if (!p || !p.title) return false;
						return (
							p.title.toLowerCase().includes(lowercaseQuery) ||
							(p.selftext && p.selftext.toLowerCase().includes(lowercaseQuery))
						);
					}),
					comments: comments.filter(
						(c) => c && c.body && c.body.toLowerCase().includes(lowercaseQuery),
					),
				};
			},
		}),
	},
});
