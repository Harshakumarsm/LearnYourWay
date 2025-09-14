const { evaluateAnswer } = require('../services/quizService');
const { QuizSession } = require('../models/quiz');

describe('Quiz Service', () => {
    it('should correctly evaluate an answer and update score', () => {
        const session = new QuizSession('test', 'test', 1, 10);
        session.addParticipant('p1', 'Player 1');
        session.questions = [{ id: 'q1', type: 'mcq', text: '2+2?', options: ['3', '4', '5'], correctAnswer: '4' }];
        
        const result = evaluateAnswer(session, 'p1', 'q1', '4');
        
        expect(result.correct).toBe(true);
        expect(result.score).toBe(10);
        expect(session.participants.get('p1').streak).toBe(1);
    });

    it('should handle incorrect answers correctly', () => {
        const session = new QuizSession('test', 'test', 1, 10);
        session.addParticipant('p1', 'Player 1');
        session.questions = [{ id: 'q1', type: 'mcq', text: '2+2?', options: ['3', '4', '5'], correctAnswer: '4' }];
        
        const result = evaluateAnswer(session, 'p1', 'q1', '5');
        
        expect(result.correct).toBe(false);
        expect(result.score).toBe(0);
        expect(session.participants.get('p1').streak).toBe(0);
    });
});
