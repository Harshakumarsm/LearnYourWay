import 'dotenv/config';
import axios from 'axios';
import { QuizSession, sessions } from '../models/quiz.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// TODO: swap in real Gemini REST client using GEMINI_API_KEY
export async function generateQuestions(topic, totalQuestions, level) {
    const prompt = `You are an assistant that outputs a JSON array named "questions". Generate ${totalQuestions} quiz questions on the topic: "${topic}" at difficulty "${level}".
Requirements:
- Output valid JSON only.
- questions: [{ id: "q1", type: "mcq"|"tf", text: "...", options: ["A","B","C","D"] (for mcq), correctAnswer: "D", explanation: "short explanation" }]
- For MCQ include 3-4 plausible options; label answers with option text.
- Avoid any markup or extra commentary — ONLY JSON.`;

    try {
        // This is a mock implementation. Replace with actual API call.
        console.log("Generating questions for topic:", topic);
        // const response = await axios.post(GEMINI_API_URL, { contents: [{ parts: [{ text: prompt }] }] });
        // const jsonString = response.data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        // const data = JSON.parse(jsonString);
        // return data.questions;

        // Mocked response for development without API key
        return [
            { id: "q1", type: "mcq", text: "What is 2 + 2?", options: ["3", "4", "5"], correctAnswer: "4", explanation: "It's basic math." },
            { id: "q2", type: "tf", text: "Is the sky blue?", correctAnswer: "True", explanation: "It appears blue due to Rayleigh scattering." }
        ];
    } catch (error) {
        console.error('Error generating questions from Gemini:', error);
        throw new Error('Failed to generate questions.');
    }
}

export function createSession(topic, totalQuestions, timePerQuestion) {
    const sessionId = Math.random().toString(36).substring(2, 8);
    const session = new QuizSession(sessionId, topic, totalQuestions, timePerQuestion);
    sessions.set(sessionId, session);
    return session;
}

export function evaluateAnswer(session, participantId, questionId, answer) {
    const participant = session.participants.get(participantId);
    const question = session.questions.find(q => q.id === questionId);

    if (!participant || !question) {
        return { correct: false, score: participant ? participant.score : 0 };
    }

    let scoreToAdd = 0;
    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
        scoreToAdd = question.type === 'mcq' ? 10 : 5;
        participant.score += scoreToAdd;
        participant.streak = (participant.streak || 0) + 1;
    } else {
        participant.streak = 0;
    }

    return { correct: isCorrect, score: participant.score, explanation: question.explanation };
}
