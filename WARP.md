# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Discord AI Moderator Bot is a Node.js application that uses OpenAI's API to automatically detect and moderate inappropriate content in Discord servers. It provides real-time content analysis, progressive moderation actions, and comprehensive logging.

## Development Commands

```bash
# Development with auto-restart
npm run dev

# Production mode
npm start

# Install dependencies
npm install
```

**Note**: This project currently has no test suite configured (`npm test` returns an error).

## Architecture Overview

### Core Components

**Main Bot Class (`src/bot.js`)**
- `DiscordAIModerator`: Central orchestrator that initializes Discord client, handles events, and coordinates moderation flow
- Manages user warning tracking with in-memory `Collection`
- Implements progressive moderation logic based on violation severity and warning counts

**AI Moderation Engine (`src/modules/aiModeration.js`)**
- **Dual-layered AI analysis**: Uses OpenAI Moderation API first (fast/cheap), then GPT-3.5-turbo for nuanced cases
- **Fallback system**: Keyword-based detection when AI services fail
- **Rate limiting**: Built-in 1-second intervals between API calls
- **Configurable thresholds**: Environment-based sensitivity controls

**Moderation Actions (`src/modules/moderationActions.js`)**
- **Progressive actions**: warn → timeout → ban based on severity and repeat offenses
- **Permission checking**: Validates bot permissions before taking actions
- **Admin protection**: Prevents actions against users with Administrator/ModerateMembers permissions
- **Rich embeds**: Sends detailed DM notifications to users

**Logging System (`src/modules/logger.js`)**
- **Multi-destination logging**: Console, file system, and Discord channel
- **Structured violation tracking**: JSON format with detailed metadata
- **Daily log rotation**: Separate files per day (bot-YYYY-MM-DD.log, violations-YYYY-MM-DD.json)

### Data Flow

1. **Message Reception**: Discord message event triggers analysis
2. **AI Analysis**: OpenAI moderation → GPT analysis → keyword fallback
3. **Decision Making**: Violation severity + warning history → action determination
4. **Action Execution**: Warning/timeout/ban + message deletion
5. **Logging**: Multi-format violation and action logging

### Key Environment Variables

Critical configuration in `.env`:

```env
# Required for operation
DISCORD_TOKEN=          # Bot authentication
OPENAI_API_KEY=        # AI analysis
AUTO_MODERATE=true     # Enable/disable moderation

# Behavior tuning
TOXICITY_THRESHOLD=0.7         # AI sensitivity (0.0-1.0)
SPAM_THRESHOLD=0.8
HARASSMENT_THRESHOLD=0.75
MAX_WARNINGS_BEFORE_TIMEOUT=3  # Progressive escalation
TIMEOUT_DURATION_MINUTES=10

# Optional features
LOG_CHANNEL_ID=        # Discord logging destination
ADMIN_ROLE_ID=         # Role bypassing moderation
```

## Development Guidelines

### Working with AI Analysis

- **OpenAI Moderation API** is the primary filter (categories: harassment, hate, sexual, self-harm, violence)
- **GPT-3.5-turbo** provides contextual analysis for edge cases
- **Keyword fallback** prevents total failure when APIs are down
- Modify `keywordFallback()` in `aiModeration.js` to add custom detection rules

### Adding New Moderation Actions

When extending `moderationActions.js`:
- Always check bot permissions before attempting actions
- Verify target user doesn't have admin/moderator permissions
- Send DM notifications before applying actions
- Use consistent embed styling and error handling

### Logging Customization

The `Logger` class supports:
- Custom log levels and destinations
- Structured violation data for analytics
- Discord webhook integration via `LOG_CHANNEL_ID`
- File-based persistence in `/logs` directory

### Error Handling Strategy

The bot implements graceful degradation:
- AI API failures → fallback to keyword detection
- Permission errors → log and continue
- DM failures → post temporary channel messages
- Missing channels → console-only logging

## File Structure Context

```
src/
├── bot.js                    # Main Discord client and event handling
└── modules/
    ├── aiModeration.js       # OpenAI integration and analysis logic
    ├── moderationActions.js  # Discord moderation API interactions
    └── logger.js            # Multi-destination logging system

logs/                        # Auto-generated daily log files
├── bot-YYYY-MM-DD.log       # General bot activity
└── violations-YYYY-MM-DD.json # Structured violation data
```

## Cost Management

The bot is optimized for cost efficiency:
- **Moderation API**: ~$0.002/1K tokens (primary analysis)
- **GPT-3.5-turbo**: ~$0.002/1K tokens (secondary analysis)
- **Rate limiting**: Prevents API spam
- **Tiered analysis**: Cheaper API first, GPT only for edge cases

Estimated operational cost: $0.10-$0.50 per 1000 messages.

## Common Development Tasks

### Testing Moderation Logic
- Use `AUTO_MODERATE=false` to disable live moderation during testing
- Monitor `logs/violations-*.json` for analysis accuracy
- Adjust threshold values in `.env` for sensitivity tuning

### Debugging AI Analysis
- Check OpenAI API key validity and credit balance
- Review console logs for API rate limiting or errors
- Use fallback detection to isolate AI vs. logic issues

### Adding Custom Detection Rules
- Extend `keywordFallback()` method for custom keywords
- Modify GPT prompt in `analyzeWithGPT()` for different criteria
- Consider threshold adjustments in environment variables

### Production Deployment Considerations
- Replace JSON file storage with database for scalability
- Implement user data persistence across bot restarts
- Consider Redis for warning count caching
- Monitor API costs and implement usage caps
