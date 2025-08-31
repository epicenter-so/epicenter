import { definePlugin, defineQuery, defineMutation } from '../plugin';
import { type } from 'arktype';

/**
 * Sentiment analysis plugin
 * Provides sentiment scoring and analysis capabilities
 * No dependencies - can be used by other plugins
 */
export const sentimentPlugin = definePlugin({
	id: 'sentiment',
	name: 'Sentiment Analysis',

	tables: {
		sentiment_scores: {
			schema: {
				content_id: { type: 'string', required: true },
				content_type: { type: 'string', required: true },
				score: { type: 'number', required: true }, // -1 to 1
				confidence: { type: 'number', required: true }, // 0 to 1
				analyzed_at: { type: 'date', required: true },
				metadata: { type: 'object' },
			},
		},

		sentiment_rules: {
			schema: {
				pattern: { type: 'string', required: true },
				score_modifier: { type: 'number', required: true },
				category: { type: 'string' },
				enabled: { type: 'boolean', default: true },
			},
		},
	},

	// Transform to add analysis methods
	transform: (vault) => {
		// Helper function for basic sentiment analysis
		const analyzeSentiment = (
			text: string,
		): { score: number; confidence: number } => {
			// Simple rule-based sentiment (in production, use ML model)
			const positiveWords = [
				'good',
				'great',
				'excellent',
				'amazing',
				'love',
				'best',
				'awesome',
			];
			const negativeWords = [
				'bad',
				'terrible',
				'worst',
				'hate',
				'awful',
				'horrible',
				'poor',
			];

			const lowercaseText = text.toLowerCase();
			let score = 0;
			let matches = 0;

			for (const word of positiveWords) {
				if (lowercaseText.includes(word)) {
					score += 1;
					matches++;
				}
			}

			for (const word of negativeWords) {
				if (lowercaseText.includes(word)) {
					score -= 1;
					matches++;
				}
			}

			const wordCount = text.split(/\s+/).length;
			const confidence = Math.min(matches / Math.max(wordCount * 0.1, 1), 1);
			const normalizedScore = Math.max(
				-1,
				Math.min(1, score / Math.max(matches, 1)),
			);

			return { score: normalizedScore, confidence };
		};

		return {
			...vault,
			sentiment: {
				...vault.sentiment,

				// Main analysis method
				analyze: defineQuery({
					input: type({ text: 'string' }),
					handler: async ({ text }) => {
						const result = analyzeSentiment(text);
						return {
							score: result.score,
							confidence: result.confidence,
							classification:
								result.score > 0.3
									? 'positive'
									: result.score < -0.3
										? 'negative'
										: 'neutral',
						};
					},
				}),

				// Batch analysis
				analyzeBatch: defineQuery({
					input: type({ texts: 'string[]' }),
					handler: async ({ texts }) => {
						return texts.map((text) => {
							const result = analyzeSentiment(text);
							return {
								text,
								score: result.score,
								confidence: result.confidence,
								classification:
									result.score > 0.3
										? 'positive'
										: result.score < -0.3
											? 'negative'
											: 'neutral',
							};
						});
					},
				}),

				// Store sentiment score
				recordSentiment: defineMutation({
					input: type({
						contentId: 'string',
						contentType: 'string',
						text: 'string',
					}),
					handler: async ({ contentId, contentType, text }) => {
						const result = analyzeSentiment(text);

						return vault.sentiment.sentiment_scores.create({
							content_id: contentId,
							content_type: contentType,
							score: result.score,
							confidence: result.confidence,
							analyzed_at: new Date(),
						});
					},
				}),

				// Get sentiment history
				getHistory: defineQuery({
					input: type({
						contentId: 'string',
						contentType: 'string?',
					}),
					handler: async ({ contentId, contentType }) => {
						const scores = await vault.sentiment.sentiment_scores.list();
						return scores
							.filter(
								(s) =>
									s.content_id === contentId &&
									(!contentType || s.content_type === contentType),
							)
							.sort(
								(a, b) =>
									new Date(b.analyzed_at).getTime() -
									new Date(a.analyzed_at).getTime(),
							);
					},
				}),

				// Get aggregate stats
				getStats: defineQuery({
					input: type({
						contentType: 'string?',
						since: 'string?',
					}),
					handler: async ({ contentType, since }) => {
						const scores = await vault.sentiment.sentiment_scores.list();
						const sinceDate = since ? new Date(since) : null;

						const filtered = scores.filter(
							(s) =>
								(!contentType || s.content_type === contentType) &&
								(!sinceDate || new Date(s.analyzed_at) >= sinceDate),
						);

						if (filtered.length === 0) {
							return {
								count: 0,
								averageScore: 0,
								averageConfidence: 0,
								distribution: { positive: 0, neutral: 0, negative: 0 },
							};
						}

						const totalScore = filtered.reduce((sum, s) => sum + s.score, 0);
						const totalConfidence = filtered.reduce(
							(sum, s) => sum + s.confidence,
							0,
						);

						return {
							count: filtered.length,
							averageScore: totalScore / filtered.length,
							averageConfidence: totalConfidence / filtered.length,
							distribution: {
								positive: filtered.filter((s) => s.score > 0.3).length,
								neutral: filtered.filter(
									(s) => s.score >= -0.3 && s.score <= 0.3,
								).length,
								negative: filtered.filter((s) => s.score < -0.3).length,
							},
						};
					},
				}),
			},
		};
	},
});
