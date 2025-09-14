// Simplified LogicAI service for text-only processing
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_25_API_KEY || 'AIzaSyBaMXZB3GYhBKsq2Kgdgwmfd97k4NjlJOM';
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_25_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface SimpleLogicAIResponse {
  restated_question: string;
  strategies: string[];
  nudge: string;
  approach_hint: string;
  step_by_step_reasoning: string;
}

// Interface for multiple questions response
export interface MultipleQuestionsResponse {
  questions: Array<{
    id: string;
    original_text: string;
    type: string;
    response: SimpleLogicAIResponse;
  }>;
  total_questions: number;
}

export class SimpleLogicAIService {
  /**
   * Text-only LogicAI flow using Gemini API
   */
  static async processTextQuestion(questionText: string, questionType?: string): Promise<SimpleLogicAIResponse> {
    try {
      const detectedType = questionType || this.detectQuestionType(questionText);
      
      const prompt = `You are LogicAI, a reasoning tutor that focuses on teaching logical approaches to solving questions.
You must NOT give the final answer unless the user explicitly asks for it.
Your role is to guide step-by-step thinking, not just provide solutions.

Input: ${questionText}
Type: ${detectedType}

Follow these rules strictly:

1. **Restate the question** in your own words to confirm understanding.
2. Generate at least **3 different reasoning strategies** relevant to the question type.
   - Examples: elimination, visualization, deduction, analogy, case analysis, pattern recognition.
3. Provide **layered hints**:
   - **nudge**: a very small clue (1 short sentence).
   - **approach_hint**: a method or general strategy the learner should apply.
   - **step_by_step_reasoning**: structured reasoning steps (numbered or bulleted). Do NOT reveal the final answer unless explicitly asked.
4. Adapt reasoning style based on ${detectedType}:
   - MCQ → focus on elimination and testing options.
   - Short Answer → focus on principles or core concepts.
   - Word Problem → break down conditions step by step.
   - Puzzle/Logical Reasoning → emphasize deduction, pattern recognition.
5. Always output in **strict JSON format**:

{
  "restated_question": "...",
  "strategies": ["...", "...", "..."],
  "nudge": "...",
  "approach_hint": "...",
  "step_by_step_reasoning": "..."
}

Rules:
- Never reveal the final answer unless the user explicitly asks: "Reveal Answer".
- Keep reasoning clear, simple, and structured.
- If the question is ambiguous, explain assumptions before reasoning.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      // Extract JSON from the response (Gemini might wrap it in ```json blocks)
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = content.match(jsonRegex);
      const jsonString = match ? match[1] : content;

      try {
        const parsed = JSON.parse(jsonString);
        return {
          restated_question: parsed.restated_question,
          strategies: parsed.strategies || [],
          nudge: parsed.nudge,
          approach_hint: parsed.approach_hint,
          step_by_step_reasoning: parsed.step_by_step_reasoning
        };
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', jsonString);
        throw new Error('Failed to parse LogicAI response');
      }
    } catch (error) {
      console.error('LogicAI processing error:', error);
      throw error;
    }
  }

  /**
   * Simple question type detection
   */
  static detectQuestionType(questionText: string): string {
    const text = questionText.toLowerCase();
    
    if (text.includes('a)') || text.includes('b)') || text.includes('c)') || text.includes('d)')) {
      return 'MCQ';
    }
    if (text.includes('true or false') || text.includes('true/false')) {
      return 'TrueFalse';
    }
    if (text.includes('solve') || text.includes('calculate') || text.includes('find')) {
      return 'Word Problem';
    }
    if (text.includes('puzzle') || text.includes('logic') || text.includes('pattern')) {
      return 'Puzzle';
    }
    
    return 'Short Answer';
  }

  /**
   * Parse multiple questions from text input using intelligent detection
   */
  static parseMultipleQuestions(inputText: string): Array<{id: string, text: string, type: string}> {
    const questions: Array<{id: string, text: string, type: string}> = [];
    
    // First try numbered questions (1., 2), Q1, etc.)
    const lines = inputText.split('\n').filter(line => line.trim().length > 0);
    let currentQuestion = '';
    let questionCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line starts with question numbering (1., 2), Q1, etc.)
      const questionPattern = /^(\d+[.)]\s*|Q\d+[.:]?\s*|Question\s*\d+[.:]?\s*)/i;
      
      if (questionPattern.test(line)) {
        // Save previous question if exists
        if (currentQuestion.trim()) {
          questions.push({
            id: `q${questionCounter - 1}`,
            text: currentQuestion.trim(),
            type: this.detectQuestionType(currentQuestion)
          });
        }
        
        // Start new question
        currentQuestion = line.replace(questionPattern, '').trim();
        questionCounter++;
      } else if (line.length > 0) {
        // Continue current question
        currentQuestion += (currentQuestion ? ' ' : '') + line;
      }
    }

    // Add the last question
    if (currentQuestion.trim()) {
      questions.push({
        id: `q${questionCounter - 1}`,
        text: currentQuestion.trim(),
        type: this.detectQuestionType(currentQuestion)
      });
    }

    // If no numbered questions found, try to detect questions by sentence structure
    if (questions.length === 0 && inputText.trim()) {
      const sentences = this.intelligentQuestionSplit(inputText);
      
      if (sentences.length > 1) {
        sentences.forEach((sentence, index) => {
          if (sentence.trim()) {
            questions.push({
              id: `q${index + 1}`,
              text: sentence.trim(),
              type: this.detectQuestionType(sentence)
            });
          }
        });
      } else {
        // Single question
        questions.push({
          id: 'q1',
          text: inputText.trim(),
          type: this.detectQuestionType(inputText)
        });
      }
    }

    return questions;
  }

  /**
   * Intelligent question splitting based on sentence structure and question markers
   */
  static intelligentQuestionSplit(text: string): string[] {
    // Split by question marks, but be careful about abbreviations
    const parts = text.split(/\?+/).map(part => part.trim()).filter(part => part.length > 0);
    
    // Add question marks back (except for the last part if it doesn't end with ?)
    const questions: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.length === 0) continue;
      
      // Check if this looks like a question
      const isQuestion = this.looksLikeQuestion(part);
      
      if (isQuestion) {
        questions.push(part + (i < parts.length - 1 || text.endsWith('?') ? '?' : ''));
      } else if (questions.length > 0) {
        // Append to previous question if it doesn't look like a standalone question
        questions[questions.length - 1] += ' ' + part + (i < parts.length - 1 || text.endsWith('?') ? '?' : '');
      } else {
        // First part that doesn't look like a question - might still be one
        questions.push(part + (i < parts.length - 1 || text.endsWith('?') ? '?' : ''));
      }
    }

    // If no question marks found, try splitting by other patterns
    if (questions.length <= 1) {
      // Try splitting by sentence endings followed by question words
      const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'did'];
      const sentences = text.split(/[.!]\s+/);
      
      const detectedQuestions: string[] = [];
      let currentSentence = '';
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        
        const startsWithQuestionWord = questionWords.some(word => 
          trimmed.toLowerCase().startsWith(word + ' ')
        );
        
        if (startsWithQuestionWord && currentSentence) {
          // Save previous sentence and start new one
          detectedQuestions.push(currentSentence.trim());
          currentSentence = trimmed;
        } else {
          currentSentence += (currentSentence ? ' ' : '') + trimmed;
        }
      }
      
      if (currentSentence.trim()) {
        detectedQuestions.push(currentSentence.trim());
      }
      
      if (detectedQuestions.length > 1) {
        return detectedQuestions;
      }
    }

    return questions.length > 0 ? questions : [text];
  }

  /**
   * Check if a text segment looks like a question
   */
  static looksLikeQuestion(text: string): boolean {
    const trimmed = text.trim().toLowerCase();
    
    // Check for question words at the beginning
    const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'did'];
    const startsWithQuestionWord = questionWords.some(word => 
      trimmed.startsWith(word + ' ')
    );
    
    // Check for question phrases
    const questionPhrases = ['explain', 'define', 'calculate', 'solve', 'find', 'determine', 'prove'];
    const hasQuestionPhrase = questionPhrases.some(phrase => 
      trimmed.includes(phrase)
    );
    
    // Must be at least 5 words to be considered a meaningful question
    const wordCount = trimmed.split(/\s+/).length;
    
    return (startsWithQuestionWord || hasQuestionPhrase) && wordCount >= 3;
  }

  /**
   * Process multiple questions at once with intelligent parsing
   */
  static async processMultipleQuestions(inputText: string): Promise<MultipleQuestionsResponse> {
    try {
      // First, use Gemini to intelligently identify and separate questions
      const geminiParsedQuestions = await this.geminiParseQuestions(inputText);
      
      let questionsToProcess: Array<{id: string, text: string, type: string}>;
      
      if (geminiParsedQuestions.length > 1) {
        questionsToProcess = geminiParsedQuestions;
      } else {
        // Fallback to local parsing
        questionsToProcess = this.parseMultipleQuestions(inputText);
      }

      const processedQuestions = [];

      // Process each question
      for (const question of questionsToProcess) {
        try {
          const response = await this.processTextQuestion(question.text, question.type);
          processedQuestions.push({
            id: question.id,
            original_text: question.text,
            type: question.type,
            response
          });
        } catch (error) {
          console.error(`Error processing question ${question.id}:`, error);
          // Add error fallback
          processedQuestions.push({
            id: question.id,
            original_text: question.text,
            type: question.type,
            response: {
              restated_question: `Unable to process: ${question.text}`,
              strategies: ['manual analysis', 'break down the problem', 'seek additional resources'],
              nudge: 'Try rephrasing this question or breaking it into smaller parts.',
              approach_hint: 'Consider the key concepts and identify what the question is asking.',
              step_by_step_reasoning: 'This question requires manual analysis. Break it down into components and approach systematically.'
            }
          });
        }
      }

      return {
        questions: processedQuestions,
        total_questions: processedQuestions.length
      };
    } catch (error) {
      console.error('Error processing multiple questions:', error);
      throw error;
    }
  }

  /**
   * Use Gemini to intelligently parse and separate questions from text
   */
  static async geminiParseQuestions(inputText: string): Promise<Array<{id: string, text: string, type: string}>> {
    try {
      const prompt = `You are a question parser. Your task is to identify and separate individual questions from the given text.

Input text: "${inputText}"

Please analyze the text and identify all distinct questions. For each question:
1. Extract the complete question text
2. Classify the question type (MCQ, Short Answer, Word Problem, Puzzle, TrueFalse, Other)

Output format (strict JSON):
{
  "questions": [
    {
      "id": "q1",
      "text": "complete question text here",
      "type": "question_type"
    },
    {
      "id": "q2", 
      "text": "second question text here",
      "type": "question_type"
    }
  ]
}

Rules:
- If there's only one question, return it as q1
- Each question should be complete and standalone
- Preserve the original wording
- Don't include question numbers (1., 2., etc.) in the text
- If unsure about boundaries, err on the side of keeping questions together`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1500,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        console.warn('Gemini parsing failed, using fallback');
        return this.parseMultipleQuestions(inputText);
      }

      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        return this.parseMultipleQuestions(inputText);
      }

      // Extract JSON from the response
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = content.match(jsonRegex);
      const jsonString = match ? match[1] : content;

      try {
        const parsed = JSON.parse(jsonString);
        return parsed.questions || [{ id: 'q1', text: inputText, type: this.detectQuestionType(inputText) }];
      } catch (parseError) {
        console.warn('Failed to parse Gemini question separation, using fallback');
        return this.parseMultipleQuestions(inputText);
      }
    } catch (error) {
      console.warn('Gemini question parsing error, using fallback:', error);
      return this.parseMultipleQuestions(inputText);
    }
  }
}