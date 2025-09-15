'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Play, Pause, Download, Loader2, Volume2 } from "lucide-react";

interface HearMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PodcastData {
  topic: string;
  script: string;
  audioUrl: string;
  isGenerating: boolean;
  segments?: Array<{ speaker: string; text: string }>;
  audioGenerated?: number;
  totalSegments?: number;
}

export const HearMeModal = ({ isOpen, onClose }: HearMeModalProps) => {
  const [topic, setTopic] = useState("");
  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    const generatePodcast = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setPodcastData(null);
    if (audio) {
      audio.pause();
      setAudio(null);
    }

    try {
      console.log(`Generating podcast for topic: ${topic.trim()}`);
      
      const response = await fetch('http://localhost:3001/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic.trim() })
      });

      if (!response.ok) {
        // Try to get error message from JSON if available
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || `HTTP Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Check content type to see if we got audio or a JSON fallback
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        // This is the fallback response (script only)
        const fallbackData = await response.json();
        setPodcastData({
          topic: topic.trim(),
          script: fallbackData.script,
          audioUrl: '', // No audio URL in fallback
          isGenerating: false,
          segments: fallbackData.segments,
          audioGenerated: 0,
          totalSegments: fallbackData.segments?.length || 0,
        });
        console.log('Received script-only fallback:', fallbackData.message);

      } else if (contentType && contentType.includes('audio/')) {
        // This is the audio stream
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${topic.trim().replace(/[^a-zA-Z0-9]/g, '_')}_podcast.wav`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        setPodcastData({
          topic: topic.trim(),
          script: "🎙️ Podcast audio generated successfully! The conversation includes two different voices - a host and an expert discussing your topic.",
          audioUrl: audioUrl,
          isGenerating: false,
          audioGenerated: 1, // We got audio
          totalSegments: 1,
        });
        console.log(`Audio stream received and converted to blob URL. Filename: ${filename}`);

      } else {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

    } catch (error) {
      console.error('Error generating podcast:', error);
      alert(`Failed to generate podcast: ${error.message}`);
      setPodcastData(null); // Clear any partial data
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = async () => {
    if (!podcastData?.audioUrl) {
      console.log('No audio URL available');
      return;
    }

    console.log('Audio URL:', podcastData.audioUrl);

    if (audio && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (audio) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio play error:', error);
          alert('Failed to play audio. The audio file may not be accessible.');
        }
      } else {
        const newAudio = new Audio();
        newAudio.crossOrigin = 'anonymous';
        
        newAudio.addEventListener('ended', () => setIsPlaying(false));
        newAudio.addEventListener('error', (e) => {
          console.error('Audio loading error:', e);
          console.error('Audio error details:', newAudio.error);
          setIsPlaying(false);
          alert('Failed to load audio. Please check if the audio file is accessible.');
        });
        newAudio.addEventListener('loadstart', () => {
          console.log('Audio loading started');
        });
        newAudio.addEventListener('canplay', () => {
          console.log('Audio can start playing');
        });
        
        newAudio.src = podcastData.audioUrl;
        setAudio(newAudio);
        
        try {
          await newAudio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio play error:', error);
          alert('Failed to play audio. The audio file may not be ready or accessible.');
        }
      }
    }
  };

    const downloadAudio = () => {
    if (!podcastData?.audioUrl) {
      console.log('No audio URL for download');
      return;
    }

    // The audioUrl is already a blob URL, so we can use it directly
    const link = document.createElement('a');
    link.href = podcastData.audioUrl;
    link.download = `${podcastData.topic.replace(/\s+/g, '_')}_podcast.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetModal = () => {
    setTopic("");
    setPodcastData(null);
    setIsGenerating(false);
    setIsPlaying(false);
    if (audio) {
      audio.pause();
      setAudio(null);
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-purple-600" />
            HearMe AI - Podcast Generator
            <Badge variant="secondary" className="ml-2">
              🎙️ TTS Powered
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Topic Input Section */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    What topic would you like to learn about?
                  </label>
                  <Input
                    placeholder="e.g., Machine Learning, Climate Change, History of Rome..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                    className="text-base"
                  />
                </div>
                
                <Button 
                  onClick={generatePodcast}
                  disabled={!topic.trim() || isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Podcast...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Generate AI Podcast
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isGenerating && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Creating your podcast...</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI is generating a conversational script and converting it to speech
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Podcast Result */}
          {podcastData && (
            <div className="space-y-4">
              {/* Audio Player */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        🎙️ {podcastData.topic}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        AI-generated podcast conversation
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={togglePlayback}
                        variant="outline"
                        size="sm"
                        disabled={!podcastData.audioUrl}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        onClick={downloadAudio}
                        variant="outline"
                        size="sm"
                        disabled={!podcastData.audioUrl}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Status Info */}
              {!podcastData.audioUrl && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">⚠️ Audio Generation Status:</p>
                      <p>Script generated successfully, but audio generation failed or is in fallback mode. This may be due to:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Murf AI API key not configured</li>
                        <li>API rate limits or temporary service issues</li>
                        <li>Network connectivity problems</li>
                      </ul>
                      {podcastData.segments && podcastData.segments.length > 0 && (
                        <div className="mt-3 p-2 bg-yellow-100 rounded">
                          <p className="font-medium">📝 Generated Script Preview:</p>
                          <p className="text-xs mt-1">
                            {podcastData.segments.length} conversation segments ready for audio generation
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audio Success Info */}
              {podcastData.audioUrl && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">✅ Audio Generated Successfully!</p>
                      <p>Your podcast is ready with two distinct voices:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Host Voice:</strong> Terrell (Male) - Asks questions and guides the conversation</li>
                        <li><strong>Expert Voice:</strong> Julia (Female) - Provides detailed explanations and insights</li>
                      </ul>
                      <p className="mt-2 text-xs">
                        Audio format: WAV, Stereo, 44.1kHz - High quality for optimal listening experience
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Script Preview */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-md font-medium mb-3">📝 Podcast Script</h4>
                  <Textarea
                    value={podcastData.script}
                    readOnly
                    className="min-h-[200px] text-sm"
                    placeholder="Generated script will appear here..."
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">🎧 How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-purple-700">
                  <li>AI generates a podcast-style conversation about your topic</li>
                  <li>Two different voices create a natural dialogue (Host + Expert)</li>
                  <li>High-quality text-to-speech powered by Murf AI</li>
                  <li>Audio segments are seamlessly combined for uninterrupted playback</li>
                  <li>Download and listen anytime, anywhere</li>
                </ul>
                <div className="mt-3 p-2 bg-purple-100 rounded">
                  <p className="font-medium text-purple-900">🎙️ Voice Details:</p>
                  <p className="text-xs text-purple-800 mt-1">
                    <strong>Host (Terrell):</strong> Male voice that asks engaging questions and guides the conversation<br/>
                    <strong>Expert (Julia):</strong> Female voice that provides detailed explanations and insights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
