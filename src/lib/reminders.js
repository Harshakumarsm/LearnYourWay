// src/lib/reminders.js
import connectToDatabase from './mongoose';
import Reminder from '../models/Reminder';

class Reminders {
  static async addReminder(data) {
    try {
      await connectToDatabase();
      const reminder = new Reminder(data);
      await reminder.save();
      return { success: true, data: reminder };
    } catch (error) {
      console.error('Error adding reminder:', error);
      return { success: false, error: error.message };
    }
  }

  static async getReminders() {
    try {
      await connectToDatabase();
      const reminders = await Reminder.find({});
      return { success: true, data: reminders };
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return { success: false, error: error.message };
    }
  }
}

export default Reminders;
