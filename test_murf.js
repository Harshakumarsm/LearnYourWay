// Test Murf AI API connectivity
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MURF_API_KEY = process.env.MURF_API_KEY;
const MURF_BASE_URL = 'https://api.murf.ai/v1';

async function testMurfAPI() {
  console.log('=== Murf AI API Test ===');
  console.log('API Key:', MURF_API_KEY ? `${MURF_API_KEY.substring(0, 10)}...` : 'Not configured');
  console.log('Base URL:', MURF_BASE_URL);
  
  if (!MURF_API_KEY || MURF_API_KEY === 'your_murf_api_key_here') {
    console.error('❌ Murf API key not configured properly');
    return;
  }

  try {
    // Test with a simple text
    const testText = "Hello, this is a test of the Murf AI text-to-speech service.";
    const voiceId = "en-US-terrell";
    
    console.log('\n🔄 Testing TTS generation...');
    console.log('Voice ID:', voiceId);
    console.log('Text:', testText);
    
    const response = await axios.post(`${MURF_BASE_URL}/speech/generate`, {
      text: testText,
      voiceId: voiceId,
      format: 'WAV',
      channelType: 'STEREO',
      sampleRate: 44100,
      model: 'GEN2'
    }, {
      headers: {
        'api-key': MURF_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('\n✅ Success!');
    console.log('Status:', response.status);
    console.log('Response keys:', Object.keys(response.data));
    
    if (response.data.audio_file) {
      console.log('Audio URL:', response.data.audio_file);
      console.log('✅ Audio file generated successfully!');
    } else {
      console.log('⚠️ No audio_file in response');
      console.log('Full response:', response.data);
    }
    
  } catch (error) {
    console.log('\n❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Data:', error.response?.data);
    console.log('Error Message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('🔑 Authentication failed - check your API key');
    } else if (error.response?.status === 429) {
      console.log('⏰ Rate limit exceeded - wait before trying again');
    } else if (error.response?.status === 400) {
      console.log('📝 Bad request - check voice ID or parameters');
    }
  }
}

// Run the test
testMurfAPI().catch(console.error);
