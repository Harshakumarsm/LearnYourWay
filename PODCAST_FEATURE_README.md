# 🎙️ HearMe AI Podcast Generator

A powerful feature that generates AI-powered podcast conversations about any topic using advanced text-to-speech technology.

## ✨ Features

- **AI-Generated Conversations**: Creates natural podcast-style dialogues between a host and expert
- **Dual Voice System**: Uses two distinct voices (Terrell - Male Host, Julia - Female Expert)
- **High-Quality Audio**: Generates WAV audio files in stereo at 44.1kHz
- **Seamless Playback**: Combines multiple audio segments for uninterrupted listening
- **Download Support**: Save podcasts locally for offline listening
- **Fallback Mode**: Works even without TTS API key (script-only mode)

## 🎯 How It Works

1. **User Input**: User enters a topic they want to learn about
2. **Script Generation**: AI (Gemini) creates a conversational podcast script
3. **Voice Assignment**: Script is parsed and assigned to different speakers
4. **Audio Generation**: Each segment is converted to speech using Murf AI TTS
5. **Audio Concatenation**: All segments are combined into a single podcast file
6. **Streaming**: Audio is streamed directly to the user's browser

## 🔧 Technical Implementation

### Backend Components

- **`podcast_helpers.js`**: Core podcast generation logic
- **`server.js`**: Express endpoint `/generate-podcast`
- **Murf AI Integration**: Text-to-speech conversion with multiple voices

### Frontend Components

- **`HearMeModal.tsx`**: React component for podcast generation UI
- **Audio Player**: Built-in HTML5 audio controls
- **Download Functionality**: Direct audio file download

## 🎵 Voice Configuration

```javascript
const PODCAST_VOICES = {
  host: 'en-US-terrell',     // Male voice for host
  guest: 'en-US-julia'       // Female voice for guest/expert
};
```

## 🔑 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Murf AI TTS API Key (required for audio generation)
MURF_API_KEY=your_murf_api_key_here

# Gemini API Key (for script generation)
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📡 API Endpoints

### POST `/generate-podcast`

Generates a podcast about the specified topic.

**Request:**
```json
{
  "topic": "Machine Learning"
}
```

**Response (Success - Audio):**
- Content-Type: `audio/wav`
- Content-Disposition: `attachment; filename="Machine_Learning_podcast.wav"`
- Body: Binary audio data

**Response (Fallback - Script Only):**
```json
{
  "topic": "Machine Learning",
  "script": "HOST: Welcome everyone! Today we're diving into...",
  "segments": [
    {
      "speaker": "host",
      "text": "Welcome everyone! Today we're diving into..."
    }
  ],
  "fallback": true,
  "message": "Script generated successfully. Audio generation requires Murf AI API key."
}
```

## 🎛️ Usage Examples

### Basic Usage
1. Open the HearMe AI modal
2. Enter a topic (e.g., "Climate Change", "History of Rome")
3. Click "Generate AI Podcast"
4. Wait for processing (typically 30-60 seconds)
5. Play or download the generated podcast

### Supported Topics
- Scientific concepts (Physics, Chemistry, Biology)
- Historical events and periods
- Technology and programming
- Arts and literature
- Current events and politics
- Philosophy and psychology
- And much more!

## 🔧 Development

### Testing the Integration

Run the test script to verify Murf AI integration:

```bash
node test_murf_integration.js
```

### Adding New Voices

To add more voice options, update the `PODCAST_VOICES` configuration:

```javascript
const PODCAST_VOICES = {
  host: 'en-US-terrell',
  guest: 'en-US-julia',
  narrator: 'en-US-marcus'  // Additional voice
};
```

### Customizing Script Generation

Modify the prompt in `generatePodcastScript()` to change the conversation style:

```javascript
const prompt = `Create a podcast-style conversation about "${topic}". 
// Your custom prompt here...
`;
```

## 🚀 Performance Considerations

- **Rate Limiting**: 1-second delay between TTS requests to avoid API limits
- **Error Handling**: Graceful fallback to script-only mode if audio generation fails
- **Memory Management**: Audio buffers are processed and released efficiently
- **Streaming**: Large audio files are streamed directly to avoid memory issues

## 🐛 Troubleshooting

### Common Issues

1. **"Murf API key not configured"**
   - Ensure `MURF_API_KEY` is set in `.env.local`
   - Verify the API key is valid and has sufficient credits

2. **"Audio generation failed"**
   - Check network connectivity
   - Verify API rate limits haven't been exceeded
   - Check Murf AI service status

3. **"Script generation failed"**
   - Ensure `GEMINI_API_KEY` is configured
   - Check Gemini API quota and limits

### Debug Mode

Enable detailed logging by setting:
```javascript
console.log('Debug mode enabled');
```

## 📈 Future Enhancements

- [ ] Support for more languages and voices
- [ ] Custom voice selection
- [ ] Background music integration
- [ ] Podcast episode series
- [ ] Social sharing features
- [ ] Transcript generation
- [ ] Audio quality options (MP3, different sample rates)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the LearnYourWay application. See the main project license for details.
