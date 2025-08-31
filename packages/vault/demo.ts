#!/usr/bin/env bun

/**
 * Demo showcasing the new transform pattern and dependency system
 * Run with: bun demo.ts
 */

import { defineVault } from './src/vault';
import { redditPlugin } from './src/plugins/reddit';
import { tagsPlugin } from './src/plugins/tags';
import { sentimentPlugin } from './src/plugins/sentiment';
import { redditAnnotatorPlugin } from './src/plugins/reddit-annotator';

async function main() {
	console.log('🚀 Vault Transform Pattern Demo\n');
	console.log('=' .repeat(50));
	
	// Create vault with all plugins
	// Dependencies are automatically resolved!
	const vault = defineVault({
		path: './demo-vault',
		plugins: [
			redditPlugin,
			tagsPlugin,
			sentimentPlugin,
			redditAnnotatorPlugin // Has dependencies on the above three
		]
	});
	
	console.log('\n📦 Vault created with plugins:');
	console.log('  - Reddit (base plugin)');
	console.log('  - Tags (base plugin)');
	console.log('  - Sentiment (base plugin)');
	console.log('  - Reddit Annotator (depends on all above)');
	
	// Demo 1: Basic CRUD operations (provided by base)
	console.log('\n\n1️⃣ BASIC CRUD OPERATIONS');
	console.log('-' .repeat(30));
	
	// Create a Reddit post
	const post = await vault.reddit.posts.create({
		title: 'Amazing TypeScript feature I just discovered!',
		author: 'demo_user',
		subreddit: 'typescript',
		score: 42,
		num_comments: 5,
		created_at: new Date(),
		selftext: 'Just found out about the new satisfies operator. This is great for type checking!'
	});
	console.log('✅ Created post:', post.id);
	
	// Create some tags
	const tag1 = await vault.tags.tags.create({
		name: 'typescript',
		color: '#007ACC',
		category: 'programming',
		description: 'TypeScript related content',
		created_at: new Date()
	});
	console.log('✅ Created tag:', tag1.name);
	
	const tag2 = await vault.tags.tags.create({
		name: 'feature',
		color: '#00FF00',
		category: 'content-type',
		created_at: new Date()
	});
	console.log('✅ Created tag:', tag2.name);
	
	// Demo 2: Plugin methods (added via transform)
	console.log('\n\n2️⃣ PLUGIN METHODS (via transform)');
	console.log('-' .repeat(30));
	
	// Use Reddit plugin methods
	const topPosts = await vault.reddit.posts.getTopPosts({ limit: 5 });
	console.log(`📊 Top posts: ${topPosts.length} found`);
	
	// Use Tags plugin methods
	const popularTags = await vault.tags.getPopularTags({ limit: 5 });
	console.log(`🏷️ Popular tags: ${popularTags.length} found`);
	
	const categories = await vault.tags.getCategories();
	console.log(`📁 Tag categories:`, categories);
	
	// Demo 3: Sentiment analysis
	console.log('\n\n3️⃣ SENTIMENT ANALYSIS');
	console.log('-' .repeat(30));
	
	const sentiment = await vault.sentiment.analyze({
		text: post.title + ' ' + post.selftext
	});
	console.log(`😊 Sentiment analysis:`);
	console.log(`  - Score: ${sentiment.score.toFixed(2)}`);
	console.log(`  - Confidence: ${(sentiment.confidence * 100).toFixed(1)}%`);
	console.log(`  - Classification: ${sentiment.classification}`);
	
	// Demo 4: Complex plugin with dependencies
	console.log('\n\n4️⃣ PLUGIN WITH DEPENDENCIES');
	console.log('-' .repeat(30));
	
	// Reddit Annotator uses Reddit, Tags, and Sentiment plugins!
	const annotation = await vault.reddit_annotator.annotatePost({
		postId: post.id,
		annotatedBy: 'demo'
	});
	
	if (annotation) {
		console.log('📝 Post annotated:');
		console.log(`  - Tags found: ${annotation.tag_ids.length}`);
		console.log(`  - Sentiment: ${annotation.sentiment_score?.toFixed(2)}`);
		console.log(`  - Confidence: ${((annotation.sentiment_confidence || 0) * 100).toFixed(1)}%`);
	}
	
	// Get full analysis
	const fullAnalysis = await vault.reddit_annotator.analysis.getPostWithAnnotations({
		postId: post.id
	});
	
	if (fullAnalysis) {
		console.log('\n📊 Full post analysis:');
		console.log(`  - Post: "${fullAnalysis.post.title}"`);
		console.log(`  - Tags:`, fullAnalysis.tags.map(t => t?.name).join(', '));
		console.log(`  - Sentiment history:`, fullAnalysis.sentimentHistory.length, 'records');
	}
	
	// Demo 5: Bulk operations
	console.log('\n\n5️⃣ BULK OPERATIONS');
	console.log('-' .repeat(30));
	
	// Create more posts for bulk demo
	const posts = await Promise.all([
		vault.reddit.posts.create({
			title: 'React vs Vue in 2024',
			author: 'user1',
			subreddit: 'webdev',
			score: 100,
			num_comments: 50,
			created_at: new Date(),
			selftext: 'What are your thoughts on React vs Vue?'
		}),
		vault.reddit.posts.create({
			title: 'Best practices for Node.js security',
			author: 'user2',
			subreddit: 'node',
			score: 75,
			num_comments: 20,
			created_at: new Date(),
			selftext: 'Here are some security tips for Node.js applications...'
		}),
		vault.reddit.posts.create({
			title: 'TypeScript 5.0 features',
			author: 'user3',
			subreddit: 'typescript',
			score: 200,
			num_comments: 30,
			created_at: new Date(),
			selftext: 'Excited about the new features in TypeScript 5.0!'
		})
	]);
	console.log(`✅ Created ${posts.length} more posts`);
	
	// Bulk annotate
	const bulkResult = await vault.reddit_annotator.bulk.annotateSubreddit({
		subreddit: 'typescript',
		limit: 10,
		onlyNew: true
	});
	
	console.log('📦 Bulk annotation results:');
	console.log(`  - Requested: ${bulkResult.requested}`);
	console.log(`  - Processed: ${bulkResult.processed}`);
	console.log(`  - Successful: ${bulkResult.successful}`);
	console.log(`  - Failed: ${bulkResult.failed}`);
	
	// Get subreddit statistics
	const stats = await vault.reddit_annotator.analysis.getSubredditStats({
		subreddit: 'typescript'
	});
	
	console.log('\n📈 Subreddit statistics:');
	console.log(`  - Total posts: ${stats.totalPosts}`);
	console.log(`  - Annotated: ${stats.annotatedPosts}`);
	console.log(`  - Coverage: ${(stats.coverage * 100).toFixed(1)}%`);
	console.log(`  - Avg sentiment: ${stats.averageSentiment.toFixed(2)}`);
	console.log(`  - Top tags:`, stats.topTags.slice(0, 3).map(t => t.name).join(', '));
	
	// Demo 6: Core vault methods
	console.log('\n\n6️⃣ CORE VAULT METHODS');
	console.log('-' .repeat(30));
	
	const vaultStats = await vault.stats();
	console.log('📊 Vault statistics:');
	console.log(`  - Plugins: ${vaultStats.plugins}`);
	console.log(`  - Tables: ${vaultStats.tables}`);
	console.log(`  - Total records: ${vaultStats.totalRecords}`);
	
	// Export as markdown
	const markdown = await vault.export('markdown');
	console.log('\n📝 Vault structure (markdown):');
	console.log(markdown.split('\n').slice(0, 10).join('\n'));
	console.log('...');
	
	// Demo 7: Method composition with helpers
	console.log('\n\n7️⃣ NESTED METHOD ORGANIZATION');
	console.log('-' .repeat(30));
	
	// Methods can be organized in nested structures
	console.log('🗂️ Available method paths:');
	console.log('  - vault.reddit.posts.getTopPosts()');
	console.log('  - vault.reddit.posts.getBySubreddit()');
	console.log('  - vault.tags.tags.findByName()');
	console.log('  - vault.reddit_annotator.bulk.annotateSubreddit()');
	console.log('  - vault.reddit_annotator.analysis.getSubredditStats()');
	
	console.log('\n✨ All methods have full type safety and IntelliSense!');
	
	console.log('\n\n' + '=' .repeat(50));
	console.log('✅ Demo completed successfully!');
	console.log('\nKey features demonstrated:');
	console.log('  1. Transform pattern for extending plugins');
	console.log('  2. Dependency resolution and injection');
	console.log('  3. Cross-plugin communication');
	console.log('  4. Nested method organization');
	console.log('  5. Full TypeScript type safety');
}

// Run the demo
main().catch(console.error);