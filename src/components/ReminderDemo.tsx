// src/components/ReminderDemo.tsx
'use client';

import { useState } from 'react';
import ReminderOverlay from './ReminderOverlay'; // Adjust the import path if necessary

export function ReminderDemo() {
  const [isOverlayOpen, setOverlayOpen] = useState(false);

  const handleOpenOverlay = () => {
    setOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setOverlayOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">
          Welcome to LearnYourWay
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-gray-400 mb-8">
          Your personalized learning journey starts here.
        </p>
        <button
          onClick={handleOpenOverlay}
          className="px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg"
        >
          PingMe!
        </button>
      </main>

      <ReminderOverlay isOpen={isOverlayOpen} onClose={handleCloseOverlay} />
    </div>
  );
}
