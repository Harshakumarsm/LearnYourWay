import axios from 'axios';
import dotenv from 'dotenv';
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env.local' });

// Murf AI TTS Configuration
const MURF_API_KEY = process.env.MURF_API_KEY;
const MURF_BASE_URL = 'https://api.murf.ai/v1';

// Debug configuration
console.log('Murf API Key configured:', MURF_API_KEY ? 'Yes' : 'No');
console.log('Murf API Key length:', MURF_API_KEY ? MURF_API_KEY.length : 0);
console.log('Murf API Key starts with:', MURF_API_KEY ? MURF_API_KEY.substring(0, 10) + '...' : 'N/A');

// Voice configurations for podcast-style conversation
const PODCAST_VOICES = {
  host: 'en-US-terrell',     // Male voice for host
  guest: 'en-US-julia'       // Female voice for guest/expert
};

/**
 * Generate podcast script using Gemini API
 */
async function generatePodcastScript(topic) {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const { geminiQuery } = require('./chat_helpers');
  
  const prompt = `Create a podcast-style conversation about "${topic}". 

Format it as a natural dialogue between two people:
- HOST: A curious interviewer asking questions
- EXPERT: A knowledgeable person explaining the topic

Requirements:
- Make it conversational and engaging (3-5 minutes when spoken)
- Include natural transitions and questions
- Explain concepts clearly for general audience
- Add some personality and enthusiasm
- Format as: "HOST: [text]" and "EXPERT: [text]"
- Keep each speaking turn to 1-3 sentences max

Example format:
HOST: Welcome everyone! Today we're diving into the fascinating world of [topic]. I'm here with an expert who's going to help us understand this better. So, let's start with the basics - what exactly is [topic]?

EXPERT: Great question! [explanation]

Continue this conversation naturally...`;

  try {
    const script = await geminiQuery(prompt);
    return script;
  } catch (error) {
    console.error('Error generating podcast script:', error);
    throw new Error('Failed to generate podcast script');
  }
}

/**
 * Parse script into segments for different voices
 */
function parseScriptSegments(script) {
  const lines = script.split('\n').filter(line => line.trim());
  const segments = [];
  
  for (const line of lines) {
    if (line.startsWith('HOST:')) {
      segments.push({
        speaker: 'host',
        text: line.replace('HOST:', '').trim(),
        voice: PODCAST_VOICES.host
      });
    } else if (line.startsWith('EXPERT:')) {
      segments.push({
        speaker: 'guest',
        text: line.replace('EXPERT:', '').trim(),
        voice: PODCAST_VOICES.guest
      });
    }
  }
  
  return segments;
}

/**
 * Generate audio using Murf AI TTS streaming API
 */
