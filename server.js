// server.js
// API server for handling reminder requests and chat functionality
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import session from 'express-session';

// Import chat helpers (ES6 module)
import {
  geminiQuery,
  generateQuiz,
  evaluateAnswers,
  generatePersonalizedExplanation,
  detectLearningIntent,
  extractTopicFromMessage
} from './chat_helpers.js';

// Load environment variables from .env.local
dotenv.config({ path: './.env.local' });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:8080',
    'http://192.168.71.1:8080',
    'http://192.168.48.1:8080',
    'http://172.29.118.23:8080'
  ],
  credentials: true
}));
app.use(express.json());

// Session configuration for chat functionality
app.use(session({
  secret: process.env.FLASK_SECRET_KEY || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Connection error', err));

// Reminder Schema
const ReminderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email.'],
    trim: true,
  },
  topic: {
    type: String,
    required: [true, 'Please provide a topic to study.'],
    trim: true,
  },
  time: {
    type: String,
    required: [true, 'Please provide a time for the reminder.'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);

// API Routes
app.post('/api/reminders', async (req, res) => {
  try {
    const { name, email, topic, time } = req.body;

    if (!name || !email || !topic || !time) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const reminder = new Reminder({ name, email, topic, time });
    await reminder.save();
    
    console.log('✅ Reminder saved:', { name, email, topic, time });
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    console.error('❌ API Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
  }
});

app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await Reminder.find({});
    res.status(200).json({ success: true, data: reminders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Chat endpoint for personalized learning chatbot
app.post('/chat', async (req, res) => {
  try {
    // Get user message from request
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ reply: "Please provide a message in your request." });
    }

    const userMessage = message.trim();

    // Initialize session data if needed
    if (!req.session.learningChat) {
      req.session.learningChat = {
        topic: null,
        level: null,
        questions: [],
        answers: [],
        currentQuestionIndex: 0,
        evaluation: null,
        mode: 'idle' // idle, awaiting_level, quiz, completed
      };
    }

    const chatData = req.session.learningChat;

    // Handle different conversation states
    if (chatData.mode === 'awaiting_level') {
      const reply = await handleLevelResponse(userMessage, chatData, req.session);
      return res.json({ reply });
    } else if (chatData.mode === 'quiz') {
      const reply = await handleQuizResponse(userMessage, chatData, req.session);
      return res.json({ reply });
    } else {
      // Check if this is a learning request or regular LLM query
      if (detectLearningIntent(userMessage) || userMessage.toLowerCase().includes('mode=learning')) {
        const reply = await startLearningMode(userMessage, chatData, req.session);
        return res.json({ reply });
      } else {
        const reply = await handleLLMMode(userMessage);
        return res.json({ reply });
      }
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({ reply: "I'm sorry, I encountered an error processing your request. Please try again." });
  }
});

// Chat helper functions
async function startLearningMode(userMessage, chatData, session) {
  try {
    const topic = extractTopicFromMessage(userMessage);
    
    // Reset chat data for new learning session
    Object.assign(chatData, {
      topic,
      level: null,
      questions: [],
      answers: [],
      currentQuestionIndex: 0,
      evaluation: null,
      mode: 'awaiting_level'
    });

    // Use Gemini API to generate dynamic response asking for level
    const prompt = `The user wants to learn about "${topic}". Ask them about their familiarity level with this topic in a friendly, encouraging way. Ask them to choose between Beginner, Intermediate, or Advanced level. Make it personalized and engaging.`;
    
    const response = await geminiQuery(prompt);
    return response;
  } catch (error) {
    console.error('Error starting learning mode:', error);
    const fallbackResponse = await geminiQuery(`The user wants to learn about a topic. Ask them about their familiarity level in a friendly way.`);
    return fallbackResponse || "I'd love to help you learn! What's your familiarity level with this topic - Beginner, Intermediate, or Advanced?";
  }
}

async function handleLevelResponse(userMessage, chatData, session) {
  try {
    const messageLower = userMessage.toLowerCase();
    let level;
    
    if (messageLower.includes('beginner') || messageLower.includes('begin') || messageLower.includes('new')) {
      level = 'Beginner';
    } else if (messageLower.includes('intermediate') || messageLower.includes('inter') || messageLower.includes('some')) {
      level = 'Intermediate';
    } else if (messageLower.includes('advanced') || messageLower.includes('expert') || messageLower.includes('strong')) {
      level = 'Advanced';
    } else {
      const prompt = "The user didn't specify a clear learning level. Ask them to choose between Beginner, Intermediate, or Advanced in a friendly, helpful way.";
      const response = await geminiQuery(prompt);
      return response;
    }

    // Generate quiz questions
    const questions = await generateQuiz(chatData.topic, level);
    
    if (!questions || questions.length === 0) {
      const errorResponse = await geminiQuery("I'm having trouble generating quiz questions right now. Apologize and offer to answer their question directly instead in a helpful way.");
      return errorResponse || "I'm having trouble generating quiz questions right now. Let me answer your question directly instead.";
    }

    // Update chat data
    Object.assign(chatData, {
      level,
      questions,
      answers: [],
      currentQuestionIndex: 0,
      mode: 'quiz'
    });

    // Start the quiz with dynamic AI response
    const firstQuestion = questions[0];
    const optionsText = firstQuestion.options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}`).join('\n');

    const prompt = `I'm starting a ${level.toLowerCase()}-level quiz about ${chatData.topic}. Here's the first question:\n\n${firstQuestion.question}\n\n${optionsText}\n\nGenerate an encouraging, personalized message to present this quiz question. Ask them to respond with A, B, C, or D. Make it engaging and supportive.`;
    
    const response = await geminiQuery(prompt);
    return response;
  } catch (error) {
    console.error('Error handling level response:', error);
    const errorResponse = await geminiQuery("I encountered an error setting up the quiz. Apologize to the user and offer to help them in a different way.");
    return errorResponse || "I encountered an error setting up your quiz. Let me try to help you in a different way.";
  }
}

async function handleQuizResponse(userMessage, chatData, session) {
  try {
    const answer = userMessage.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      const prompt = "The user didn't provide a valid quiz answer (A, B, C, or D). Ask them politely to choose one of the options in a friendly, encouraging way.";
      const response = await geminiQuery(prompt);
      return response;
    }

    // Store the answer
    chatData.answers.push(answer);
    chatData.currentQuestionIndex++;

    // Check if quiz is complete
    if (chatData.currentQuestionIndex >= chatData.questions.length) {
      return await completeQuiz(chatData);
    } else {
      return askNextQuestion(chatData);
    }
  } catch (error) {
    console.error('Error handling quiz response:', error);
    const errorResponse = await geminiQuery("I had trouble processing the user's quiz answer. Ask them to try again with A, B, C, or D in a supportive way.");
    return errorResponse || "I had trouble processing your answer. Please try responding with A, B, C, or D.";
  }
}

async function askNextQuestion(chatData) {
  try {
    const currentIndex = chatData.currentQuestionIndex;
    const question = chatData.questions[currentIndex];
    const totalQuestions = chatData.questions.length;

    const optionsText = question.options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}`).join('\n');

    const prompt = `Present question ${currentIndex + 1} of ${totalQuestions} in an engaging way:\n\n${question.question}\n\n${optionsText}\n\nGenerate an encouraging message to present this question. Ask them to respond with A, B, C, or D. Keep it supportive and motivating.`;
    
    const response = await geminiQuery(prompt);
    return response;
  } catch (error) {
    console.error('Error asking next question:', error);
    const fallbackResponse = await geminiQuery("Present the next quiz question in an encouraging way and ask for their answer choice.");
    return fallbackResponse || "Here's your next question! Please choose A, B, C, or D.";
  }
}

async function completeQuiz(chatData) {
  try {
    // Evaluate the answers
    const evaluation = evaluateAnswers(
      chatData.topic,
      chatData.level,
      chatData.questions,
      chatData.answers
    );

    chatData.evaluation = evaluation;
    chatData.mode = 'completed';

    // Generate personalized explanation
    const explanation = await generatePersonalizedExplanation(
      chatData.topic,
      chatData.level,
      evaluation
    );

    // Use Gemini API to present results in a personalized way
    const prompt = `The user completed a quiz about ${chatData.topic}. Here are their results:
    - Score: ${evaluation.score}/${evaluation.total} (${evaluation.percentage}%)
    - Level: ${chatData.level}
    - Recommendation: ${evaluation.recommendation} (${evaluation.feedback})
    
    Present these results in an encouraging, personalized way. Then provide this explanation: ${explanation}
    
    Make it motivating and supportive, and invite them to ask follow-up questions or explore new topics.`;
    
    const response = await geminiQuery(prompt);
    return response;
  } catch (error) {
    console.error('Error completing quiz:', error);
    const errorResponse = await geminiQuery("I completed the user's quiz but had trouble generating detailed results. Tell them they did great and invite them to ask more questions in an encouraging way.");
    return errorResponse || "I completed your quiz but had trouble generating the detailed results. You did great! Feel free to ask me more questions.";
  }
}

async function handleLLMMode(userMessage) {
  try {
    const response = await geminiQuery(userMessage);
    return response;
  } catch (error) {
    console.error('Error in LLM mode:', error);
    const errorResponse = await geminiQuery("I'm having trouble processing the user's request right now. Apologize and ask them to try again in a supportive, helpful way.");
    return errorResponse || "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
  }
}

// Chat session reset endpoint
app.post('/chat/reset', async (req, res) => {
  try {
    req.session.learningChat = null;
    const resetMessage = await geminiQuery("The user has reset their chat session. Welcome them back as their AI learning assistant and ask how you can help them today.");
    res.json({ reply: resetMessage });
  } catch (error) {
    console.error('Error resetting chat:', error);
    const fallbackMessage = await geminiQuery("Welcome the user back and ask how you can help them learn today.");
    res.json({ reply: fallbackMessage || "I'm ready to help you learn! What would you like to explore?" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
