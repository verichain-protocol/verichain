/// VeriChain Local Storage Utility
/// Handles localStorage operations for user session data

export interface StoredUserData {
  principal: string;
  timestamp: number;
  isAuthenticated: boolean;
}

const STORAGE_KEYS = {
  USER_PRINCIPAL: 'verichain_user_principal',
  USER_DATA: 'verichain_user_data',
  AUTH_STATE: 'verichain_auth_state'
} as const;

// Session duration: 24 hours (can be configured)
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class LocalStorageManager {
  
  /**
   * Store user principal in localStorage
   */
  static storePrincipal(principal: string): void {
    try {
      const userData: StoredUserData = {
        principal,
        timestamp: Date.now(),
        isAuthenticated: true
      };
      
      localStorage.setItem(STORAGE_KEYS.USER_PRINCIPAL, principal);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'true');
      
      console.log('✅ Principal stored in localStorage:', principal);
    } catch (error) {
      console.error('❌ Failed to store principal in localStorage:', error);
    }
  }

  /**
   * Get stored principal from localStorage
   */
  static getPrincipal(): string | null {
    try {
      const principal = localStorage.getItem(STORAGE_KEYS.USER_PRINCIPAL);
      const userData = this.getUserData();
      
      // Check if session is still valid
      if (userData && this.isSessionValid(userData.timestamp)) {
        return principal;
      } else if (userData && !this.isSessionValid(userData.timestamp)) {
        // Session expired, clear storage
        console.log('🕒 Session expired, clearing localStorage');
        this.clearUserData();
        return null;
      }
      
      return principal;
    } catch (error) {
      console.error('❌ Failed to get principal from localStorage:', error);
      return null;
    }
  }

  /**
   * Get stored user data from localStorage
   */
  static getUserData(): StoredUserData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!data) return null;
      
      const userData: StoredUserData = JSON.parse(data);
      
      // Validate data structure
      if (!userData.principal || !userData.timestamp) {
        console.warn('⚠️ Invalid user data structure in localStorage');
        this.clearUserData();
        return null;
      }
      
      return userData;
    } catch (error) {
      console.error('❌ Failed to get user data from localStorage:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (stored in localStorage)
   */
  static isStoredAuthenticated(): boolean {
    try {
      const authState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      const userData = this.getUserData();
      
      return authState === 'true' && userData !== null && this.isSessionValid(userData.timestamp);
    } catch (error) {
      console.error('❌ Failed to check authentication state:', error);
      return false;
    }
  }

  /**
   * Clear all user data from localStorage
   */
  static clearUserData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PRINCIPAL);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      
      console.log('🧹 Cleared user data from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear user data from localStorage:', error);
    }
  }

  /**
   * Update authentication state
   */
  static updateAuthState(isAuthenticated: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, isAuthenticated.toString());
      
      if (!isAuthenticated) {
        this.clearUserData();
      }
    } catch (error) {
      console.error('❌ Failed to update authentication state:', error);
    }
  }

  /**
   * Check if session is still valid based on timestamp
   */
  private static isSessionValid(timestamp: number): boolean {
    const now = Date.now();
    const sessionAge = now - timestamp;
    return sessionAge < SESSION_DURATION;
  }

  /**
   * Get session info (for debugging/monitoring)
   */
  static getSessionInfo(): { 
    hasData: boolean; 
    isValid: boolean; 
    timeRemaining: number; 
    principal?: string;
  } {
    const userData = this.getUserData();
    
    if (!userData) {
      return {
        hasData: false,
        isValid: false,
        timeRemaining: 0
      };
    }

    const isValid = this.isSessionValid(userData.timestamp);
    const timeRemaining = isValid ? SESSION_DURATION - (Date.now() - userData.timestamp) : 0;

    return {
      hasData: true,
      isValid,
      timeRemaining,
      principal: userData.principal
    };
  }

  /**
   * Refresh session timestamp (extend session)
   */
  static refreshSession(): void {
    const userData = this.getUserData();
    if (userData) {
      this.storePrincipal(userData.principal);
    }
  }
}

// Export convenience functions
export const {
  storePrincipal,
  getPrincipal,
  getUserData,
  isStoredAuthenticated,
  clearUserData,
  updateAuthState,
  getSessionInfo,
  refreshSession
} = LocalStorageManager;
