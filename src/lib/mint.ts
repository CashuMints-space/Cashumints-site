import { MintInfo, MintInfoSchema } from '../types/mint';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 15000; // 15 seconds

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchMintInfo(url: string, retryCount = 0): Promise<MintInfo | null> {
  try {
    // Clean and validate URL
    const baseUrl = url.replace(/\/$/, '').replace(/\/v1\/info$/, '');
    const infoUrl = `${baseUrl}/v1/info`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('Request timeout');
    }, TIMEOUT);

    try {
      const response = await fetch(infoUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      // Clear timeout since request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Pre-process the data to handle common issues
      const processedData = {
        ...data,
        // Ensure nuts is an object if it exists
        nuts: typeof data.nuts === 'object' ? data.nuts : {},
        // Convert any null values to undefined
        ...Object.entries(data).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value === null ? undefined : value
        }), {}),
        // Add default values for required fields
        name: data.name || url.split('//')[1]?.split('/')[0] || url,
        description: data.description || 'No description available',
        version: data.version || 'Unknown',
        // Process contact array to ensure consistent format
        contact: Array.isArray(data.contact) ? data.contact.map((contact: any) => {
          if (Array.isArray(contact)) {
            return {
              method: contact[0],
              info: contact[1]
            };
          }
          return contact;
        }).filter((contact: any) => contact.info) : [] // Filter out empty contact info
      };

      const result = MintInfoSchema.safeParse(processedData);
      
      if (!result.success) {
        console.warn('Invalid mint info schema:', {
          error: result.error,
          data: processedData,
          url: infoUrl
        });
        // Return processed data even if schema validation fails
        return processedData as MintInfo;
      }

      return result.data;
    } finally {
      // Ensure timeout is cleared in case of error
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Handle specific error types
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('Network error fetching mint info:', {
        url: url,
        error: error.message,
        attempt: retryCount + 1
      });
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Request timed out or was aborted:', {
        url: url,
        attempt: retryCount + 1
      });
    } else {
      console.warn('Error fetching mint info:', {
        url: url,
        error: error,
        attempt: retryCount + 1
      });
    }

    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount);
      await delay(backoffDelay);
      return fetchMintInfo(url, retryCount + 1);
    }

    // Return a default mint info object if all retries fail
    return {
      name: url.split('//')[1]?.split('/')[0] || url,
      description: 'Could not fetch mint information',
      version: 'Unknown',
      nuts: {}
    };
  }
}