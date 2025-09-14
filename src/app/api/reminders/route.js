// src/app/api/reminders/route.js
import { NextResponse } from 'next/server';
import Reminders from '../../../lib/reminders';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, topic, time } = body;

    // Basic validation
    if (!name || !email || !topic || !time) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const result = await Reminders.addReminder({ name, email, topic, time });

    if (result.success) {
      return NextResponse.json(
        { success: true, data: result.data },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
