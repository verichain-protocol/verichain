/// VeriChain Internet Identity Service
/// Handles authentication with Internet Identity integration

import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';

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
      
      if (await this.authClient.isAuthenticated()) {
        this.identity = this.authClient.getIdentity();
        this.notifyAuthStateChange();
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
        ? 'http://localhost:4943?canisterId=rrkah-fqaaa-aaaaa-aaaaq-cai' // Standard local Internet Identity canister ID
        : 'https://identity.ic0.app'; // Production Internet Identity

      return new Promise((resolve) => {
        this.authClient!.login({
          identityProvider,
          onSuccess: () => {
            this.identity = this.authClient!.getIdentity();
            this.notifyAuthStateChange();
            resolve({ success: true });
          },
          onError: (error?: string) => {
            console.error('Internet Identity login failed:', error);
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
    return this.identity?.getPrincipal().toString() || null;
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return {
      isAuthenticated: !!this.identity,
      identity: this.identity,
      principal: this.getPrincipal()
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
}

// Singleton instance
export const internetIdentityService = new InternetIdentityService();
