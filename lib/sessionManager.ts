/**
 * Session Manager for better cookie and state management
 * Helps improve loading performance and reliability
 */

const SESSION_STORAGE_KEY = 'app_session_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedSession {
  user: any;
  bookingData: any;
  timestamp: number;
}

export class SessionManager {
  /**
   * Cache session data in sessionStorage for faster subsequent loads
   */
  static cacheSession(user: any, bookingData?: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cache: CachedSession = {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        },
        bookingData: bookingData || null,
        timestamp: Date.now(),
      };
      
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache session:', error);
    }
  }

  /**
   * Get cached session if still valid
   */
  static getCachedSession(): CachedSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!cached) return null;
      
      const data: CachedSession = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        this.clearCache();
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to get cached session:', error);
      return null;
    }
  }

  /**
   * Clear cached session data
   */
  static clearCache(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear all auth-related storage
   */
  static clearAllAuthData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear session cache
      sessionStorage.clear();
      
      // Clear Supabase auth data from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('Cleared storage key:', key);
        } catch (e) {
          console.warn('Failed to remove key:', key, e);
        }
      });
      
      console.log('Cleared all auth data:', keysToRemove.length, 'keys removed');
    } catch (error) {
      console.warn('Failed to clear auth data:', error);
    }
  }
}

export default SessionManager;
