const OpenAI = require('openai');

class AIModeration {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Thresholds from environment variables
        this.toxicityThreshold = parseFloat(process.env.TOXICITY_THRESHOLD) || 0.7;
        this.spamThreshold = parseFloat(process.env.SPAM_THRESHOLD) || 0.8;
        this.harassmentThreshold = parseFloat(process.env.HARASSMENT_THRESHOLD) || 0.75;
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests

        // Blocked words management
        const fs = require('fs');
        const path = require('path');
        this.configDir = path.join(process.cwd(), 'config');
        this.blockedWordsFile = path.join(this.configDir, 'blocked_words.json');
        try {
            if (!fs.existsSync(this.configDir)) fs.mkdirSync(this.configDir, { recursive: true });
            if (!fs.existsSync(this.blockedWordsFile)) {
                fs.writeFileSync(this.blockedWordsFile, JSON.stringify({ words: [] }, null, 2));
            }
        } catch {}
        this.blockedWords = this.loadBlockedWords();
    }

    loadBlockedWords() {
        try {
            const fs = require('fs');
            const raw = fs.readFileSync(this.blockedWordsFile, 'utf8');
            const data = JSON.parse(raw);
            const list = Array.isArray(data.words) ? data.words : [];
            return [...new Set(list.map(w => String(w).toLowerCase().trim()).filter(Boolean))];
        } catch {
            return [];
        }
    }

    saveBlockedWords() {
        const fs = require('fs');
        try {
            fs.writeFileSync(this.blockedWordsFile, JSON.stringify({ words: this.blockedWords }, null, 2));
            return true;
        } catch {
            return false;
        }
    }

    addBlockedWords(words) {
        const items = (Array.isArray(words) ? words : [words])
            .map(w => String(w).toLowerCase().trim())
            .filter(Boolean);
        this.blockedWords = [...new Set([...(this.blockedWords || []), ...items])];
        return this.saveBlockedWords();
    }

    removeBlockedWord(word) {
        const w = String(word).toLowerCase().trim();
        this.blockedWords = (this.blockedWords || []).filter(x => x !== w);
        return this.saveBlockedWords();
    }

    getBlockedWords() { return this.blockedWords || []; }

    normalize(text) {
        return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    checkBlocked(content) {
        const words = this.getBlockedWords();
        if (!words.length) return null;
        const lower = (content || '').toLowerCase();
        const tokens = lower.match(/[a-z0-9]+/g) || [];
        const normalized = this.normalize(content);
        for (const w of words) {
            const nw = this.normalize(w);
            if (!nw) continue;
            // phrase match using normalized contains
            if (normalized.includes(nw)) return w;
            // word token exact match for single words
            if (!w.includes(' ') && tokens.includes(w)) return w;
        }
        return null;
    }

    getRateLimitMs() { return this.minRequestInterval; }
    setRateLimitMs(ms) {
        const v = parseInt(ms);
        if (!Number.isFinite(v) || v < 0) return false;
        this.minRequestInterval = v;
        return true;
    }

    getThresholds() {
        return {
            toxicity: this.toxicityThreshold,
            spam: this.spamThreshold,
            harassment: this.harassmentThreshold
        };
    }

    setThreshold(type, value) {
        const v = parseFloat(value);
        if (Number.isNaN(v) || v < 0 || v > 1) return false;
        switch ((type || '').toLowerCase()) {
            case 'toxicity':
                this.toxicityThreshold = v; return true;
            case 'spam':
                this.spamThreshold = v; return true;
            case 'harassment':
                this.harassmentThreshold = v; return true;
            default:
                return false;
        }
    }

    async analyzeMessage(content) {
        try {
            // Immediate blocklist check
            const hit = this.checkBlocked(content);
            if (hit) {
                return {
                    violation: true,
                    severity: 0.95,
                    type: 'blocked_word',
                    reason: `Contains blocked word or phrase: "${hit}"`,
                    confidence: 0.95,
                    details: { blocked_word: hit }
                };
            }

            // Rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.minRequestInterval) {
                await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
            }
            this.lastRequestTime = Date.now();

            // Use OpenAI's moderation endpoint first (faster and cheaper)
            const moderationResponse = await this.openai.moderations.create({
                model: 'omni-moderation-latest',
                input: content
            });

            const moderationResult = moderationResponse.results[0];
            
            // If OpenAI's moderation flags it, return violation
            if (moderationResult.flagged) {
                return this.processOpenAIModerationResult(moderationResult, content);
            }

            // For more nuanced analysis, use GPT with custom prompt
            const gptAnalysis = await this.analyzeWithGPT(content);
            
            return gptAnalysis;

        } catch (error) {
            console.error('Error in AI moderation:', error);
            
            // Fallback to simple keyword detection if AI fails
            return this.keywordFallback(content);
        }
    }

    processOpenAIModerationResult(result, content) {
        const categories = result.categories;
        const scores = result.category_scores;
        
        let highestScore = 0;
        let primaryViolation = '';
        let reason = '';

        // Check each category
        if (categories.harassment && scores.harassment > this.harassmentThreshold) {
            highestScore = Math.max(highestScore, scores.harassment);
            primaryViolation = 'harassment';
            reason = 'Message contains harassment or bullying content';
        }
        
        if (categories.hate && scores.hate > this.toxicityThreshold) {
            highestScore = Math.max(highestScore, scores.hate);
            primaryViolation = 'hate';
            reason = 'Message contains hate speech or discriminatory content';
        }
        
        if (categories['harassment/threatening'] && scores['harassment/threatening'] > this.harassmentThreshold) {
            highestScore = Math.max(highestScore, scores['harassment/threatening']);
            primaryViolation = 'threats';
            reason = 'Message contains threatening language';
        }
        
        if (categories['hate/threatening'] && scores['hate/threatening'] > this.toxicityThreshold) {
            highestScore = Math.max(highestScore, scores['hate/threatening']);
            primaryViolation = 'hate_threats';
            reason = 'Message contains threatening hate speech';
        }
        
        if (categories['self-harm'] && scores['self-harm'] > 0.5) {
            highestScore = Math.max(highestScore, scores['self-harm']);
            primaryViolation = 'self_harm';
            reason = 'Message contains self-harm content';
        }
        
        if (categories.sexual && scores.sexual > 0.8) {
            highestScore = Math.max(highestScore, scores.sexual);
            primaryViolation = 'sexual';
            reason = 'Message contains inappropriate sexual content';
        }

        return {
            violation: result.flagged && highestScore > 0.3,
            severity: highestScore,
            type: primaryViolation,
            reason: reason || 'Message violates community guidelines',
            confidence: highestScore,
            details: {
                openai_categories: categories,
                openai_scores: scores
            }
        };
    }

    async analyzeWithGPT(content) {
        const prompt = `Analyze this Discord message for moderation purposes. Evaluate it for:
1. Toxicity/harassment/bullying
2. Spam or repetitive content
3. Inappropriate content
4. Rule violations

Message: "${content}"

Respond with a JSON object containing:
- violation: boolean (true if violates rules)
- severity: number 0-1 (how severe the violation is)
- type: string (toxicity, spam, inappropriate, etc.)
- reason: string (brief explanation)
- confidence: number 0-1 (how confident you are)

Only flag clear violations. Be conservative with borderline cases.`;

        try {
            const model = process.env.GPT_MODEL || "gpt-3.5-turbo";
            const completion = await this.openai.chat.completions.create({
                model,
                messages: [
                    {
                        role: "system",
                        content: "You are a content moderation assistant. Analyze messages objectively and only flag clear violations of community standards."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.1
            });

            const response = completion.choices[0].message.content.trim();
            
            // Try to parse JSON response
            try {
                const analysis = JSON.parse(response);
                return {
                    violation: analysis.violation || false,
                    severity: analysis.severity || 0,
                    type: analysis.type || 'unknown',
                    reason: analysis.reason || 'Potential rule violation',
                    confidence: analysis.confidence || 0,
                    details: { gpt_analysis: analysis }
                };
            } catch (parseError) {
                console.error('Failed to parse GPT response:', parseError);
                return { violation: false, severity: 0, type: 'parse_error', reason: 'Analysis failed', confidence: 0 };
            }

        } catch (error) {
            console.error('GPT analysis failed:', error);
            return { violation: false, severity: 0, type: 'ai_error', reason: 'AI analysis unavailable', confidence: 0 };
        }
    }

    keywordFallback(content) {
        const lowerContent = content.toLowerCase();
        
        // Basic offensive keywords (expand as needed)
        const offensiveKeywords = [
            // Add your keywords here - keeping minimal for example
            'spam', 'scam', 'hack', 'cheat', 'bot'
        ];
        
        // Check for excessive repetition
        const words = content.split(' ');
        const repeatedWords = words.filter((word, index) => 
            words.indexOf(word) !== index && word.length > 3
        );
        
        const isSpam = repeatedWords.length > 3 || content.length > 1000;
        const hasOffensiveContent = offensiveKeywords.some(keyword => 
            lowerContent.includes(keyword)
        );
        
        if (isSpam || hasOffensiveContent) {
            return {
                violation: true,
                severity: isSpam ? 0.6 : 0.5,
                type: isSpam ? 'spam' : 'inappropriate',
                reason: isSpam ? 'Message appears to be spam' : 'Message contains inappropriate content',
                confidence: 0.4,
                details: { fallback_detection: true }
            };
        }
        
        return {
            violation: false,
            severity: 0,
            type: 'clean',
            reason: 'No violations detected',
            confidence: 0.3,
            details: { fallback_detection: true }
        };
    }
}

module.exports = AIModeration;
