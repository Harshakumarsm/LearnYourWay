"""
Chat Helper Functions for Personalized Learning Chatbot
Provides modular functions for Gemini API integration, quiz generation, and learning assessment.
"""

import os
import json
import requests
from typing import Dict, List, Tuple, Optional, Any

# Environment variables
GEMINI_API_URL = os.getenv('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def gemini_query(prompt: str) -> str:
    """
    Send a query to Gemini API and return the response.
    
    Args:
        prompt (str): The prompt to send to Gemini
        
    Returns:
        str: The response from Gemini API or fallback message
    """
    if not GEMINI_API_KEY:
        return "I'm currently unable to access the AI service. Please try again later."
    
    try:
        headers = {
            'Content-Type': 'application/json',
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                content = data['candidates'][0]['content']['parts'][0]['text']
                return content.strip()
            else:
                return "I couldn't generate a proper response. Please try rephrasing your question."
        else:
            print(f"Gemini API Error: {response.status_code} - {response.text}")
            return "I'm experiencing technical difficulties. Please try again in a moment."
            
    except requests.exceptions.Timeout:
        return "The request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return "I'm currently unable to process your request. Please try again later."
    except Exception as e:
        print(f"Unexpected error in gemini_query: {e}")
        return "An unexpected error occurred. Please try again."

def generate_quiz(topic: str, level: str) -> List[Dict[str, Any]]:
    """
    Generate quiz questions for a given topic and difficulty level.
    
    Args:
        topic (str): The topic to generate questions about
        level (str): The difficulty level (Beginner/Intermediate/Advanced)
        
    Returns:
        List[Dict]: List of quiz questions with options and correct answers
    """
    if not GEMINI_API_KEY:
        return _get_fallback_quiz(topic, level)
    
    prompt = f"""
    Generate exactly 4 multiple-choice quiz questions about "{topic}" for a {level} level learner.
    
    Format your response as a JSON array where each question has:
    - "question": the question text
    - "options": array of 4 possible answers (A, B, C, D)
    - "correct": the correct option letter (A, B, C, or D)
    - "explanation": brief explanation of why this answer is correct
    
    Make sure questions are appropriate for {level} level and cover different aspects of {topic}.
    
    Example format:
    [
        {{
            "question": "What is...",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": "A",
            "explanation": "This is correct because..."
        }}
    ]
    
    Return only the JSON array, no additional text.
    """
    
    try:
        response = gemini_query(prompt)
        
        # Try to extract JSON from the response
        json_start = response.find('[')
        json_end = response.rfind(']') + 1
        
        if json_start != -1 and json_end != 0:
            json_str = response[json_start:json_end]
            questions = json.loads(json_str)
            
            # Validate the structure
            if isinstance(questions, list) and len(questions) > 0:
                for q in questions:
                    if all(key in q for key in ['question', 'options', 'correct', 'explanation']):
                        continue
                    else:
                        raise ValueError("Invalid question structure")
                return questions
            else:
                raise ValueError("Invalid response format")
        else:
            raise ValueError("No JSON found in response")
            
    except Exception as e:
        print(f"Error generating quiz with Gemini: {e}")
        return _get_fallback_quiz(topic, level)

def _get_fallback_quiz(topic: str, level: str) -> List[Dict[str, Any]]:
    """
    Provide fallback quiz questions when Gemini API is unavailable.
    
    Args:
        topic (str): The topic for the quiz
        level (str): The difficulty level
        
    Returns:
        List[Dict]: Fallback quiz questions
    """
    fallback_questions = [
        {
            "question": f"What is the most important concept to understand when learning about {topic}?",
            "options": [
                "The basic definition and core principles",
                "Advanced implementation details",
                "Historical background only",
                "Memorizing all technical terms"
            ],
            "correct": "A",
            "explanation": "Understanding basic definitions and core principles provides the foundation for deeper learning."
        },
        {
            "question": f"When studying {topic}, what's the best approach for a {level} learner?",
            "options": [
                "Jump directly to advanced topics",
                "Start with fundamentals and build up gradually",
                "Only read theoretical materials",
                "Avoid practical examples"
            ],
            "correct": "B",
            "explanation": "Building knowledge gradually from fundamentals ensures solid understanding."
        },
        {
            "question": f"What indicates good progress in learning {topic}?",
            "options": [
                "Memorizing definitions perfectly",
                "Being able to explain concepts simply",
                "Reading many books quickly",
                "Avoiding challenging questions"
            ],
            "correct": "B",
            "explanation": "The ability to explain concepts simply demonstrates true understanding."
        },
        {
            "question": f"What's a common mistake when learning {topic}?",
            "options": [
                "Practicing regularly",
                "Asking questions when confused",
                "Rushing through without understanding basics",
                "Taking breaks to process information"
            ],
            "correct": "C",
            "explanation": "Rushing through material without solid foundation often leads to confusion later."
        }
    ]
    
    return fallback_questions

def evaluate_answers(topic: str, level: str, questions: List[Dict], answers: List[str]) -> Dict[str, Any]:
    """
    Evaluate quiz answers and provide scoring with recommendations.
    
    Args:
        topic (str): The topic that was quizzed
        level (str): The learner's stated level
        questions (List[Dict]): The quiz questions that were asked
        answers (List[str]): The user's answers (A, B, C, or D)
        
    Returns:
        Dict: Evaluation results with score, percentage, and recommendation
    """
    if len(answers) != len(questions):
        return {
            "score": 0,
            "total": len(questions),
            "percentage": 0,
            "recommendation": "stay",
            "feedback": "Incomplete quiz - please answer all questions."
        }
    
    correct_count = 0
    detailed_feedback = []
    
    for i, (question, answer) in enumerate(zip(questions, answers)):
        is_correct = answer.upper() == question['correct'].upper()
        if is_correct:
            correct_count += 1
        
        detailed_feedback.append({
            "question_num": i + 1,
            "correct": is_correct,
            "user_answer": answer.upper(),
            "correct_answer": question['correct'],
            "explanation": question.get('explanation', 'No explanation available.')
        })
    
    percentage = (correct_count / len(questions)) * 100
    
    # Determine recommendation based on score and current level
    if percentage >= 80:
        if level.lower() == 'beginner':
            recommendation = "advance"
            rec_message = "Excellent work! You're ready to move to intermediate level."
        elif level.lower() == 'intermediate':
            recommendation = "advance"
            rec_message = "Great job! Consider exploring advanced topics."
        else:  # advanced
            recommendation = "stay"
            rec_message = "Outstanding! Continue exploring advanced concepts."
    elif percentage >= 60:
        recommendation = "stay"
        rec_message = f"Good progress! Continue practicing at the {level} level."
    else:
        if level.lower() == 'intermediate':
            recommendation = "retreat"
            rec_message = "Consider reviewing beginner concepts to strengthen your foundation."
        elif level.lower() == 'advanced':
            recommendation = "retreat"
            rec_message = "You might benefit from reviewing intermediate concepts first."
        else:  # beginner
            recommendation = "stay"
            rec_message = "Keep practicing! Focus on the fundamental concepts."
    
    return {
        "score": correct_count,
        "total": len(questions),
        "percentage": round(percentage, 1),
        "recommendation": recommendation,
        "feedback": rec_message,
        "detailed_feedback": detailed_feedback
    }

def generate_personalized_explanation(topic: str, level: str, evaluation: Dict[str, Any]) -> str:
    """
    Generate a personalized explanation based on quiz performance.
    
    Args:
        topic (str): The topic to explain
        level (str): The learner's level
        evaluation (Dict): The quiz evaluation results
        
    Returns:
        str: Personalized explanation tailored to the learner
    """
    score_percentage = evaluation.get('percentage', 0)
    recommendation = evaluation.get('recommendation', 'stay')
    
    # Determine explanation depth based on performance and level
    if score_percentage >= 80:
        explanation_level = "advanced" if level.lower() != "beginner" else "intermediate"
    elif score_percentage >= 60:
        explanation_level = level.lower()
    else:
        explanation_level = "beginner" if level.lower() != "beginner" else "basic"
    
    prompt = f"""
    Create a personalized explanation of "{topic}" for a learner who:
    - Claims to be at {level} level
    - Scored {score_percentage}% on a quiz
    - Should {recommendation} in difficulty based on performance
    
    Tailor the explanation to {explanation_level} level depth. Include:
    1. Core concepts explained clearly
    2. Real-world examples and applications
    3. Key takeaways
    4. Suggested next steps for learning
    
    Keep it engaging, encouraging, and educational. Limit to about 300-400 words.
    """
    
    if not GEMINI_API_KEY:
        return _get_fallback_explanation(topic, level, evaluation)
    
    try:
        explanation = gemini_query(prompt)
        return explanation
    except Exception as e:
        print(f"Error generating personalized explanation: {e}")
        return _get_fallback_explanation(topic, level, evaluation)

def _get_fallback_explanation(topic: str, level: str, evaluation: Dict[str, Any]) -> str:
    """
    Provide fallback explanation when Gemini API is unavailable.
    
    Args:
        topic (str): The topic to explain
        level (str): The learner's level
        evaluation (Dict): The quiz evaluation results
        
    Returns:
        str: Fallback explanation
    """
    score_percentage = evaluation.get('percentage', 0)
    recommendation = evaluation.get('recommendation', 'stay')
    
    explanation = f"""
    ## Understanding {topic}
    
    Based on your quiz performance ({score_percentage}%), here's a personalized explanation:
    
    **Core Concepts:**
    {topic} is a fundamental area of study that requires understanding both theoretical principles and practical applications. The key is to build your knowledge step by step, ensuring each concept is well understood before moving to the next.
    
    **Your Performance Analysis:**
    You scored {evaluation.get('score', 0)} out of {evaluation.get('total', 4)} questions correctly. This suggests you have {'a strong foundation' if score_percentage >= 70 else 'room for improvement in the basics' if score_percentage >= 50 else 'significant learning opportunities ahead'}.
    
    **Recommended Next Steps:**
    {evaluation.get('feedback', 'Continue practicing and studying.')}
    
    {'Focus on mastering advanced concepts and exploring specialized areas.' if recommendation == 'advance' else 
     'Continue practicing at your current level to strengthen understanding.' if recommendation == 'stay' else 
     'Consider reviewing fundamental concepts to build a stronger foundation.'}
    
    **Learning Tips:**
    - Practice regularly with hands-on examples
    - Don't hesitate to ask questions when concepts are unclear
    - Connect new learning to what you already know
    - Take breaks to let information process
    
    Keep up the great work in your learning journey!
    """
    
    return explanation.strip()

def detect_learning_intent(message: str) -> bool:
    """
    Detect if a message indicates learning intent.
    
    Args:
        message (str): The user's message
        
    Returns:
        bool: True if message indicates learning intent
    """
    learning_keywords = [
        'explain', 'teach', 'learn', 'understand', 'how does', 'what is',
        'help me learn', 'i want to learn', 'can you teach', 'show me how',
        'tutorial', 'lesson', 'study', 'education', 'course'
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in learning_keywords)

def extract_topic_from_message(message: str) -> str:
    """
    Extract the main topic from a learning-oriented message.
    
    Args:
        message (str): The user's message
        
    Returns:
        str: Extracted topic or the original message if no clear topic
    """
    # Simple topic extraction - look for patterns like "explain X", "teach me Y", etc.
    message_lower = message.lower()
    
    patterns = [
        ('explain ', ''),
        ('teach me ', ''),
        ('what is ', ''),
        ('how does ', ' work'),
        ('help me learn ', ''),
        ('i want to learn ', ''),
        ('can you teach ', ''),
        ('show me how ', ' works'),
    ]
    
    for start_pattern, end_pattern in patterns:
        if start_pattern in message_lower:
            start_idx = message_lower.find(start_pattern) + len(start_pattern)
            topic_part = message[start_idx:].strip()
            
            # Remove common endings
            if end_pattern and topic_part.lower().endswith(end_pattern):
                topic_part = topic_part[:-len(end_pattern)].strip()
            
            # Remove question marks and other punctuation
            topic_part = topic_part.rstrip('?!.').strip()
            
            if topic_part:
                return topic_part
    
    # If no pattern matches, return the original message
    return message.strip()
