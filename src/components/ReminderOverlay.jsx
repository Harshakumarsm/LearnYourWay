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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-8 mx-4 bg-gray-900 rounded-2xl shadow-2xl border border-gray-600 text-white transform transition-all duration-300 ease-out scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all duration-200 text-xl font-bold"
        >
          ×
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Set a Reminder</h2>
          <p className="text-gray-300">Never miss your learning goals again!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">
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
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-white placeholder-gray-400 font-medium"
              style={{
                color: '#ffffff',
                backgroundColor: '#374151',
                fontSize: '16px'
              }}
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
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
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-white placeholder-gray-400 font-medium"
              style={{
                color: '#ffffff',
                backgroundColor: '#374151',
                fontSize: '16px'
              }}
            />
          </div>
          <div>
            <label htmlFor="topic" className="block mb-2 text-sm font-medium text-gray-300">
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
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-white placeholder-gray-400 font-medium"
              style={{
                color: '#ffffff',
                backgroundColor: '#374151',
                fontSize: '16px'
              }}
            />
          </div>
          <div>
            <label htmlFor="time" className="block mb-2 text-sm font-medium text-gray-300">
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
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-white placeholder-gray-400 font-medium"
              style={{
                color: '#ffffff',
                backgroundColor: '#374151',
                fontSize: '16px'
              }}
            />
            <p className="text-xs text-gray-400 mt-1">Enter time in any format: 2:30 PM, 14:30, 9 AM, etc.</p>
          </div>
          {error && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-3 mt-4">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 font-medium border border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 font-medium shadow-lg"
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
