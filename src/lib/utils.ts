
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useState, useEffect } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useFormattedTimestamp(timestamp: number | Date) {
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    // This effect runs only on the client, after hydration
    // It prevents a mismatch between server and client rendered times
    if (timestamp) {
        const date = new Date(timestamp);
        setFormattedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [timestamp]);

  return formattedTime;
}
