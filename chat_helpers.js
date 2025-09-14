/**
 * Chat Helper Functions for Personalized Learning Chatbot (Node.js)
 * Provides modular functions for Gemini API integration, quiz generation, and learning assessment.
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

// Environment variables
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Send a query to Gemini API and return the response.
 */
async function geminiQuery(prompt) {
    if (!GEMINI_API_KEY) {
        return "I'm currently unable to access the AI service. Please try again later.";
    }

    try {
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const content = response.data.candidates[0].content.parts[0].text;
            return content.trim();
        } else {
            return "I couldn't generate a proper response. Please try rephrasing your question.";
        }
    } catch (error) {
        console.error('Gemini API Error:', error.message);
        if (error.code === 'ECONNABORTED') {
            return "The request timed out. Please try again.";
        }
        return "I'm currently unable to process your request. Please try again later.";
    }
}

/**
 * Generate quiz questions for a given topic and difficulty level.
 */
async function generateQuiz(topic, level) {
    if (!GEMINI_API_KEY) {
        return getFallbackQuiz(topic, level);
    }

    const prompt = `
    Generate exactly 4 multiple-choice quiz questions about "${topic}" for a ${level} level learner.
    
    Format your response as a JSON array where each question has:
    - "question": the question text
    - "options": array of 4 possible answers (A, B, C, D)
    - "correct": the correct option letter (A, B, C, or D)
    - "explanation": brief explanation of why this answer is correct
    
    Make sure questions are appropriate for ${level} level and cover different aspects of ${topic}.
    
    Example format:
    [
        {
            "question": "What is...",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": "A",
            "explanation": "This is correct because..."
        }
    ]
    
    Return only the JSON array, no additional text.
    `;

    try {
        const response = await geminiQuery(prompt);
        
        // Try to extract JSON from the response
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== 0) {
            const jsonStr = response.substring(jsonStart, jsonEnd);
            const questions = JSON.parse(jsonStr);
            
            // Validate the structure
            if (Array.isArray(questions) && questions.length > 0) {
                const isValid = questions.every(q => 
                    q.question && q.options && q.correct && q.explanation &&
                    Array.isArray(q.options) && q.options.length === 4
                );
                
                if (isValid) {
                    return questions;
                }
            }
        }
        
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Error generating quiz with Gemini:', error.message);
        return getFallbackQuiz(topic, level);
    }
}

/**
 * Provide fallback quiz questions when Gemini API is unavailable.
 */
function getFallbackQuiz(topic, level) {
    return [
        {
            question: `What is the most important concept to understand when learning about ${topic}?`,
            options: [
                "The basic definition and core principles",
                "Advanced implementation details",
                "Historical background only",
                "Memorizing all technical terms"
            ],
            correct: "A",
            explanation: "Understanding basic definitions and core principles provides the foundation for deeper learning."
        },
        {
            question: `When studying ${topic}, what's the best approach for a ${level} learner?`,
            options: [
                "Jump directly to advanced topics",
                "Start with fundamentals and build up gradually",
                "Only read theoretical materials",
                "Avoid practical examples"
            ],
            correct: "B",
            explanation: "Building knowledge gradually from fundamentals ensures solid understanding."
        },
        {
            question: `What indicates good progress in learning ${topic}?`,
            options: [
                "Memorizing definitions perfectly",
                "Being able to explain concepts simply",
                "Reading many books quickly",
                "Avoiding challenging questions"
            ],
            correct: "B",
            explanation: "The ability to explain concepts simply demonstrates true understanding."
        },
        {
            question: `What's a common mistake when learning ${topic}?`,
            options: [
                "Practicing regularly",
                "Asking questions when confused",
                "Rushing through without understanding basics",
                "Taking breaks to process information"
            ],
            correct: "C",
            explanation: "Rushing through material without solid foundation often leads to confusion later."
        }
    ];
}

/**
 * Evaluate quiz answers and provide scoring with recommendations.
 */
function evaluateAnswers(topic, level, questions, answers) {
    if (answers.length !== questions.length) {
        return {
            score: 0,
            total: questions.length,
            percentage: 0,
            recommendation: "stay",
            feedback: "Incomplete quiz - please answer all questions."
        };
    }

    let correctCount = 0;
    const detailedFeedback = [];

    for (let i = 0; i < questions.length; i++) {
        const isCorrect = answers[i].toUpperCase() === questions[i].correct.toUpperCase();
        if (isCorrect) {
            correctCount++;
        }

        detailedFeedback.push({
            questionNum: i + 1,
            correct: isCorrect,
            userAnswer: answers[i].toUpperCase(),
            correctAnswer: questions[i].correct,
            explanation: questions[i].explanation || 'No explanation available.'
        });
    }

    const percentage = (correctCount / questions.length) * 100;

    // Determine recommendation based on score and current level
    let recommendation, recMessage;

    if (percentage >= 80) {
        if (level.toLowerCase() === 'beginner') {
            recommendation = "advance";
            recMessage = "Excellent work! You're ready to move to intermediate level.";
        } else if (level.toLowerCase() === 'intermediate') {
            recommendation = "advance";
            recMessage = "Great job! Consider exploring advanced topics.";
        } else {
            recommendation = "stay";
            recMessage = "Outstanding! Continue exploring advanced concepts.";
        }
    } else if (percentage >= 60) {
        recommendation = "stay";
        recMessage = `Good progress! Continue practicing at the ${level} level.`;
    } else {
        if (level.toLowerCase() === 'intermediate') {
            recommendation = "retreat";
            recMessage = "Consider reviewing beginner concepts to strengthen your foundation.";
        } else if (level.toLowerCase() === 'advanced') {
            recommendation = "retreat";
            recMessage = "You might benefit from reviewing intermediate concepts first.";
        } else {
            recommendation = "stay";
            recMessage = "Keep practicing! Focus on the fundamental concepts.";
        }
    }

    return {
        score: correctCount,
        total: questions.length,
        percentage: Math.round(percentage * 10) / 10,
        recommendation,
        feedback: recMessage,
        detailedFeedback
    };
}

