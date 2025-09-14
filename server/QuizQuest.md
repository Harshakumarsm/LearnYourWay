## QuizQuest API and Sockets

### Endpoints

-   `POST /api/quiz/session/create`
    -   Creates a new quiz session.
    -   Body: `{ "topic": "React", "totalQuestions": 10, "timePerQuestion": 15 }`
    -   Response: `{ "sessionId": "abcdef" }`

-   `POST /api/quiz/session/join`
    -   Allows a user to join a session (validation, no real logic).
    -   Body: `{ "sessionId": "abcdef" }`

-   `POST /api/quiz/session/:id/start`
    -   Starts the quiz for the given session ID.

-   `GET /api/quiz/session/:id/leaderboard`
    -   Gets the current leaderboard for the session.

### Socket Events

**Client to Server:**

-   `join_session`: `{ sessionId, name }`
-   `submit_answer`: `{ sessionId, questionId, answer }`

**Server to Client:**

-   `question_start`: `{ question, timeLeft }`
-   `leaderboard_update`: `[ { id, name, score, streak } ]`
-   `session_end`: `{ leaderboard }`
-   `answer_result`: `{ correct, score, explanation }`
-   `error`: `{ message }`

### Production Notes

-   **Persistence**: The current implementation uses in-memory `Map` objects to store session data. For production, this should be replaced with a persistent database (e.g., PostgreSQL, MongoDB) for session information and Redis for leaderboards (using sorted sets for efficiency).
    -   `// TODO: replace in-memory Map with persistent DB + Redis sorted sets for production`
-   **Authentication**: No authentication is currently implemented. The `requireAuth` middleware placeholder should be implemented to protect routes.
-   **Scalability**: The current socket implementation is for a single server instance. For horizontal scaling, use the `socket.io-redis` adapter to broadcast events across multiple server instances.
-   **LLM Integration**: The Gemini API call is currently mocked. The `GEMINI_API_KEY` environment variable and the actual API call logic need to be implemented.
    -   `// TODO: swap in real Gemini REST client using GEMINI_API_KEY`
-   **Configuration**: Key settings should be managed via environment variables (`PORT`, `GEMINI_API_KEY`, `SESSION_TTL_MS`).
