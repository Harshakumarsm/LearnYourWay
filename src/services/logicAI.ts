// API service for Logic AI functionality

// API Configuration
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const MISTRAL_API_URL = import.meta.env.VITE_MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_25_API_KEY;
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_25_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

export interface ProcessRequest {
  input_type: 'text' | 'pdf' | 'image';
  content: string; // text content or base64 file
  filename?: string;
}

export interface OCRResponse {
  success: boolean;
  error?: string;
  pages: Array<{
    page: number;
    text: string;
  }>;
  full_text: string;
}

export interface Question {
  id: string;
  page: number;
  raw_snippet: string;
  type: 'MCQ' | 'ShortAnswer' | 'TrueFalse' | 'WordProblem' | 'Puzzle' | 'LogicalReasoning' | 'Other';
  text: string;
  options: string[];
  has_explicit_answer_in_source: boolean;
  source_answer: string;
}

export interface GeminiSegmentationResponse {
  questions: Question[];
}

export interface LogicAIResponse {
  question_id: string;
  question_type: string;
  restated_question: string;
  strategies: string[];
  nudge: string;
  approach_hint: string;
  step_by_step_reasoning: Array<{
    step: number;
    prompt_for_student: string;
  }>;
  can_reveal_answer: boolean;
  final_answer?: string;
  final_justification?: string;
}

export interface ProcessResponse {
  success: boolean;
  questions: Question[];
  error?: string;
}

