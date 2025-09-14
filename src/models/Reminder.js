// src/models/Reminder.js
import mongoose from 'mongoose';

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
    type: String, // Storing time as a string in 'HH:MM' format
    required: [true, 'Please provide a time for the reminder.'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// To prevent model recompilation error in Next.js hot-reload environment
export default mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);
