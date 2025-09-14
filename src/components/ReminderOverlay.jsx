// src/components/ReminderOverlay.jsx
'use client';

import { useState, useEffect } from 'react';

const ReminderOverlay = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    time: '',
  });
  const [error, setError] = useState('');

  // Reset form when overlay is closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        email: '',
        topic: '',
        time: '',
      });
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      alert(`Reminder set for ${formData.topic} at ${formData.time}`);
      onClose(); // Close the overlay on success
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 mx-4 bg-background rounded-xl shadow-2xl border border-border transform transition-all duration-300 ease-out scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-all duration-200 text-xl font-bold"
        >
          ×
        </button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Set a Reminder</h2>
          <p className="text-muted-foreground">Never miss your learning goals again!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-foreground">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-foreground">
              📧 Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          <div>
            <label htmlFor="topic" className="block mb-2 text-sm font-medium text-foreground">
              📚 Topic to Study
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              placeholder="e.g., JavaScript, React, Python..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
          </div>
          <div>
            <label htmlFor="time" className="block mb-2 text-sm font-medium text-foreground">
              ⏰ Reminder Time
            </label>
            <input
              type="text"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              placeholder="e.g., 2:30 PM, 14:30, 9:00 AM"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-foreground placeholder-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter time in any format: 2:30 PM, 14:30, 9 AM, etc.</p>
          </div>
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-md p-3 mt-4">
              <p className="text-destructive text-sm text-center">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-all duration-200 font-medium border border-input"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-all duration-200 font-medium shadow-sm"
            >
              🔔 Set Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderOverlay;
