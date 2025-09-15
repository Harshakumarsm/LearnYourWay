# 🔧 Podcast Feature Configuration Guide

## Required API Keys

To enable the full podcast generation feature, you need to configure the following API keys:

### 1. Murf AI TTS API Key

**Purpose**: Generates high-quality audio from text using two different voices

**How to get it**:
1. Visit [Murf AI API Dashboard](https://murf.ai/api-dashboard)
2. Sign up for an account
3. Generate your API key
4. Add it to your `.env.local` file

**Configuration**:
```env
MURF_API_KEY=your_actual_murf_api_key_here
```

**Voice Options Available**:
- `en-US-terrell` (Male Host Voice)
- `en-US-julia` (Female Expert Voice)
- Many more voices available in different languages

### 2. Gemini API Key

**Purpose**: Generates conversational podcast scripts about any topic

**How to get it**:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add it to your `.env.local` file

**Configuration**:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Environment File Setup

Create a `.env.local` file in your project root with the following content:

```env
# Murf AI TTS API Key (required for audio generation)
MURF_API_KEY=your_murf_api_key_here

# Gemini API Key (required for script generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Optional: Server port
PORT=3001
```

## Testing Your Configuration

1. **Test Script Generation**:
   ```bash
   # This will work even without Murf API key
   node test_murf_integration.js
   ```

2. **Test Full Integration**:
   - Start your server: `npm run dev` (in server directory)
   - Start your frontend: `npm run dev` (in root directory)
   - Open the HearMe AI modal and try generating a podcast

## Troubleshooting

### "Murf API key not configured"
- Check that your `.env.local` file exists
- Verify the `MURF_API_KEY` variable is set correctly
- Make sure the API key is valid and active

### "Audio generation failed"
- Check your Murf AI account credits/usage limits
- Verify network connectivity
- Check if the API key has the correct permissions

### "Script generation failed"
- Verify your Gemini API key is correct
- Check your Google AI Studio quota
- Ensure the API key has access to the Gemini API

## Fallback Mode

The feature works in fallback mode even without API keys:
- **Without Murf API**: Generates script only (no audio)
- **Without Gemini API**: Shows error message
- **With both APIs**: Full podcast generation with audio

## Cost Considerations

- **Murf AI**: Pay-per-character for TTS generation
- **Gemini API**: Free tier available with usage limits
- **Typical podcast**: ~500-1000 characters = ~$0.01-0.02

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API keys secure and rotate them regularly
- Use environment-specific keys for production
