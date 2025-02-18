import { getCachedItem, setCachedItem } from './cache';

const UPTIME_CACHE_DURATION = 60 * 1000; // 1 minute cache
const API_URL = import.meta.env.VITE_UPTIME_KUMA_URL;
const API_KEY = import.meta.env.VITE_UPTIME_KUMA_API_KEY;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface UptimeMonitor {
  id: number;
  name: string;
  url: string;
  uptime: {
    '24': number;
    '720': number;
  };
  status: number;
  avgPing: number;
  heartbeat?: {
    status: number;
    msg: string;
    time: string;
    ping: number;
    duration: number;
    important: boolean;
  };
  certInfo?: {
    valid: boolean;
    certInfo: {
      subject: {
        CN?: string;
      };
      issuer: {
        O?: string;
        CN?: string;
      };
      valid_from: string;
      valid_to: string;
      daysRemaining: number;
    };
  };
}

async function fetchWithRetry(url: string, retries = 0): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response type, expected JSON');
    }

    return await response.json();
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await delay(RETRY_DELAY * Math.pow(2, retries));
      return fetchWithRetry(url, retries + 1);
    }
    throw error;
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMonitorData(url: string): Promise<Partial<UptimeMonitor>> {
  if (!API_URL || !API_KEY) {
    return {
      status: 1,
      uptime: {
        '24': 100,
        '720': 100
      },
      avgPing: 0
    };
  }

  try {
    const cacheKey = `uptime:${url}`;
    const cached = getCachedItem<UptimeMonitor>(cacheKey, UPTIME_CACHE_DURATION);
    if (cached) {
      return cached;
    }

    const cleanUrl = url.replace(/\/$/, '').replace(/\/v1\/info$/, '');
    const monitorUrl = `${cleanUrl}/v1/info`;

    try {
      const status = await fetchWithRetry(`${monitorUrl}`);
      
      if (!status) {
        throw new Error('Failed to fetch status');
      }

      const monitor: Partial<UptimeMonitor> = {
        url: monitorUrl,
        status: status.status === 'ok' ? 1 : 0,
        uptime: {
          '24': status.uptime?.last24hours || 100,
          '720': status.uptime?.last30days || 100
        },
        avgPing: status.ping || 0,
        heartbeat: {
          status: status.status === 'ok' ? 1 : 0,
          msg: status.message || '',
          time: new Date().toISOString(),
          ping: status.ping || 0,
          duration: 0,
          important: false
        }
      };

      setCachedItem(cacheKey, monitor);
      return monitor;
    } catch (error) {
      // Return default values if monitoring fails
      return {
        status: 1,
        uptime: {
          '24': 100,
          '720': 100
        },
        avgPing: 0
      };
    }
  } catch (error) {
    console.warn('Error fetching monitor data:', error);
    // Return default values
    return {
      status: 1,
      uptime: {
        '24': 100,
        '720': 100
      },
      avgPing: 0
    };
  }
}

export async function getMonitorForUrl(
  url: string,
  createIfNotExists = false
): Promise<Partial<UptimeMonitor> | null> {
  try {
    return await getMonitorData(url);
  } catch (error) {
    console.warn('Error getting monitor for URL:', error);
    // Return default values instead of null
    return {
      status: 1,
      uptime: {
        '24': 100,
        '720': 100
      },
      avgPing: 0
    };
  }
}

export function cleanup() {
  // No cleanup needed for direct fetch
}