/**
 * Generate a personalized explanation based on quiz performance.
 */
async function generatePersonalizedExplanation(topic, level, evaluation) {
    const scorePercentage = evaluation.percentage || 0;
    const recommendation = evaluation.recommendation || 'stay';

    // Determine explanation depth based on performance and level
    let explanationLevel;
    if (scorePercentage >= 80) {
        explanationLevel = level.toLowerCase() !== "beginner" ? "advanced" : "intermediate";
    } else if (scorePercentage >= 60) {
        explanationLevel = level.toLowerCase();
    } else {
        explanationLevel = level.toLowerCase() !== "beginner" ? "beginner" : "basic";
    }

    const prompt = `
    Create a personalized explanation of "${topic}" for a learner who:
    - Claims to be at ${level} level
    - Scored ${scorePercentage}% on a quiz
    - Should ${recommendation} in difficulty based on performance
    
    Tailor the explanation to ${explanationLevel} level depth. Include:
    1. Core concepts explained clearly
    2. Real-world examples and applications
    3. Key takeaways
    4. Suggested next steps for learning
    
    Keep it engaging, encouraging, and educational. Limit to about 300-400 words.
    `;

    if (!GEMINI_API_KEY) {
        return getFallbackExplanation(topic, level, evaluation);
    }

    try {
        const explanation = await geminiQuery(prompt);
        return explanation;
    } catch (error) {
        console.error('Error generating personalized explanation:', error.message);
        return getFallbackExplanation(topic, level, evaluation);
    }
}

/**
 * Provide fallback explanation when Gemini API is unavailable.
 */
function getFallbackExplanation(topic, level, evaluation) {
    const scorePercentage = evaluation.percentage || 0;
    const recommendation = evaluation.recommendation || 'stay';

    const performanceText = scorePercentage >= 70 ? 'a strong foundation' : 
                           scorePercentage >= 50 ? 'room for improvement in the basics' : 
                           'significant learning opportunities ahead';

    const nextStepsText = recommendation === 'advance' ? 
        'Focus on mastering advanced concepts and exploring specialized areas.' :
        recommendation === 'stay' ? 
        'Continue practicing at your current level to strengthen understanding.' :
        'Consider reviewing fundamental concepts to build a stronger foundation.';

    return `
## Understanding ${topic}

Based on your quiz performance (${scorePercentage}%), here's a personalized explanation:

**Core Concepts:**
${topic} is a fundamental area of study that requires understanding both theoretical principles and practical applications. The key is to build your knowledge step by step, ensuring each concept is well understood before moving to the next.

**Your Performance Analysis:**
You scored ${evaluation.score || 0} out of ${evaluation.total || 4} questions correctly. This suggests you have ${performanceText}.

**Recommended Next Steps:**
${evaluation.feedback || 'Continue practicing and studying.'}

${nextStepsText}

**Learning Tips:**
- Practice regularly with hands-on examples
- Don't hesitate to ask questions when concepts are unclear
- Connect new learning to what you already know
- Take breaks to let information process

Keep up the great work in your learning journey!
    `.trim();
}

/**
 * Detect if a message indicates learning intent.
 */
function detectLearningIntent(message) {
    const learningKeywords = [
        'explain', 'teach', 'learn', 'understand', 'how does', 'what is',
        'help me learn', 'i want to learn', 'can you teach', 'show me how',
        'tutorial', 'lesson', 'study', 'education', 'course'
    ];

    const messageLower = message.toLowerCase();
    return learningKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Extract the main topic from a learning-oriented message.
 */
function extractTopicFromMessage(message) {
    const messageLower = message.toLowerCase();

    const patterns = [
        ['explain ', ''],
        ['teach me ', ''],
        ['what is ', ''],
        ['how does ', ' work'],
        ['help me learn ', ''],
        ['i want to learn ', ''],
        ['can you teach ', ''],
        ['show me how ', ' works'],
    ];

    for (const [startPattern, endPattern] of patterns) {
        if (messageLower.includes(startPattern)) {
            const startIdx = messageLower.indexOf(startPattern) + startPattern.length;
            let topicPart = message.substring(startIdx).trim();

            // Remove common endings
            if (endPattern && topicPart.toLowerCase().endsWith(endPattern)) {
                topicPart = topicPart.substring(0, topicPart.length - endPattern.length).trim();
            }

            // Remove question marks and other punctuation
            topicPart = topicPart.replace(/[?!.]+$/, '').trim();

            if (topicPart) {
                return topicPart;
            }
        }
    }

    // If no pattern matches, return the original message
    return message.trim();
}

export {
    geminiQuery,
    generateQuiz,
    evaluateAnswers,
    generatePersonalizedExplanation,
    detectLearningIntent,
    extractTopicFromMessage
};
