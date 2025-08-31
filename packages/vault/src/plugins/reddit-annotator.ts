import { definePlugin, defineQuery, defineMutation } from '../plugin';
import { type } from 'arktype';
import { redditPlugin } from './reddit';
import { tagsPlugin } from './tags';
import { sentimentPlugin } from './sentiment';

/**
 * Reddit Annotator Plugin
 * Complex plugin that depends on reddit, tags, and sentiment plugins
 * Demonstrates dependency usage and cross-plugin communication
 */
export const redditAnnotatorPlugin = definePlugin({
	id: 'reddit_annotator',
	name: 'Reddit Post Annotator',
	
	// Declare dependencies - these will be available in transform
	dependencies: [redditPlugin, tagsPlugin, sentimentPlugin],
	
	tables: {
		annotations: {
			schema: {
				post_id: { type: 'string', required: true },
				tag_ids: { type: 'string[]', default: [] },
				sentiment_score: { type: 'number' },
				sentiment_confidence: { type: 'number' },
				auto_generated: { type: 'boolean', default: true },
				reviewed: { type: 'boolean', default: false },
				notes: { type: 'string' },
				annotated_at: { type: 'date', required: true },
				annotated_by: { type: 'string', default: 'system' }
			}
		},
		
		annotation_queue: {
			schema: {
				post_id: { type: 'string', required: true },
				subreddit: { type: 'string', required: true },
				priority: { type: 'number', default: 0 },
				scheduled_for: { type: 'date' },
				status: { type: 'string', default: 'pending' },
				attempts: { type: 'number', default: 0 },
				last_error: { type: 'string' },
				created_at: { type: 'date', required: true }
			}
		},
		
		annotation_templates: {
			schema: {
				name: { type: 'string', required: true, unique: true },
				description: { type: 'string' },
				subreddit_patterns: { type: 'string[]', default: [] },
				auto_tags: { type: 'string[]', default: [] },
				min_sentiment_confidence: { type: 'number', default: 0.5 },
				enabled: { type: 'boolean', default: true }
			}
		}
	},
	
	// Transform function receives vault with all dependencies available
	transform: (vault) => {
		// Type assertion to access dependencies - necessary due to TypeScript limitations
		// At runtime, these dependencies are guaranteed to be available
		type VaultWithDeps = typeof vault & {
			tags: {
				tags: {
					list: () => Promise<Array<{ id: string; name: string; category?: string }>>;
					incrementUsage: (params: { tagId: string }) => Promise<unknown>;
					findByCategory: (params: { category: string }) => Promise<Array<{ id: string; name: string }>>;
					get: (params: { id: string }) => Promise<{ name: string } | null>;
				};
			};
			sentiment: {
				analyze: (params: { text: string }) => Promise<{ score: number; confidence: number; classification: string }>;
				recordSentiment: (params: { contentId: string; contentType: string; text: string; metadata?: Record<string, unknown> }) => Promise<unknown>;
				getHistory: (params: { contentId: string; contentType?: string }) => Promise<unknown[]>;
			};
			reddit: {
				posts: {
					get: (params: { id: string }) => Promise<Record<string, unknown> | null>;
					getBySubreddit: (params: { subreddit: string }) => Promise<Array<Record<string, unknown>>>;
					list: () => Promise<Array<Record<string, unknown>>>;
				};
			};
			reddit_annotator: Record<string, unknown>;
		};
		const typedVault = vault as VaultWithDeps;
		// Helper functions have access to dependencies via closure
		const findMatchingTags = async (post: Record<string, unknown>): Promise<string[]> => {
			// Use tags plugin to find relevant tags
			const allTags = await typedVault.tags.tags.list();
			const matchedTags: string[] = [];
			
			const textToSearch = `${post.title} ${post.selftext || ''}`.toLowerCase();
			
			for (const tag of allTags) {
				if (textToSearch.includes(tag.name.toLowerCase())) {
					matchedTags.push(tag.id);
					// Increment tag usage
					await vault.tags.tags.incrementUsage({ tagId: tag.id });
				}
			}
			
			// Also check for subreddit-specific tags
			const subredditTags = await vault.tags.tags.findByCategory({ 
				category: `subreddit:${post.subreddit}` 
			});
			
			for (const tag of subredditTags) {
				if (!matchedTags.includes(tag.id)) {
					matchedTags.push(tag.id);
				}
			}
			
			return matchedTags;
		};
		
		const analyzePostSentiment = async (post: Record<string, unknown>): Promise<{ score: number; confidence: number }> => {
			// Use sentiment plugin to analyze post
			const text = `${post.title} ${post.selftext || ''}`;
			const analysis = await vault.sentiment.analyze({ text });
			
			// Store sentiment history
			await vault.sentiment.recordSentiment({
				contentId: post.id as string,
				contentType: 'reddit_post',
				text,
				metadata: {
					subreddit: post.subreddit,
					author: post.author,
					score: post.score
				}
			});
			
			return {
				score: analysis.score,
				confidence: analysis.confidence
			};
		};
		
		const getTemplateForSubreddit = async (subreddit: string) => {
			const templates = await vault.reddit_annotator.annotation_templates.list();
			return templates.find(t => 
				t.enabled && 
				t.subreddit_patterns?.some(pattern => 
					new RegExp(pattern).test(subreddit)
				)
			) || null;
		};
		
		// Return extended vault with methods
		return {
			...vault,
			reddit_annotator: {
				...vault.reddit_annotator,
				
				// Main annotation method
				annotatePost: defineMutation({
					input: type({
						postId: 'string',
						annotatedBy: 'string = "system"',
						autoTag: 'boolean = true'
					}),
					handler: async ({ postId, annotatedBy, autoTag }) => {
						// Get post from reddit plugin
						const post = await vault.reddit.posts.get({ id: postId });
						if (!post) {
							throw new Error(`Post ${postId} not found`);
						}
						
						// Check if already annotated
						const existing = await vault.reddit_annotator.annotations.list();
						const existingAnnotation = existing.find(a => a.post_id === postId);
						if (existingAnnotation && !existingAnnotation.auto_generated) {
							return existingAnnotation;
						}
						
						// Get template if available
						const template = await getTemplateForSubreddit(post.subreddit);
						
						// Find matching tags
						let tagIds: string[] = [];
						if (autoTag) {
							tagIds = await findMatchingTags(post);
							
							// Add template tags if available
							if (template && template.auto_tags) {
								tagIds = [...new Set([...tagIds, ...template.auto_tags])];
							}
						}
						
						// Analyze sentiment
						const sentiment = await analyzePostSentiment(post);
						
						// Skip if confidence too low (based on template)
						if (template && sentiment.confidence < (template.min_sentiment_confidence || 0.5)) {
							console.log(`Skipping annotation for ${postId}: confidence too low`);
							return null;
						}
						
						// Create or update annotation
						const annotationData = {
							post_id: postId,
							tag_ids: tagIds,
							sentiment_score: sentiment.score,
							sentiment_confidence: sentiment.confidence,
							auto_generated: autoTag,
							reviewed: false,
							annotated_at: new Date(),
							annotated_by: annotatedBy
						};
						
						if (existingAnnotation) {
							return vault.reddit_annotator.annotations.update({
								id: existingAnnotation.id,
								...annotationData
							});
						} else {
							return vault.reddit_annotator.annotations.create(annotationData);
						}
					}
				}),
				
				// Bulk annotate posts
				bulk: {
					annotateSubreddit: defineMutation({
						input: type({ 
							subreddit: 'string',
							limit: 'number = 10',
							onlyNew: 'boolean = true' 
						}),
						handler: async ({ subreddit, limit, onlyNew }) => {
							// Get posts from subreddit
							const posts = await vault.reddit.posts.getBySubreddit({ subreddit });
							
							// Filter to only unannotated if requested
							let postsToAnnotate = posts.slice(0, limit);
							
							if (onlyNew) {
								const existing = await vault.reddit_annotator.annotations.list();
								const annotatedIds = new Set(existing.map(a => a.post_id));
								postsToAnnotate = posts
									.filter(p => !annotatedIds.has(p.id))
									.slice(0, limit);
							}
							
							// Annotate each post
							const results = await Promise.allSettled(
								postsToAnnotate.map(post => 
									vault.reddit_annotator.annotatePost({ 
										postId: post.id,
										autoTag: true 
									})
								)
							);
							
							return {
								total: postsToAnnotate.length,
								successful: results.filter(r => r.status === 'fulfilled').length,
								failed: results.filter(r => r.status === 'rejected').length,
								results: results.map((r, i) => ({
									postId: postsToAnnotate[i].id,
									status: r.status,
									result: r.status === 'fulfilled' ? r.value : null,
									error: r.status === 'rejected' ? r.reason?.message : null
								}))
							};
						}
					}),
					
					processQueue: defineMutation({
						input: type({ batchSize: 'number = 5' }),
						handler: async ({ batchSize }) => {
							// Get pending items from queue
							const queue = await vault.reddit_annotator.annotation_queue.list();
							const pending = queue
								.filter(item => item.status === 'pending')
								.sort((a, b) => (b.priority || 0) - (a.priority || 0))
								.slice(0, batchSize);
							
							const results = [];
							
							for (const item of pending) {
								try {
									// Update status to processing
									await vault.reddit_annotator.annotation_queue.update({
										id: item.id,
										status: 'processing',
										attempts: (item.attempts || 0) + 1
									});
									
									// Perform annotation
									const annotation = await vault.reddit_annotator.annotatePost({
										postId: item.post_id,
										autoTag: true
									});
									
									// Mark as completed
									await vault.reddit_annotator.annotation_queue.update({
										id: item.id,
										status: 'completed'
									});
									
									results.push({ item, annotation, success: true });
								} catch (error) {
									// Mark as failed
									await vault.reddit_annotator.annotation_queue.update({
										id: item.id,
										status: (item.attempts || 0) >= 3 ? 'failed' : 'pending',
										last_error: error instanceof Error ? error.message : 'Unknown error'
									});
									
									results.push({ item, error, success: false });
								}
							}
							
							return {
								processed: results.length,
								successful: results.filter(r => r.success).length,
								failed: results.filter(r => !r.success).length,
								results
							};
						}
					})
				},
				
				// Analysis methods
				analysis: {
					getPostAnnotation: defineQuery({
						input: type({ postId: 'string' }),
						handler: async ({ postId }) => {
							const annotations = await vault.reddit_annotator.annotations.list();
							const annotation = annotations.find(a => a.post_id === postId);
							
							if (!annotation) return null;
							
							// Get full post details
							const post = await vault.reddit.posts.get({ id: postId });
							
							// Get tag details
							const tags = await Promise.all(
								(annotation.tag_ids || []).map(async id => 
									vault.tags.tags.get({ id })
								)
							);
							
							// Get sentiment history
							const sentimentHistory = await vault.sentiment.getHistory({
								contentId: postId,
								contentType: 'reddit_post'
							});
							
							return {
								annotation,
								post,
								tags: tags.filter(Boolean),
								sentimentHistory
							};
						}
					}),
					
					getSubredditStats: defineQuery({
						input: type({ subreddit: 'string' }),
						handler: async ({ subreddit }) => {
							const posts = await vault.reddit.posts.getBySubreddit({ subreddit });
							const postIds = posts.map(p => p.id);
							
							const annotations = await vault.reddit_annotator.annotations.list();
							const subredditAnnotations = annotations.filter(a => 
								postIds.includes(a.post_id)
							);
							
							// Calculate stats
							const totalPosts = posts.length;
							const annotatedPosts = subredditAnnotations.length;
							const coverage = totalPosts > 0 ? annotatedPosts / totalPosts : 0;
							
							// Sentiment analysis
							const sentiments = subredditAnnotations
								.filter(a => a.sentiment_score != null)
								.map(a => a.sentiment_score || 0);
							
							const avgSentiment = sentiments.length > 0 
								? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length 
								: 0;
							
							// Tag frequency
							const tagFrequency: Record<string, number> = {};
							for (const annotation of subredditAnnotations) {
								for (const tagId of annotation.tag_ids || []) {
									tagFrequency[tagId] = (tagFrequency[tagId] || 0) + 1;
								}
							}
							
							// Get top tags
							const topTags = await Promise.all(
								Object.entries(tagFrequency)
									.sort(([, a], [, b]) => b - a)
									.slice(0, 10)
									.map(async ([tagId, count]) => {
										const tag = await vault.tags.tags.get({ id: tagId });
										return { tag, count };
									})
							);
							
							return {
								subreddit,
								totalPosts,
								annotatedPosts,
								coverage,
								avgSentiment,
								sentimentDistribution: {
									positive: sentiments.filter(s => s > 0.3).length,
									neutral: sentiments.filter(s => s >= -0.3 && s <= 0.3).length,
									negative: sentiments.filter(s => s < -0.3).length
								},
								topTags: topTags.filter(t => t.tag != null)
							};
						}
					})
				}
			}
		};
	}
});