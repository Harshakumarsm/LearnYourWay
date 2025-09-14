"""
Flask Backend for LearnYourWay - Personalized Learning Chatbot
Provides /chat endpoint with learning mode and LLM mode functionality.
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
from datetime import timedelta
import secrets

# Import our modular chat helper functions
from chat_helpers import (
    gemini_query,
    generate_quiz,
    evaluate_answers,
    generate_personalized_explanation,
    detect_learning_intent,
    extract_topic_from_message
)

app = Flask(__name__)

# Configure CORS to allow requests from frontend
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:5173"])

# Session configuration
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

@app.route('/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint supporting both Learning Mode and LLM Mode.
    
    Expected JSON: {"message": "user message"}
    Returns JSON: {"reply": "bot response"}
    """
    try:
        # Get user message from request
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"reply": "Please provide a message in your request."}), 400
        
        user_message = data['message'].strip()
        if not user_message:
            return jsonify({"reply": "Please provide a non-empty message."}), 400
        
        # Initialize session data if needed
        if 'learning_chat' not in session:
            session['learning_chat'] = {
                'topic': None,
                'level': None,
                'questions': [],
                'answers': [],
                'current_question_index': 0,
                'evaluation': None,
                'mode': 'idle'  # idle, awaiting_level, quiz, completed
            }
        
        chat_data = session['learning_chat']
        
        # Handle different conversation states
        if chat_data['mode'] == 'awaiting_level':
            return _handle_level_response(user_message, chat_data)
        elif chat_data['mode'] == 'quiz':
            return _handle_quiz_response(user_message, chat_data)
        else:
            # Check if this is a learning request or regular LLM query
            if detect_learning_intent(user_message) or 'mode=learning' in user_message.lower():
                return _start_learning_mode(user_message, chat_data)
            else:
                return _handle_llm_mode(user_message)
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({"reply": "I'm sorry, I encountered an error processing your request. Please try again."}), 500

def _start_learning_mode(user_message: str, chat_data: dict) -> tuple:
    """
    Start learning mode by extracting topic and asking for level.
    """
    try:
        # Extract topic from the message
        topic = extract_topic_from_message(user_message)
        
        # Reset chat data for new learning session
        chat_data.update({
            'topic': topic,
            'level': None,
            'questions': [],
            'answers': [],
            'current_question_index': 0,
            'evaluation': None,
            'mode': 'awaiting_level'
        })
        
        # Save session
        session['learning_chat'] = chat_data
        session.permanent = True
        
        reply = f"Great! I'd love to help you learn about **{topic}**. 📚\n\nTo provide you with the best learning experience, can you tell me your familiarity with this topic?\n\nPlease choose:\n- **Beginner** (New to this topic)\n- **Intermediate** (Some knowledge and experience)\n- **Advanced** (Strong understanding, looking to deepen knowledge)\n\nJust type your level!"
        
        return jsonify({"reply": reply})
    
    except Exception as e:
        print(f"Error starting learning mode: {e}")
        return jsonify({"reply": "I had trouble understanding your learning request. Could you try rephrasing it?"})

def _handle_level_response(user_message: str, chat_data: dict) -> tuple:
    """
    Handle user's level response and start quiz generation.
    """
    try:
        # Parse the level from user input
        message_lower = user_message.lower()
        if 'beginner' in message_lower or 'begin' in message_lower or 'new' in message_lower:
            level = 'Beginner'
        elif 'intermediate' in message_lower or 'inter' in message_lower or 'some' in message_lower:
            level = 'Intermediate'
        elif 'advanced' in message_lower or 'expert' in message_lower or 'strong' in message_lower:
            level = 'Advanced'
        else:
            return jsonify({"reply": "I didn't quite catch your level. Please respond with **Beginner**, **Intermediate**, or **Advanced**."})
        
        # Generate quiz questions
        topic = chat_data['topic']
        questions = generate_quiz(topic, level)
        
        if not questions:
            return jsonify({"reply": "I'm having trouble generating quiz questions right now. Let me answer your question directly instead."})
        
        # Update chat data
        chat_data.update({
            'level': level,
            'questions': questions,
            'answers': [],
            'current_question_index': 0,
            'mode': 'quiz'
        })
        
        session['learning_chat'] = chat_data
        
        # Start the quiz
        first_question = questions[0]
        options_text = '\n'.join([f"**{chr(65+i)}.** {option}" for i, option in enumerate(first_question['options'])])
        
        reply = f"Perfect! I've prepared a {level.lower()}-level quiz about **{topic}** to assess your understanding. 🎯\n\n**Question 1 of {len(questions)}:**\n\n{first_question['question']}\n\n{options_text}\n\nPlease respond with the letter of your choice (A, B, C, or D)."
        
        return jsonify({"reply": reply})
    
    except Exception as e:
        print(f"Error handling level response: {e}")
        return jsonify({"reply": "I encountered an error setting up your quiz. Let me try to help you in a different way."})

