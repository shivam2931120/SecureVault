import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return d.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

export function copyToClipboard(text: string, duration: number = 15000): Promise<void> {
  return new Promise((resolve) => {
    navigator.clipboard.writeText(text).then(() => {
      setTimeout(() => {
        navigator.clipboard.writeText('');
      }, duration);
      resolve();
    });
  });
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function assessPasswordStrength(password: string): {
  score: number;
  feedback: string;
  color: string;
} {
  let score = 0;
  
  if (!password) {
    return { score: 0, feedback: 'No password', color: 'text-text-secondary' };
  }

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Complexity checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Score interpretation
  if (score <= 2) {
    return { score, feedback: 'Weak', color: 'text-danger' };
  } else if (score <= 4) {
    return { score, feedback: 'Fair', color: 'text-warning' };
  } else if (score <= 6) {
    return { score, feedback: 'Good', color: 'text-success' };
  } else {
    return { score, feedback: 'Strong', color: 'text-success' };
  }
}
