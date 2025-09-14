export const sessions = new Map();

// TODO: replace in-memory Map with persistent DB + Redis sorted sets for production
export const leaderboards = new Map();

export class QuizSession {
    constructor(id, topic, totalQuestions, timePerQuestion) {
        this.id = id;
        this.topic = topic;
        this.totalQuestions = totalQuestions;
        this.timePerQuestion = timePerQuestion;
        this.participants = new Map();
        this.questions = [];
        this.currentQuestionIndex = -1;
        this.state = 'waiting'; // waiting, active, finished
    }

    addParticipant(participantId, name) {
        if (!this.participants.has(participantId)) {
            this.participants.set(participantId, { id: participantId, name, score: 0, streak: 0 });
            return true;
        }
        return false;
    }

    getLeaderboard() {
        return Array.from(this.participants.values()).sort((a, b) => b.score - a.score);
    }
}