async function generateAudioSegment(text, voiceId) {
  if (!MURF_API_KEY || MURF_API_KEY === 'your_murf_api_key_here') {
    throw new Error('Murf API key not configured');
  }

  console.log(`Generating audio for voice: ${voiceId}`);
  console.log(`Text length: ${text.length} characters`);

  try {
    const requestData = {
      text: text,
      voiceId: voiceId,
      format: 'WAV',
      channelType: 'STEREO',
      sampleRate: 44100,
      model: 'GEN2'
    };

    console.log('Murf API Request:', {
      url: `${MURF_BASE_URL}/speech/stream`,
      voiceId: voiceId,
      text_preview: text.substring(0, 100) + '...'
    });

    const response = await axios.post(`${MURF_BASE_URL}/speech/stream`, requestData, {
      headers: {
        'api-key': MURF_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'stream', // Important for streaming
      timeout: 30000 // 30 second timeout
    });

    console.log('Murf API Response Status:', response.status);
    
    // Collect the streamed audio data
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.data.on('end', () => {
        const audioBuffer = Buffer.concat(chunks);
        console.log(`Audio stream completed: ${audioBuffer.length} bytes`);
        resolve(audioBuffer);
      });
      
      response.data.on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('Murf AI TTS Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Murf AI API key');
    } else if (error.response?.status === 429) {
      throw new Error('Murf AI rate limit exceeded');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Murf AI request timeout');
    }
    
    throw new Error(`Murf AI TTS failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Concatenate audio buffers into a single WAV file
 * Handles WAV headers properly for concatenation
 */
function concatenateAudioBuffers(audioBuffers) {
  if (audioBuffers.length === 0) return null;
  if (audioBuffers.length === 1) return audioBuffers[0];

  console.log(`Concatenating ${audioBuffers.length} audio buffers`);
  
  // Extract audio data from each WAV file (skip headers)
  const audioDataBuffers = [];
  let totalAudioDataLength = 0;
  
  for (let i = 0; i < audioBuffers.length; i++) {
    const buffer = audioBuffers[i];
    
    // Find the start of audio data (after "data" chunk)
    const dataChunkIndex = buffer.indexOf(Buffer.from('data', 'ascii'));
    if (dataChunkIndex === -1) {
      console.warn(`No data chunk found in buffer ${i}, using entire buffer`);
      audioDataBuffers.push(buffer);
      totalAudioDataLength += buffer.length;
    } else {
      // Skip the "data" chunk header (8 bytes: "data" + 4-byte length)
      const audioDataStart = dataChunkIndex + 8;
      const audioData = buffer.slice(audioDataStart);
      audioDataBuffers.push(audioData);
      totalAudioDataLength += audioData.length;
      console.log(`Buffer ${i}: extracted ${audioData.length} bytes of audio data`);
    }
  }
  
  // Create a new WAV file with proper headers
  const wavHeader = createWavHeader(totalAudioDataLength);
  const concatenated = Buffer.concat([wavHeader, ...audioDataBuffers]);
  
  console.log(`Concatenated audio: ${concatenated.length} bytes total`);
  return concatenated;
}

/**
 * Create WAV file header
 */
function createWavHeader(dataLength) {
  const sampleRate = 44100;
  const numChannels = 2; // Stereo
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4); // File size - 8
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // Audio format (PCM)
  header.writeUInt16LE(numChannels, 22); // Number of channels
  header.writeUInt32LE(sampleRate, 24); // Sample rate
  header.writeUInt32LE(byteRate, 28); // Byte rate
  header.writeUInt16LE(blockAlign, 32); // Block align
  header.writeUInt16LE(bitsPerSample, 34); // Bits per sample
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40); // Data size
  
  return header;
}

/**
 * Stream audio directly to HTTP response (more efficient)
 */
async function streamPodcastAudio(topic, responseStream) {
  try {
    console.log(`Generating streaming podcast for topic: ${topic}`);
    
    // Step 1: Generate script
    const script = await generatePodcastScript(topic);
    console.log('Script generated successfully');
    
    // Step 2: Parse into segments
    const segments = parseScriptSegments(script);
    console.log(`Script parsed into ${segments.length} segments`);
    
    if (segments.length === 0) {
      throw new Error('No valid segments found in script');
    }
    
    // Step 3: Generate audio for each segment first (to get proper WAV format)
    const audioBuffers = [];
    let successCount = 0;
    
    for (const [index, segment] of segments.entries()) {
      console.log(`Generating audio for segment ${index + 1}/${segments.length} (${segment.speaker})`);
      try {
        const audioBuffer = await generateAudioSegment(segment.text, segment.voice);
        audioBuffers.push(audioBuffer);
        successCount++;
        
        // Small delay between requests to avoid rate limiting
        if (index < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`Failed to generate audio for segment ${index + 1}:`, error.message);
        // Continue with other segments even if one fails
      }
    }
    
    if (successCount === 0) {
      throw new Error('Failed to generate any audio segments');
    }
    
    console.log(`Successfully generated ${successCount}/${segments.length} audio segments`);
    
    // Step 4: Concatenate all audio buffers with proper WAV headers
    const finalAudio = concatenateAudioBuffers(audioBuffers);
    
    if (!finalAudio) {
      throw new Error('Failed to concatenate audio segments');
    }
    
    // Step 5: Stream the final audio to response
    responseStream.setHeader('Content-Type', 'audio/wav');
    responseStream.setHeader('Content-Length', finalAudio.length);
    responseStream.setHeader('Content-Disposition', `attachment; filename="${topic.replace(/[^a-zA-Z0-9]/g, '_')}_podcast.wav"`);
    responseStream.setHeader('Accept-Ranges', 'bytes'); // Enable range requests
    
    responseStream.write(finalAudio);
    responseStream.end();
    
    console.log(`Streaming podcast completed for topic: ${topic} (${successCount}/${segments.length} segments)`);
    
    return {
      topic,
      script,
      segments: segments.map(s => ({ speaker: s.speaker, text: s.text })),
      success: true,
      audioGenerated: successCount,
      totalSegments: segments.length
    };
    
  } catch (error) {
    console.error('Error in streamPodcastAudio:', error);
    throw error;
  }
}

/**
 * Generate complete podcast with multiple voices (buffered version)
 */
async function generatePodcast(topic, responseStream) {
  try {
    console.log(`Generating podcast for topic: ${topic}`);
    
    // Step 1: Generate script
    const script = await generatePodcastScript(topic);
    console.log('Script generated successfully');
    
    // Step 2: Parse into segments
    const segments = parseScriptSegments(script);
    console.log(`Script parsed into ${segments.length} segments`);
    
    if (segments.length === 0) {
      throw new Error('No valid segments found in script');
    }
    
    // Step 3: Generate audio for each segment
    const audioBuffers = [];
    let successCount = 0;
    
    for (const [index, segment] of segments.entries()) {
      console.log(`Generating audio for segment ${index + 1}/${segments.length} (${segment.speaker})`);
      try {
        const audioBuffer = await generateAudioSegment(segment.text, segment.voice);
        audioBuffers.push(audioBuffer);
        successCount++;
        
        // Small delay between requests to avoid rate limiting
        if (index < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Failed to generate audio for segment ${index + 1}:`, error.message);
        // Continue with other segments even if one fails
      }
    }
    
    if (successCount === 0) {
      throw new Error('Failed to generate any audio segments');
    }
    
    console.log(`Successfully generated ${successCount}/${segments.length} audio segments`);
    
    // Step 4: Concatenate all audio buffers
    const finalAudio = concatenateAudioBuffers(audioBuffers);
    
    if (!finalAudio) {
      throw new Error('Failed to concatenate audio segments');
    }
    
    // Step 5: Stream the final audio to response
    responseStream.setHeader('Content-Type', 'audio/wav');
    responseStream.setHeader('Content-Length', finalAudio.length);
    responseStream.setHeader('Content-Disposition', `attachment; filename="${topic.replace(/[^a-zA-Z0-9]/g, '_')}_podcast.wav"`);
    responseStream.setHeader('Accept-Ranges', 'bytes'); // Enable range requests
    
    responseStream.write(finalAudio);
    responseStream.end();
    
    console.log(`Podcast generation completed for topic: ${topic}`);
    
    return {
      topic,
      script,
      segments: segments.map(s => ({ speaker: s.speaker, text: s.text })),
      success: true,
      audioGenerated: successCount,
      totalSegments: segments.length
    };
    
  } catch (error) {
    console.error('Error in generatePodcast:', error);
    throw error;
  }
}

/**
 * Fallback podcast generation (without TTS)
 */
async function generatePodcastFallback(topic) {
  try {
    const script = await generatePodcastScript(topic);
    
    return {
      topic,
      script,
      audioUrl: null,
      fallback: true,
      message: 'Script generated successfully. Audio generation requires Murf AI API key.',
      success: true
    };
  } catch (error) {
    throw new Error('Failed to generate podcast script');
  }
}

export {
  generatePodcast,
  streamPodcastAudio,
  generatePodcastFallback,
  generatePodcastScript,
  parseScriptSegments,
  generateAudioSegment,
  concatenateAudioBuffers,
  createWavHeader
};
