# LearnYourWay Chat Service

A personalized learning chatbot with AI-powered quiz generation and adaptive explanations.

## Features

### 🎯 Learning Mode
- **Topic Detection**: Automatically detects learning intent from messages like "Explain X" or "Teach me Y"
- **Level Assessment**: Asks users to specify their familiarity (Beginner/Intermediate/Advanced)
- **Dynamic Quizzes**: Generates 4 tailored quiz questions using Gemini AI
- **Smart Evaluation**: Analyzes performance and provides recommendations (advance/stay/retreat)
- **Personalized Explanations**: Creates custom explanations based on quiz results and user level

### 💬 LLM Mode
- **General Q&A**: Handles regular questions using Gemini AI
- **Fallback Support**: Graceful degradation when AI service is unavailable

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Add to your `.env.local`:
```env
# Flask Configuration
FLASK_SECRET_KEY=your_secret_key_here
FLASK_PORT=5000
FLASK_DEBUG=True

# Gemini API
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3. Run the Service
```bash
python app.py
```

## API Endpoints

### POST /chat
Main chat endpoint supporting both learning and LLM modes.

**Request:**
```json
{
  "message": "Explain Machine Learning"
}
```

**Response:**
```json
{
  "reply": "Great! I'd love to help you learn about Machine Learning..."
}
```

### GET /health
Health check endpoint.

### POST /chat/reset
Reset the current chat session.

## Usage Examples

### Learning Mode Flow:
1. **User**: "Explain Machine Learning"
2. **Bot**: Asks for familiarity level
3. **User**: "Beginner"
4. **Bot**: Generates quiz questions
5. **User**: Answers questions (A, B, C, D)
6. **Bot**: Provides score, recommendation, and personalized explanation

### LLM Mode:
1. **User**: "Who is Alan Turing?"
2. **Bot**: Provides direct AI-generated answer

## Architecture

### Core Files:
- `app.py`: Flask application with `/chat` route
- `chat_helpers.py`: Modular functions for AI integration
- `requirements.txt`: Python dependencies

### Key Functions:
- `gemini_query()`: AI API integration
- `generate_quiz()`: Quiz creation with fallbacks
- `evaluate_answers()`: Performance analysis
- `generate_personalized_explanation()`: Adaptive content generation
- `detect_learning_intent()`: Intent classification

## Session Management

The service maintains conversation state using Flask sessions:
```python
session['learning_chat'] = {
    'topic': 'Machine Learning',
    'level': 'Beginner',
    'questions': [...],
    'answers': ['A', 'B', 'C', 'D'],
    'current_question_index': 4,
    'evaluation': {...},
    'mode': 'completed'
}
```

## Error Handling

- **API Failures**: Graceful fallback to static content
- **Invalid Input**: Clear user guidance
- **Session Issues**: Automatic recovery
- **Network Errors**: Timeout handling with user-friendly messages

## Integration Notes

- **CORS Enabled**: Supports frontend requests from localhost:3000 and localhost:5173
- **Session Persistence**: 24-hour session lifetime
- **Frontend Compatible**: Maintains existing `/chat` endpoint contract
- **No Breaking Changes**: Preserves all existing functionality
