import express from 'express';
import { createSession } from '../services/quizService.js';
import { sessions } from '../models/quiz.js';
import { startQuiz } from '../sockets/quizSocket.js';

const router = express.Router();

// Note: In a real app, you'd have auth middleware.
// const requireAuth = (req, res, next) => next();

router.post('/session/create', (req, res) => {
    const { topic, totalQuestions, timePerQuestion } = req.body;
    if (!topic || !totalQuestions || !timePerQuestion) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const session = createSession(topic, totalQuestions, timePerQuestion);
    res.status(201).json({ sessionId: session.id });
});

router.post('/session/join', (req, res) => {
    const { sessionId } = req.body;
    if (sessions.has(sessionId)) {
        res.status(200).json({ message: 'Joined successfully' });
    } else {
        res.status(404).json({ message: 'Session not found' });
    }
});

router.post('/session/:id/start', (req, res) => {
    const { id } = req.params;
    const io = req.app.get('socketio');
    startQuiz(io, id);
    res.status(200).json({ message: 'Quiz started' });
});

router.get('/session/:id/leaderboard', (req, res) => {
    const session = sessions.get(req.params.id);
    if (session) {
        res.status(200).json(session.getLeaderboard());
    } else {
        res.status(404).json({ message: 'Session not found' });
    }
});

export default router;