export class LogicAIService {
  /**
   * Helper function to retry API calls with exponential backoff
   */
  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt} failed, waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Get MIME type from filename
   */
  private static getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream'; // Fallback
    }
  }

  /**
   * Call Mistral API for OCR processing (fallback to text extraction notification)
   */
  static async callMistralOCR(base64Content: string, filename: string): Promise<OCRResponse> {
    try {
      // Mistral doesn't support vision/image processing via chat completions
      // This is a temporary fallback that notifies the user to use text input
      console.warn('Mistral OCR: Image/PDF processing not supported. Using fallback.');
      
      return {
        success: false,
        error: 'OCR processing not available. Please convert your image/PDF to text manually or use text input instead.',
        pages: [],
        full_text: ''
      };
    } catch (error) {
      console.error('Mistral OCR error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        pages: [],
        full_text: ''
      };
    }
  }

  /**
   * Alternative OCR using browser-based Tesseract.js (for client-side processing)
   */
  static async callTesseractOCR(base64Content: string, filename: string): Promise<OCRResponse> {
    try {
      // Check if we're dealing with an image or PDF
      const mimeType = this.getMimeType(filename);
      
      if (mimeType === 'application/pdf') {
        return {
          success: false,
          error: 'PDF processing requires server-side OCR. Please convert to image first.',
          pages: [],
          full_text: ''
        };
      }

      // For now, return a placeholder. In a real implementation, you would:
      // 1. Install tesseract.js: npm install tesseract.js
      // 2. Import and use it here
      // 3. Process the base64 image directly in the browser
      
      return {
        success: false,
        error: 'Tesseract.js OCR not yet implemented. Please use text input.',
        pages: [],
        full_text: ''
      };
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        pages: [],
        full_text: ''
      };
    }
  }

  /**
   * Call Gemini 2.5 Flash for question segmentation with better error handling
   */
  static async callGeminiSegmentation(rawText: string): Promise<GeminiSegmentationResponse> {
    try {
      console.log('Calling Gemini API with text length:', rawText.length);
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are QuestionSegmenter. Input is the raw textual content of exam/homework pages. Extract every question and classify its type. Return JSON only.

JSON schema required:
{
  "questions": [
    {
      "id": "q1",
      "page": 1,
      "raw_snippet": "<the exact snippet from source>",
      "type": "MCQ" | "ShortAnswer" | "TrueFalse" | "WordProblem" | "Puzzle" | "LogicalReasoning" | "Other",
      "text": "<cleaned question text>",
      "options": ["A) ...", "B) ..."] or [],
      "has_explicit_answer_in_source": true|false,
      "source_answer": "<answer text if present, else empty>"
    }
  ]
}
Rules:
- Do NOT solve problems. Only detect and classify.
- Preserve any option text for MCQs.
- If unsure of a type, use "Other".
- Keep the raw_snippet verbatim.
- Return only valid JSON.

RawText: ${rawText}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4000,
            topP: 0.8,
            topK: 40
          }
        })
      });

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error details:', errorText);
        
        // Return fallback data for common errors
        if (response.status === 503 || response.status === 500) {
          console.log('Gemini API unavailable, using fallback segmentation');
          return this.fallbackQuestionSegmentation(rawText);
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Gemini API raw result:', result);
      
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        console.log('No content from Gemini, using fallback');
        return this.fallbackQuestionSegmentation(rawText);
      }

      // The Gemini API might wrap the JSON in ```json ... ```, so we need to extract it.
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = content.match(jsonRegex);
      const jsonString = match ? match[1] : content;

      // Parse the JSON response from Gemini
      try {
        const parsed = JSON.parse(jsonString);
        console.log('Parsed Gemini response:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', jsonString);
        console.log('Using fallback segmentation due to parse error');
        return this.fallbackQuestionSegmentation(rawText);
      }
    } catch (error) {
      console.error('Gemini segmentation error:', error);
      console.log('Using fallback segmentation due to error');
      return this.fallbackQuestionSegmentation(rawText);
    }
  }

  /**
   * Fallback question segmentation when Gemini API is unavailable
   */
  static fallbackQuestionSegmentation(rawText: string): GeminiSegmentationResponse {
    const lines = rawText.split('\n').filter(line => line.trim().length > 0);
    const questions: Question[] = [];
    let currentQuestion = '';
    let options: string[] = [];
    let questionCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line starts with a number (like "1.", "2)", etc.) indicating a new question
      if (/^\d+[.)]\s*/.test(line)) {
        // Save previous question if exists
        if (currentQuestion) {
          questions.push(this.createFallbackQuestion(questionCounter - 1, currentQuestion, options));
          options = [];
        }
        
        currentQuestion = line.replace(/^\d+[.)]\s*/, '').trim();
        questionCounter++;
      }
      // Check for multiple choice options (A), B), etc.)
      else if (/^[A-Za-z][).]/.test(line)) {
        options.push(line);
      }
      // Check for True/False questions
      else if (line.toLowerCase().includes('true or false') || line.toLowerCase().includes('t/f')) {
        if (currentQuestion) {
          questions.push(this.createFallbackQuestion(questionCounter - 1, currentQuestion, options));
          options = [];
        }
        currentQuestion = line;
        questionCounter++;
      }
      // Continue current question if no number prefix
      else if (currentQuestion && !line.match(/^[A-Za-z][).]/) && line.length > 10) {
        currentQuestion += ' ' + line;
      }
    }

    // Add the last question if exists
    if (currentQuestion) {
      questions.push(this.createFallbackQuestion(questionCounter - 1, currentQuestion, options));
    }

    // If no questions found using pattern matching, create a generic question
    if (questions.length === 0) {
      questions.push({
        id: 'q1',
        page: 1,
        raw_snippet: rawText.substring(0, Math.min(500, rawText.length)),
        type: 'Other',
        text: rawText.substring(0, Math.min(200, rawText.length)) + (rawText.length > 200 ? '...' : ''),
        options: [],
        has_explicit_answer_in_source: false,
        source_answer: ''
      });
    }

    return { questions };
  }

  /**
   * Helper function to create a question object for fallback segmentation
   */
  static createFallbackQuestion(index: number, questionText: string, options: string[]): Question {
    let type: Question['type'] = 'Other';
    
    // Determine question type based on content
    if (options.length > 0) {
      type = 'MCQ';
    } else if (questionText.toLowerCase().includes('true or false') || questionText.toLowerCase().includes('t/f')) {
      type = 'TrueFalse';
    } else if (questionText.toLowerCase().includes('solve') || questionText.includes('=') || /\d+x|\dx/.test(questionText)) {
      type = 'WordProblem';
    } else if (questionText.length < 100) {
      type = 'ShortAnswer';
    }

    return {
      id: `q${index + 1}`,
      page: 1,
      raw_snippet: questionText + (options.length > 0 ? '\n' + options.join('\n') : ''),
      type,
      text: questionText,
      options,
      has_explicit_answer_in_source: false,
      source_answer: ''
    };
  }

  /**
   * Call Groq (Ollama) for logic generation
   */
  static async callGroqLogicAI(
    question: Question,
    hintLevel: 'none' | 'nudge' | 'approach' | 'full' = 'none',
    revealAnswer: boolean = false
  ): Promise<LogicAIResponse | null> {
    try {
      return await this.retryWithBackoff(async () => {
        // Validate API key
        if (!GROQ_API_KEY) {
          console.error('GROQ_API_KEY is not configured');
          throw new Error('GROQ_API_KEY is not configured');
        }

        const systemPrompt = `You are LogicAI — a reasoning tutor that teaches HOW to solve questions rather than giving answers.
Constraints:
- NEVER reveal the final answer unless the request includes reveal_answer=true.
- Output MUST be valid JSON and nothing else.
- Respect the requested hint level: "none" | "nudge" | "approach" | "full".
- Always include the question id and type in the response.

JSON schema to return:
{
  "question_id": "<id from Gemini>",
  "question_type": "<MCQ|ShortAnswer|TrueFalse|WordProblem|Puzzle|LogicalReasoning|Other>",
  "restated_question": "<short restatement>",
  "strategies": ["elimination","visualization","pattern recognition","deduction", ...],
  "nudge": "<very short hint: 1-2 sentences, no solution>",
  "approach_hint": "<structured hint describing a method or steps to try, still not revealing answer>",
  "step_by_step_reasoning": [
     {"step": 1, "prompt_for_student": "A guiding question or task to do next"},
     {"step": 2, "prompt_for_student": "..."},
     ...
  ],
  "can_reveal_answer": false,
  "final_answer": null
}
Behavior rules:
1. Restate the question succinctly (1-2 sentences).
2. Propose 2–4 distinct strategies tailored to the question type.
3. Provide a short 'nudge' (one-line direction) and a longer 'approach_hint' (2–4 sentences) describing a method to try.
4. Provide step_by_step_reasoning as a short scaffold of actionable micro-steps the student can attempt; where appropriate ask sub-questions the student should answer.
5. If 'hint_level' parameter equals:
   - "none": include all fields but keep 'nudge' and 'approach_hint' concise.
   - "nudge": expand the 'nudge' line marginally but do not reveal approach_hint steps.
   - "approach": fill 'approach_hint' in detail (2–4 sentences) and include step_by_step_reasoning skeleton.
   - "full": include detailed step_by_step_reasoning that walks through logical steps, but still do NOT populate 'final_answer' unless reveal_answer=true.
6. If the input indicates reveal_answer=true, set can_reveal_answer=true and populate final_answer with the solution (brief), plus a short justification field "final_justification".
7. Do not hallucinate extra context. If a question references missing data, indicate required missing info.
8. Keep language concise, teacherly, and focus on logical reasoning rather than computations (unless computations are part of the method).`;

        const userMessage = {
          question_id: question.id,
          question_type: question.type,
          question_text: question.text?.trim() || '',
          options: Array.isArray(question.options) ? question.options.filter(opt => opt && opt.trim()) : [],
          hint_level: hintLevel,
          reveal_answer: revealAnswer
        };

        // Validate payload
        if (!userMessage.question_text) {
          throw new Error('Question text is empty or invalid');
        }

        const requestBody = {
          model: 'llama-3.1-8b-instant', // Fallback models: 'mixtral-8x7b-32768', 'llama3-8b-8192'
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: JSON.stringify(userMessage)
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          stream: false
        };

        console.log('Groq API request payload:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Groq API error details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Groq API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const content = result.choices[0]?.message?.content;
        
        if (!content) {
          throw new Error('No content received from Groq');
        }

        // Parse the JSON response from Groq
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse Groq response:', content);
          throw new Error(`Failed to parse Groq response: ${parseError}`);
        }
      });
    } catch (error) {
      console.error('Groq Logic AI error:', error);
      return null;
    }
  }
  /**
   * Process input (text, PDF, or image) and extract questions using real APIs
   */
  static async processInput(request: ProcessRequest): Promise<ProcessResponse> {
    try {
      let rawText = '';

      // Step 1: OCR (if needed)
      if (request.input_type === 'text') {
        rawText = request.content;
      } else {
        // Try OCR processing with fallback
        console.log(`Processing ${request.input_type} file: ${request.filename}`);
        
        const ocrResult = await this.callTesseractOCR(request.content, request.filename || '');
        
        if (!ocrResult.success) {
          // Fallback: suggest manual text input
          return {
            success: false,
            questions: [],
            error: `${ocrResult.error} Please copy and paste the text content instead, or convert your ${request.input_type} to text format.`
          };
        }
        
        rawText = ocrResult.full_text;
      }

      // Step 2: Call Gemini for question segmentation
      const segmentationResult = await this.callGeminiSegmentation(rawText);
      
      if (!segmentationResult.questions || segmentationResult.questions.length === 0) {
        return {
          success: false,
          questions: [],
          error: 'No questions found in the content'
        };
      }

      // Step 3: For each question, call Groq to generate initial logic framework
      const questionsWithLogic = await Promise.all(
        segmentationResult.questions.map(async (question) => {
          const logicResponse = await this.callGroqLogicAI(question, 'none', false);
          
          if (logicResponse) {
            return {
              ...question,
              restated_question: logicResponse.restated_question,
              strategies: logicResponse.strategies
            };
          }
          
          return question;
        })
      );

      return {
        success: true,
        questions: questionsWithLogic
      };
    } catch (error) {
      console.error('Error processing input:', error);
      return {
        success: false,
        questions: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get hint for a specific question using Groq API
   */
  static async getQuestionHint(
    questionId: string, 
    hintLevel: 'none' | 'nudge' | 'approach' | 'full',
    revealAnswer: boolean = false
  ): Promise<LogicAIResponse | null> {
    try {
      // For now, we need the original question data to call Groq
      // In a real implementation, you might store questions and retrieve them by ID
      // For this demo, we'll return null and handle it in the component
      console.log(`Getting hint for question ${questionId} with level ${hintLevel}`);
      return null;
    } catch (error) {
      console.error('Error getting question hint:', error);
      return null;
    }
  }

  /**
   * Submit an attempt for a question
   */
  static async submitAttempt(questionId: string, attempt: string): Promise<LogicAIResponse | null> {
    try {
      // For now, just log the attempt
      // In a real implementation, you might want to call Groq to analyze the attempt
      console.log(`Submitted attempt for question ${questionId}:`, attempt);
      return null;
    } catch (error) {
      console.error('Error submitting attempt:', error);
      return null;
    }
  }

  /**
   * Convert file to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Validate file type and size
   */
  static validateFile(file: File, type: 'pdf' | 'image'): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    if (type === 'pdf') {
      if (file.type !== 'application/pdf') {
        return { valid: false, error: 'Only PDF files are allowed' };
      }
    } else if (type === 'image') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPEG and PNG images are allowed' };
      }
    }

    return { valid: true };
  }
}

