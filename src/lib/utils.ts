
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useState, useEffect } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useFormattedTimestamp(timestamp: number | Date | undefined) {
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    // This effect runs only on the client, after hydration
    // It prevents a mismatch between server and client rendered times
    if (timestamp) {
        const date = new Date(timestamp);
        // Using a non-locale specific format can sometimes be safer
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setFormattedTime(`${hours}:${minutes}`);
    } else {
        setFormattedTime('');
    }
  }, [timestamp]);

  return formattedTime;
}
