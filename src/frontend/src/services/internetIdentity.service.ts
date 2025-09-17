/// VeriChain Internet Identity Service
/// Handles authentication with Internet Identity integration

import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { LocalStorageManager } from '../core/utils/localStorage';

export interface AuthState {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: string | null;
}

export class InternetIdentityService {
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private authStateCallbacks: ((state: AuthState) => void)[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.authClient = await AuthClient.create();
      
      // Check if user is authenticated via Internet Identity
      const isAuthenticated = await this.authClient.isAuthenticated();
      
      if (isAuthenticated) {
        this.identity = this.authClient.getIdentity();
        const principal = this.identity?.getPrincipal().toString();
        
        if (principal) {
          // Store principal in localStorage for persistence
          LocalStorageManager.storePrincipal(principal);
          console.log('🔄 Restored authentication from Internet Identity');
        }
        
        this.notifyAuthStateChange();
      } else {
        // Check if we have stored authentication data
        const storedPrincipal = LocalStorageManager.getPrincipal();
        if (storedPrincipal && LocalStorageManager.isStoredAuthenticated()) {
          console.log('📱 Found stored authentication data, but Internet Identity session expired');
          // Clear stored data since Internet Identity session is not active
          LocalStorageManager.clearUserData();
        }
      }
    } catch (error) {
      console.error('Failed to initialize Internet Identity:', error);
    }
  }

  /**
   * Login with Internet Identity
   */
  async login(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authClient) {
        await this.init();
      }

      if (!this.authClient) {
        throw new Error('AuthClient not initialized');
      }

      const identityProvider = import.meta.env.DFX_NETWORK === 'local' 
        ? `http://localhost:4943?canisterId=${import.meta.env.CANISTER_ID_INTERNET_IDENTITY}` 
        : 'https://identity.ic0.app'; 

      console.log('🔐 Starting Internet Identity login...');
      console.log('Identity Provider:', identityProvider);
      console.log('Network:', import.meta.env.DFX_NETWORK);
      console.log('II Canister ID:', import.meta.env.CANISTER_ID_INTERNET_IDENTITY);

      return new Promise((resolve) => {
        this.authClient!.login({
          identityProvider,
          onSuccess: () => {
            this.identity = this.authClient!.getIdentity();
            const principal = this.identity?.getPrincipal().toString();
            
            if (principal) {
              // Store principal in localStorage
              LocalStorageManager.storePrincipal(principal);
              console.log('✅ Login successful, principal stored:', principal);
            }
            
            this.notifyAuthStateChange();
            resolve({ success: true });
          },
          onError: (error?: string) => {
            console.error('Internet Identity login failed:', error);
            // Clear any stored data on login failure
            LocalStorageManager.clearUserData();
            resolve({ success: false, error: error || 'Login failed' });
          },
          windowOpenerFeatures: 'toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100',
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  /**
   * Logout from Internet Identity
   */
  async logout(): Promise<void> {
    try {
      if (this.authClient) {
        await this.authClient.logout();
        this.identity = null;
        
        // Clear stored authentication data
        LocalStorageManager.clearUserData();
        console.log('🚪 Logout successful, cleared stored data');
        
        this.notifyAuthStateChange();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.authClient) {
      await this.init();
    }
    return this.authClient?.isAuthenticated() || false;
  }

  /**
   * Get current identity
   */
  getIdentity(): Identity | null {
    return this.identity;
  }

  /**
   * Get current principal as string
   */
  getPrincipal(): string | null {
    // First try to get from current identity
    const currentPrincipal = this.identity?.getPrincipal().toString() || null;
    
    if (currentPrincipal) {
      return currentPrincipal;
    }
    
    // Fallback to stored principal if identity is not available
    const storedPrincipal = LocalStorageManager.getPrincipal();
    
    if (storedPrincipal && LocalStorageManager.isStoredAuthenticated()) {
      console.log('📱 Using stored principal:', storedPrincipal);
      return storedPrincipal;
    }
    
    return null;
  }

  /**
   * Refresh identity from AuthClient
   */
  async refreshIdentity(): Promise<void> {
    try {
      if (!this.authClient) {
        await this.init();
      }
      
      if (this.authClient) {
        const isAuth = await this.authClient.isAuthenticated();
        if (isAuth) {
          this.identity = this.authClient.getIdentity();
          console.log('✅ Identity refreshed:', this.identity?.getPrincipal().toString());
          this.notifyAuthStateChange();
        } else {
          console.log('⚠️ AuthClient not authenticated');
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh identity:', error);
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    // Check multiple sources for authentication
    const hasIdentity = !!this.identity;
    const hasStoredAuth = LocalStorageManager.isStoredAuthenticated();
    const principal = this.getPrincipal();
    
    const isAuthenticated = hasIdentity || hasStoredAuth;
    
    console.log('🔍 Auth state check:', {
      hasIdentity,
      hasStoredAuth,
      principal,
      isAuthenticated
    });
    
    return {
      isAuthenticated,
      identity: this.identity,
      principal
    };
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateCallbacks.push(callback);
    
    // Call immediately with current state
    callback(this.getAuthState());
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }

  private notifyAuthStateChange(): void {
    const state = this.getAuthState();
    this.authStateCallbacks.forEach(callback => callback(state));
  }

  /**
   * Get authenticated agent for canister calls
   */
  getAuthenticatedAgent() {
    return this.identity;
  }

  /**
   * Get stored session information
   */
  getStoredSessionInfo() {
    return LocalStorageManager.getSessionInfo();
  }

  /**
   * Refresh stored session
   */
  refreshStoredSession(): void {
    const principal = this.identity?.getPrincipal().toString();
    if (principal) {
      LocalStorageManager.refreshSession();
      console.log('🔄 Session refreshed');
    }
  }

  /**
   * Check if there's any valid authentication (either Internet Identity or stored)
   */
  hasValidAuthentication(): boolean {
    return !!this.identity || LocalStorageManager.isStoredAuthenticated();
  }
}

// Singleton instance
export const internetIdentityService = new InternetIdentityService();
