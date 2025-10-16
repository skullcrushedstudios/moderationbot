# Discord AI Moderator Bot

A powerful Discord moderation bot that uses OpenAI's AI models to automatically detect and moderate inappropriate content, spam, harassment, and other rule violations in real-time.

## Features

- 🤖 **AI-Powered Detection**: Uses OpenAI's moderation API and GPT models for intelligent content analysis
- ⚡ **Real-time Moderation**: Automatically processes messages as they're sent
- 🎯 **Configurable Thresholds**: Customize sensitivity levels for different types of violations
- 📊 **Progressive Actions**: Escalating responses from warnings to timeouts to bans
- 📝 **Comprehensive Logging**: Detailed logs both to files and Discord channels
- 🛡️ **Admin Protection**: Automatically excludes administrators and moderators from actions
- 🔄 **Fallback Detection**: Keyword-based backup when AI services are unavailable
- ⚙️ **Highly Configurable**: Extensive environment variable configuration

## Violation Detection

The bot can detect and moderate:

- **Harassment & Bullying**: Targeted abuse, threats, and intimidation
- **Hate Speech**: Discriminatory content and slurs
- **Inappropriate Sexual Content**: NSFW content in general channels
- **Spam**: Repetitive messages and promotional content
- **Self-harm Content**: Messages promoting harmful behaviors
- **Custom Rules**: Configurable keyword detection

## Installation & Setup

### Prerequisites

- Node.js 18.0.0 or higher
- A Discord bot token
- An OpenAI API key
- Discord server with appropriate permissions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd discord-ai-moderator-bot
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Bot Configuration
LOG_CHANNEL_ID=your_log_channel_id_here
ADMIN_ROLE_ID=your_admin_role_id_here

# Moderation Settings
AUTO_MODERATE=true
TOXICITY_THRESHOLD=0.7
SPAM_THRESHOLD=0.8
HARASSMENT_THRESHOLD=0.75

# Action Settings
WARN_ON_VIOLATION=true
TIMEOUT_DURATION_MINUTES=10
BAN_ON_REPEAT_OFFENSE=false
MAX_WARNINGS_BEFORE_TIMEOUT=3
```

### 3. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token to your `.env` file
4. Enable the following bot permissions:
   - Read Messages
   - Send Messages
   - Manage Messages
   - Timeout Members
   - Kick Members
   - Ban Members (optional)
   - Read Message History

5. Invite the bot to your server with the required permissions

### 4. OpenAI API Setup

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add the key to your `.env` file
4. Ensure you have sufficient credits/usage limits

## Running the Bot

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## Configuration Options

### Moderation Thresholds

- `TOXICITY_THRESHOLD`: Sensitivity for hate speech detection (0.0-1.0)
- `SPAM_THRESHOLD`: Sensitivity for spam detection (0.0-1.0)
- `HARASSMENT_THRESHOLD`: Sensitivity for harassment detection (0.0-1.0)

### Action Settings

- `MAX_WARNINGS_BEFORE_TIMEOUT`: Number of warnings before timeout
- `TIMEOUT_DURATION_MINUTES`: Duration of timeout in minutes
- `BAN_ON_REPEAT_OFFENSE`: Whether to ban users after multiple severe violations
- `WARN_ON_VIOLATION`: Whether to send warnings for violations

### Bot Behavior

- `AUTO_MODERATE`: Enable/disable automatic moderation
- `LOG_CHANNEL_ID`: Discord channel ID for moderation logs
- `ADMIN_ROLE_ID`: Role ID that bypasses moderation

## How It Works

### Detection Process

1. **Message Analysis**: Every message is analyzed using OpenAI's moderation API
2. **Severity Assessment**: The AI assigns severity and confidence scores
3. **Action Determination**: Based on severity and user history, appropriate action is taken
4. **Logging**: All violations and actions are logged for review

### Progressive Actions

1. **First Violation**: Warning sent to user
2. **Multiple Warnings**: Timeout applied
3. **Severe Violations**: Immediate timeout or ban
4. **Repeat Offenses**: Escalated consequences

## File Structure

```
discord-ai-moderator-bot/
├── src/
│   ├── bot.js                 # Main bot file
│   └── modules/
│       ├── aiModeration.js    # AI analysis logic
│       ├── moderationActions.js # Action execution
│       └── logger.js          # Logging system
├── logs/                      # Generated log files
├── package.json
├── .env.example               # Environment template
├── .gitignore
└── README.md
```

## Logging

The bot creates comprehensive logs in the `logs/` directory:

- `bot-YYYY-MM-DD.log`: General bot activity logs
- `violations-YYYY-MM-DD.json`: Detailed violation data

### Discord Channel Logging

Set `LOG_CHANNEL_ID` to receive real-time moderation alerts with:
- User information and violation details
- AI confidence scores and reasoning
- Actions taken and warning counts

## API Usage & Costs

### OpenAI API Usage

- **Moderation API**: ~$0.0020 per 1K tokens (very cost-effective)
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (for nuanced analysis)

The bot is designed to minimize costs by:
- Using the cheaper moderation API first
- Only calling GPT for edge cases
- Implementing rate limiting
- Fallback to keyword detection

Estimated cost: **$0.10-$0.50 per 1000 messages** depending on configuration.

## Troubleshooting

### Common Issues

1. **Bot doesn't respond to violations**
   - Check `AUTO_MODERATE=true` in `.env`
   - Verify bot has message content intent enabled
   - Confirm OpenAI API key is valid

2. **Missing permissions errors**
   - Ensure bot role is above moderated roles
   - Check all required permissions are granted
   - Verify bot can access the target channels

3. **AI analysis failures**
   - Check OpenAI API key and credit balance
   - Monitor console for error messages
   - Bot will fallback to keyword detection

4. **Logs not appearing in Discord**
   - Verify `LOG_CHANNEL_ID` is correct
   - Check bot can send messages to log channel
   - Ensure channel exists and bot has access

## Advanced Usage

### Custom Keywords

Edit the `keywordFallback` method in `src/modules/aiModeration.js` to add custom keywords:

```javascript
const offensiveKeywords = [
    'spam', 'scam', 'hack', 'cheat', 'bot',
    // Add your custom keywords here
    'customword1', 'customword2'
];
```

### Adjusting AI Analysis

Modify the GPT prompt in `analyzeWithGPT` method to customize detection criteria:

```javascript
const prompt = `Analyze this Discord message for moderation purposes...`;
```

### Database Integration

For production use, consider replacing the JSON file logging with a database:
- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching user warnings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security Considerations

- Never commit `.env` files to version control
- Regularly rotate API keys
- Monitor API usage and costs
- Review moderation logs for false positives
- Keep dependencies updated

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Open an issue on GitHub
4. Join our Discord server for community support

## Changelog

### v1.0.0
- Initial release with AI-powered moderation
- OpenAI integration with fallback detection
- Comprehensive logging system
- Progressive moderation actions
- Configurable thresholds and actions

---

**⚠️ Important**: This bot makes moderation decisions based on AI analysis. While highly accurate, always review moderation logs and be prepared to manually override decisions when necessary. The AI is a tool to assist human moderators, not replace them entirely.
#   m o d e r a t i o n b o t  
 