// Test WAV concatenation
import dotenv from 'dotenv';
import { generateAudioSegment, concatenateAudioBuffers, createWavHeader } from './podcast_helpers.js';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

async function testWavConcatenation() {
  console.log('🎵 Testing WAV Concatenation...\n');
  
  try {
    // Generate two audio segments
    const text1 = "Hello, this is the first segment.";
    const text2 = "And this is the second segment.";
    const voiceId = "en-US-terrell";
    
    console.log('Generating first audio segment...');
    const audio1 = await generateAudioSegment(text1, voiceId);
    console.log(`✅ First segment: ${audio1.length} bytes`);
    
    console.log('Generating second audio segment...');
    const audio2 = await generateAudioSegment(text2, voiceId);
    console.log(`✅ Second segment: ${audio2.length} bytes`);
    
    // Test concatenation
    console.log('\nConcatenating audio segments...');
    const concatenated = concatenateAudioBuffers([audio1, audio2]);
    console.log(`✅ Concatenated: ${concatenated.length} bytes`);
    
    // Save to file for testing
    writeFileSync('test_concatenated.wav', concatenated);
    console.log('✅ Saved concatenated audio to test_concatenated.wav');
    
    // Test individual segments too
    writeFileSync('test_segment1.wav', audio1);
    writeFileSync('test_segment2.wav', audio2);
    console.log('✅ Saved individual segments for comparison');
    
    console.log('\n🎯 Test completed! Check the generated WAV files.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWavConcatenation().catch(console.error);