def _handle_quiz_response(user_message: str, chat_data: dict) -> tuple:
    """
    Handle user's quiz answer and proceed to next question or evaluation.
    """
    try:
        # Parse the answer
        answer = user_message.strip().upper()
        if answer not in ['A', 'B', 'C', 'D']:
            return jsonify({"reply": "Please respond with A, B, C, or D for your answer choice."})
        
        # Store the answer
        chat_data['answers'].append(answer)
        chat_data['current_question_index'] += 1
        
        # Check if quiz is complete
        if chat_data['current_question_index'] >= len(chat_data['questions']):
            # Quiz completed - evaluate and provide personalized explanation
            return _complete_quiz(chat_data)
        else:
            # Move to next question
            return _ask_next_question(chat_data)
    
    except Exception as e:
        print(f"Error handling quiz response: {e}")
        return jsonify({"reply": "I had trouble processing your answer. Please try again with A, B, C, or D."})

def _ask_next_question(chat_data: dict) -> tuple:
    """
    Ask the next quiz question.
    """
    try:
        current_index = chat_data['current_question_index']
        question = chat_data['questions'][current_index]
        total_questions = len(chat_data['questions'])
        
        options_text = '\n'.join([f"**{chr(65+i)}.** {option}" for i, option in enumerate(question['options'])])
        
        reply = f"**Question {current_index + 1} of {total_questions}:**\n\n{question['question']}\n\n{options_text}\n\nPlease respond with the letter of your choice (A, B, C, or D)."
        
        session['learning_chat'] = chat_data
        return jsonify({"reply": reply})
    
    except Exception as e:
        print(f"Error asking next question: {e}")
        return jsonify({"reply": "I encountered an error with the next question. Let me help you in a different way."})

def _complete_quiz(chat_data: dict) -> tuple:
    """
    Complete the quiz, evaluate answers, and provide personalized explanation.
    """
    try:
        # Evaluate the answers
        evaluation = evaluate_answers(
            chat_data['topic'],
            chat_data['level'],
            chat_data['questions'],
            chat_data['answers']
        )
        
        chat_data['evaluation'] = evaluation
        chat_data['mode'] = 'completed'
        session['learning_chat'] = chat_data
        
        # Generate personalized explanation
        explanation = generate_personalized_explanation(
            chat_data['topic'],
            chat_data['level'],
            evaluation
        )
        
        # Format the results
        score_text = f"**Quiz Results:** {evaluation['score']}/{evaluation['total']} ({evaluation['percentage']}%)"
        
        recommendation_emoji = {
            'advance': '🚀',
            'stay': '💪',
            'retreat': '🔄'
        }.get(evaluation['recommendation'], '📚')
        
        recommendation_text = f"{recommendation_emoji} **Recommendation:** {evaluation['feedback']}"
        
        reply = f"🎉 **Quiz Complete!**\n\n{score_text}\n\n{recommendation_text}\n\n---\n\n{explanation}\n\n---\n\n💡 Feel free to ask me any follow-up questions about **{chat_data['topic']}** or start learning about a new topic!"
        
        return jsonify({"reply": reply})
    
    except Exception as e:
        print(f"Error completing quiz: {e}")
        return jsonify({"reply": "I completed your quiz but had trouble generating the detailed results. You did great! Feel free to ask me more questions."})

def _handle_llm_mode(user_message: str) -> tuple:
    """
    Handle regular LLM queries using Gemini API.
    """
    try:
        # Use Gemini API for general questions
        response = gemini_query(user_message)
        return jsonify({"reply": response})
    
    except Exception as e:
        print(f"Error in LLM mode: {e}")
        return jsonify({"reply": "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "LearnYourWay Chat Service"})

@app.route('/chat/reset', methods=['POST'])
def reset_chat():
    """Reset the chat session."""
    try:
        session.pop('learning_chat', None)
        return jsonify({"reply": "Chat session has been reset. How can I help you learn today?"})
    except Exception as e:
        print(f"Error resetting chat: {e}")
        return jsonify({"reply": "Session reset complete."})

if __name__ == '__main__':
    # Development server configuration
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting LearnYourWay Chat Service on port {port}")
    print(f"🔧 Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
