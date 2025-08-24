#!/usr/bin/env bun

import { defineVault } from './src/vault';
import { redditPlugin } from './src/plugins/reddit';

/**
 * Demo of the vault API with nested structure and methods
 * 
 * API Pattern:
 * - vault.pluginName.tableName.method({params}) - Table operations
 * - vault.pluginName.method() - Plugin-level operations
 * - vault.method() - Core vault operations
 */
async function main() {
	console.log('🗄️  Vault API Demo\n');
	console.log('==========================\n');

	// Create vault with plugins
	const vault = defineVault({
		path: './demo-vault',
		plugins: [redditPlugin] as const,
		sqlite: {
			enabled: true,
			path: './demo-vault.db',
			syncInterval: 60000, // Sync every minute
		},
	});

	console.log('📦 Structure Overview:');
	console.log('  API: vault.reddit.posts.get({id})');
	console.log('  Filesystem: /demo-vault/reddit/posts/');
	console.log('  SQLite: reddit_posts table\n');

	// ============================================
	// TABLE-LEVEL OPERATIONS
	// ============================================
	
	console.log('📝 Creating Reddit posts...\n');

	// Create posts using the new API
	const post1 = await vault.reddit.posts.create({
		title: 'Understanding the New Vault Architecture',
		author: 'vault_architect',
		subreddit: 'programming',
		score: 156,
		num_comments: 23,
		created_at: new Date(),
		selftext: 'The new nested API provides better organization...',
		is_video: false,
		is_nsfw: false,
	});
	console.log(`  ✅ Created post: ${post1.id}`);

	const post2 = await vault.reddit.posts.create({
		title: 'TypeScript Plugin System Deep Dive',
		author: 'ts_expert',
		subreddit: 'typescript',
		score: 89,
		num_comments: 12,
		created_at: new Date(Date.now() - 3600000),
		selftext: 'Exploring how plugins extend the vault...',
		is_video: false,
		is_nsfw: false,
	});
	console.log(`  ✅ Created post: ${post2.id}`);

	// Create comments
	const comment1 = await vault.reddit.comments.create({
		body: 'This new structure is so much cleaner!',
		author: 'happy_dev',
		post_id: post1.id,
		parent_id: null,
		score: 45,
		created_at: new Date(),
		edited: false,
		awards: ['gold'],
	});
	console.log(`  ✅ Created comment: ${comment1.id}`);

	console.log('\n🔍 Reading data with new API...\n');

	// Get a single post
	const retrievedPost = await vault.reddit.posts.get({ id: post1.id });
	console.log(`  Post by ID: "${retrievedPost?.title}"`);

	// List all posts (simplified - no filters)
	const allPosts = await vault.reddit.posts.list();
	console.log(`  All posts: ${allPosts.length} found`);

	// Update a post
	const updatedPost = await vault.reddit.posts.update({
		id: post1.id,
		score: 200,
	});
	console.log(`  Updated post score: ${updatedPost.score}`);

	// Check if post exists
	const exists = await vault.reddit.posts.exists({ id: post1.id });
	console.log(`  Post exists: ${exists}`);

	// Count posts
	const postCount = await vault.reddit.posts.count();
	console.log(`  Total posts: ${postCount}`);

	// ============================================
	// TABLE CUSTOM METHODS
	// ============================================
	
	console.log('\n🎯 Using table custom methods...\n');

	// Get top posts (custom method)
	const topPosts = await vault.reddit.posts.getTopPosts({ limit: 3 });
	console.log(`  Top posts:`);
	topPosts.forEach(p => console.log(`    - "${p.title}" (score: ${p.score})`));

	// Get posts by subreddit
	const programmingPosts = await vault.reddit.posts.getBySubreddit({ subreddit: 'programming' });
	console.log(`  Posts in r/programming: ${programmingPosts.length}`);

	// Search posts
	const searchResults = await vault.reddit.posts.searchPosts({ query: 'TypeScript' });
	console.log(`  Posts mentioning TypeScript: ${searchResults.length}`);

	// Get comment thread
	const commentThread = await vault.reddit.comments.getCommentThread({ postId: post1.id });
	console.log(`  Comment thread for post: ${commentThread.length} root comments`);

	// ============================================
	// PLUGIN-LEVEL METHODS
	// ============================================
	
	console.log('\n🔌 Using plugin-level methods...\n');

	// Get Reddit statistics (plugin method)
	const redditStats = await vault.reddit.getStats({});
	console.log('  Reddit Statistics:');
	console.log(`    - Posts: ${redditStats.posts}`);
	console.log(`    - Comments: ${redditStats.comments}`);
	console.log(`    - Top post: "${redditStats.topPost?.title || 'N/A'}"`);

	// Search across all Reddit content
	const allResults = await vault.reddit.searchAll({ query: 'vault' });
	console.log(`  Global search for "vault":`);
	console.log(`    - Posts: ${allResults.posts.length}`);
	console.log(`    - Comments: ${allResults.comments.length}`);

	// Export all Reddit data
	const exported = await vault.reddit.exportAll({});
	console.log(`  Exported data:`);
	console.log(`    - ${exported.posts.length} posts`);
	console.log(`    - ${exported.comments.length} comments`);
	console.log(`    - ${exported.subreddits.length} subreddits`);

	// ============================================
	// CORE VAULT METHODS
	// ============================================
	
	console.log('\n⚙️  Using core vault methods...\n');

	// Get vault statistics
	const vaultStats = await vault.stats();
	console.log('  Vault Statistics:');
	console.log(`    - Plugins: ${vaultStats.plugins}`);
	console.log(`    - Tables: ${vaultStats.tables}`);
	console.log(`    - Total records: ${vaultStats.totalRecords}`);
	console.log('    - Table breakdown:');
	Object.entries(vaultStats.tableStats).forEach(([table, count]) => {
		console.log(`      - ${table}: ${count} records`);
	});

	// Export vault data
	const jsonExport = await vault.export('json');
	const exportData = JSON.parse(jsonExport);
	console.log(`\n  JSON Export: ${Object.keys(exportData).length} plugins`);

	const sqlExport = await vault.export('sql');
	const tableCount = (sqlExport.match(/CREATE TABLE/g) || []).length;
	console.log(`  SQL Export: ${tableCount} table definitions`);

	const markdownExport = await vault.export('markdown');
	const pluginCount = (markdownExport.match(/## Plugin:/g) || []).length;
	console.log(`  Markdown Export: ${pluginCount} plugins documented`);

	// Sync to SQLite
	console.log('\n  Syncing to SQLite...');
	await vault.sync();

	// ============================================
	// DEMONSTRATE FOLDER STRUCTURE
	// ============================================
	
	console.log('\n📁 Folder Structure Created:');
	console.log('  demo-vault/');
	console.log('  └── reddit/              (plugin folder)');
	console.log('      ├── posts/           (table folder)');
	console.log('      │   ├── reddit_posts_*.md');
	console.log('      │   └── ...');
	console.log('      ├── comments/        (table folder)');
	console.log('      │   ├── reddit_comments_*.md');
	console.log('      │   └── ...');
	console.log('      └── subreddits/      (table folder)');

	console.log('\n💾 SQLite Table Names:');
	console.log('  - reddit_posts          (flat naming)');
	console.log('  - reddit_comments       (flat naming)');
	console.log('  - reddit_subreddits     (flat naming)');

	// ============================================
	// TYPE SAFETY DEMONSTRATION
	// ============================================
	
	console.log('\n🔒 TypeScript Type Safety:');
	console.log('  ✅ vault.reddit.posts.get({ id: "123" })');
	console.log('  ✅ vault.reddit.getStats()');
	console.log('  ✅ vault.stats()');
	console.log('  ❌ vault.reddit.nonexistent - Type error');
	console.log('  ❌ vault.posts.get() - Type error (must use vault.reddit.posts)');
	console.log('  ❌ vault.reddit.posts.get() - Type error (missing {id} param)');

	// Clean up (delete a post to show delete works)
	const deleted = await vault.reddit.posts.delete({ id: post2.id });
	console.log(`\n🗑️  Cleanup: Deleted post2: ${deleted}`);

	console.log('\n✨ Demo complete! The new API provides:');
	console.log('   - Clear namespace separation (vault.pluginName.tableName)');
	console.log('   - Plugin-level methods (vault.pluginName.method)');
	console.log('   - Standardized CRUD ({id} parameter for get/update/delete)');
	console.log('   - Organized folder structure (/plugin/table/)');
	console.log('   - Flat SQLite tables (pluginId_tableName)');
}

// Run the demo
main().catch(console.error);