// Mock data for development/testing
export const mockQuestions: Question[] = [
  {
    id: 'q1',
    page: 1,
    raw_snippet: 'What is the capital of France? A) London B) Berlin C) Paris D) Madrid',
    type: 'MCQ',
    text: 'What is the capital of France?',
    options: ['A) London', 'B) Berlin', 'C) Paris', 'D) Madrid'],
    has_explicit_answer_in_source: false,
    source_answer: ''
  },
  {
    id: 'q2',
    page: 1,
    raw_snippet: 'Solve for x: 2x + 5 = 13',
    type: 'WordProblem',
    text: 'Solve for x: 2x + 5 = 13',
    options: [],
    has_explicit_answer_in_source: false,
    source_answer: ''
  },
  {
    id: 'q3',
    page: 1,
    raw_snippet: 'True or False: The Earth is flat.',
    type: 'TrueFalse',
    text: 'True or False: The Earth is flat.',
    options: [],
    has_explicit_answer_in_source: false,
    source_answer: ''
  }
];

export const mockLogicAIResponses: Record<string, LogicAIResponse> = {
  q1: {
    question_id: 'q1',
    question_type: 'MCQ',
    restated_question: 'Which city serves as the capital of France?',
    strategies: ['elimination', 'geographical knowledge', 'process of elimination'],
    nudge: 'Think about what you know about European capitals.',
    approach_hint: 'Consider the process of elimination. Look at each option and think about what you know about each city.',
    step_by_step_reasoning: [
      { step: 1, prompt_for_student: 'First, identify what the question is asking for' },
      { step: 2, prompt_for_student: 'Look at each option and recall what you know about each city' },
      { step: 3, prompt_for_student: 'Use elimination to rule out incorrect options' }
    ],
    can_reveal_answer: false
  },
  q2: {
    question_id: 'q2',
    question_type: 'WordProblem',
    restated_question: 'Find the value of x in the equation 2x + 5 = 13',
    strategies: ['algebraic manipulation', 'inverse operations', 'substitution method'],
    nudge: 'What operation is the opposite of addition?',
    approach_hint: 'Use inverse operations to isolate x. Start by getting rid of the constant term.',
    step_by_step_reasoning: [
      { step: 1, prompt_for_student: 'Identify what you need to find (the value of x)' },
      { step: 2, prompt_for_student: 'Remove the constant term from both sides' },
      { step: 3, prompt_for_student: 'Divide both sides by the coefficient of x' }
    ],
    can_reveal_answer: false
  },
  q3: {
    question_id: 'q3',
    question_type: 'TrueFalse',
    restated_question: 'Is the statement "The Earth is flat" true or false?',
    strategies: ['scientific evidence', 'observation', 'logical reasoning'],
    nudge: 'What does modern science tell us about Earth\'s shape?',
    approach_hint: 'Consider the scientific evidence and observations that have been made about Earth\'s shape.',
    step_by_step_reasoning: [
      { step: 1, prompt_for_student: 'Think about what evidence exists about Earth\'s shape' },
      { step: 2, prompt_for_student: 'Consider photographs from space and other scientific observations' },
      { step: 3, prompt_for_student: 'Evaluate whether the statement aligns with scientific consensus' }
    ],
    can_reveal_answer: false
  }
};