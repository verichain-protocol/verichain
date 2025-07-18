/// VeriChain Authentication Service
/// Handles user authentication, tier management, and quota tracking

import { AuthToken, QuotaStatus, UserTier, USER_TIERS } from '../types/ai.types';

export class AuthService {
  private currentToken: AuthToken | null = null;
  private guestUsageCount: number = 0;
  private readonly GUEST_STORAGE_KEY = 'verichain_guest_usage';
  private readonly TOKEN_STORAGE_KEY = 'verichain_auth_token';

  constructor() {
    this.loadStoredData();
  }

  /**
   * Load stored authentication data and guest usage
   */
  private loadStoredData(): void {
    try {
      // Load guest usage count
      const storedGuestUsage = localStorage.getItem(this.GUEST_STORAGE_KEY);
      if (storedGuestUsage) {
        this.guestUsageCount = parseInt(storedGuestUsage, 10) || 0;
      }

      // Load authentication token
      const storedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (storedToken) {
        const tokenData = JSON.parse(storedToken);
        if (this.isTokenValid(tokenData)) {
          this.currentToken = tokenData;
        } else {
          this.clearToken();
        }
      }
    } catch (error) {
      console.warn('Failed to load stored auth data:', error);
      this.clearStoredData();
    }
  }

  /**
   * Check if token is still valid
   */
  private isTokenValid(token: AuthToken): boolean {
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    return expiresAt > now;
  }

  /**
   * Get current user tier
   */
  public getCurrentTier(): UserTier {
    if (this.currentToken && this.isTokenValid(this.currentToken)) {
      return this.currentToken.tier;
    }
    return USER_TIERS.guest;
  }

  /**
   * Get current quota status
   */
  public async getQuotaStatus(): Promise<QuotaStatus> {
    const tier = this.getCurrentTier();
    
    if (tier.type === 'guest') {
      return {
        remaining: Math.max(0, tier.monthly_quota - this.guestUsageCount),
        total: tier.monthly_quota,
        resets_at: null,
        tier: 'guest'
      };
    }

    // For registered/premium users, fetch from backend
    if (this.currentToken) {
      try {
        const response = await fetch('/api/user/quota', {
          headers: {
            'Authorization': `Bearer ${this.currentToken.token}`
          }
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch quota status:', error);
      }
    }

    // Fallback for authenticated users
    return {
      remaining: tier.monthly_quota,
      total: tier.monthly_quota,
      resets_at: this.getNextMonthReset(),
      tier: tier.type
    };
  }

  /**
   * Check if user can perform analysis
   */
  public async canPerformAnalysis(): Promise<{ allowed: boolean; reason?: string }> {
    const quotaStatus = await this.getQuotaStatus();
    
    if (quotaStatus.remaining <= 0) {
      const tier = this.getCurrentTier();
      
      if (tier.type === 'guest') {
        return {
          allowed: false,
          reason: 'Guest limit reached. Please register for 30 monthly analyses.'
        };
      } else {
        return {
          allowed: false,
          reason: `Monthly quota exceeded. Resets at ${quotaStatus.resets_at || 'next month'}.`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Record analysis usage
   */
  public recordAnalysisUsage(): void {
    const tier = this.getCurrentTier();
    
    if (tier.type === 'guest') {
      this.guestUsageCount++;
      localStorage.setItem(this.GUEST_STORAGE_KEY, this.guestUsageCount.toString());
    }
    
    // For registered/premium users, this would be handled by backend
  }

  /**
   * Login with credentials
   */
  public async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const authData = await response.json();
        this.setToken(authData);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error during login' };
    }
  }

  /**
   * Register new user
   */
  public async register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });

      if (response.ok) {
        const authData = await response.json();
        this.setToken(authData);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error during registration' };
    }
  }

  /**
   * Logout user
   */
  public logout(): void {
    this.clearToken();
  }

  /**
   * Get authentication token for API calls
   */
  public getAuthToken(): string | null {
    return this.currentToken?.token || null;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentToken !== null && this.isTokenValid(this.currentToken);
  }

  /**
   * Set authentication token
   */
  private setToken(authData: AuthToken): void {
    this.currentToken = authData;
    localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(authData));
  }

  /**
   * Clear authentication token
   */
  private clearToken(): void {
    this.currentToken = null;
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  /**
   * Clear all stored data
   */
  private clearStoredData(): void {
    localStorage.removeItem(this.GUEST_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    this.guestUsageCount = 0;
    this.currentToken = null;
  }

  /**
   * Get next month reset date
   */
  private getNextMonthReset(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  /**
   * Upgrade to premium
   */
  public async upgradeToPremium(): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const response = await fetch('/api/user/upgrade-premium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentToken!.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedAuthData = await response.json();
        this.setToken(updatedAuthData);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Upgrade failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error during upgrade' };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
