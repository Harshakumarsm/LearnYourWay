import { sessions } from '../models/quiz.js';
import { evaluateAnswer, generateQuestions } from '../services/quizService.js';

export function initializeQuizSocket(io) {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join_session', ({ sessionId, name }) => {
            const session = sessions.get(sessionId);
            if (!session) {
                // If session doesn't exist, it might be a race condition with HTTP creation.
                // We'll let the user join the socket.io room, but notify them if the session isn't found.
                // The client should handle this by waiting or showing an error.
                socket.emit('error', { message: `Session ${sessionId} not found. Please ensure the code is correct.` });
                console.log(`Attempt to join non-existent session ${sessionId} by ${name}`);
                return;
            }

            socket.join(sessionId);
            session.addParticipant(socket.id, name);
            // Store session ID on the socket for easier lookup on disconnect
            socket.sessionId = sessionId; 
            io.to(sessionId).emit('leaderboard_update', session.getLeaderboard());
            console.log(`${name} (${socket.id}) joined session ${sessionId}`);
            // Confirm join to the client
            socket.emit('session_joined', { sessionId, leaderboard: session.getLeaderboard() });
        });

        socket.on('submit_answer', ({ sessionId, questionId, answer }) => {
            const session = sessions.get(sessionId);
            if (session && session.state === 'active') {
                const result = evaluateAnswer(session, socket.id, questionId, answer);
                socket.emit('answer_result', result);
                io.to(sessionId).emit('leaderboard_update', session.getLeaderboard());
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            const { sessionId } = socket;
            if (sessionId && sessions.has(sessionId)) {
                const session = sessions.get(sessionId);
                if (session.participants.has(socket.id)) {
                    session.participants.delete(socket.id);
                    console.log(`Removed ${socket.id} from session ${sessionId}`);
                    // If the session is empty, consider cleaning it up
                    if (session.participants.size === 0) {
                        console.log(`Session ${sessionId} is now empty.`);
                        // Optional: sessions.delete(sessionId);
                    } else {
                        io.to(sessionId).emit('leaderboard_update', session.getLeaderboard());
                    }
                }
            }
        });
    });
}

export async function startQuiz(io, sessionId) {
    const session = sessions.get(sessionId);
    if (!session || session.state !== 'waiting') return;

    session.state = 'active';
    session.questions = await generateQuestions(session.topic, session.totalQuestions, 'medium');
    session.currentQuestionIndex = 0;

    const sendQuestion = () => {
        if (session.currentQuestionIndex >= session.questions.length) {
            session.state = 'finished';
            io.to(sessionId).emit('session_end', { leaderboard: session.getLeaderboard() });
            return;
        }

        const question = session.questions[session.currentQuestionIndex];
        io.to(sessionId).emit('question_start', { question, timeLeft: session.timePerQuestion });

        setTimeout(() => {
            session.currentQuestionIndex++;
            sendQuestion();
        }, session.timePerQuestion * 1000);
    };

    sendQuestion();
}
