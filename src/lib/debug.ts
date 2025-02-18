import debug from 'debug';

// Create namespaced debuggers
export const log = {
  nostr: debug('nostr'),
  mint: debug('mint'),
  uptime: debug('uptime'),
  cache: debug('cache'),
  error: debug('error')
};

// Enable debugging based on environment variable
if (import.meta.env.VITE_DEBUG === 'true') {
  // Enable all debuggers
  localStorage.debug = '*';
  
  // Add console methods for easier debugging
  log.nostr.log = console.log.bind(console);
  log.mint.log = console.log.bind(console);
  log.uptime.log = console.log.bind(console);
  log.cache.log = console.log.bind(console);
  log.error.log = console.error.bind(console);
} else {
  // Disable all debuggers
  localStorage.debug = '';
}

// Helper to stringify objects for logging
export const stringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
};

// Helper to log errors with stack traces
export const logError = (error: unknown, context?: string): void => {
  if (import.meta.env.VITE_DEBUG === 'true') {
    if (error instanceof Error) {
      log.error(`${context ? `[${context}] ` : ''}${error.message}\n${error.stack}`);
    } else {
      log.error(`${context ? `[${context}] ` : ''}`, error);
    }
  }
};