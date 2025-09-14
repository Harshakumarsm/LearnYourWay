// src/api/reminders.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: './.env.local' });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error', err));

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
    
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    console.error('API Error:', error);
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

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
