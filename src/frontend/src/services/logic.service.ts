/// VeriChain Logic Service
/// Handles integration with the logic canister for authentication and user management

import { HttpAgent } from '@dfinity/agent';
import { createActor } from '../../../declarations/logic_canister';
import { Principal } from '@dfinity/principal';
import { internetIdentityService } from './internetIdentity.service';

(globalThis as any).global = globalThis;
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

export interface User {
  id: Principal;
  fullName: string;
  email: string;
  tier: string;
  created: bigint;
  lastLogin: bigint;
  monthlyQuota: bigint;
  usedQuota: bigint;
  isActive: boolean;
}

export interface QuotaStatus {
  remaining: number;
  total: number;
  resets_at: string | null;
  tier: string;
}

export class LogicService {
  private actor: any = null;
  private agent: HttpAgent | null = null;
  private canisterId: string;
  private currentPrincipal: Principal | null = null;

  constructor() {
    // Get canister ID with fallback
    this.canisterId = import.meta.env.CANISTER_ID_LOGIC_CANISTER || 'br5f7-7uaaa-aaaaa-qaaca-cai';
    console.log('🏗️ LogicService initialized with canister ID:', this.canisterId);
    
    this.initializeAgent();
    
    // Subscribe to Internet Identity auth state changes
    internetIdentityService.onAuthStateChange((authState) => {
      if (authState.isAuthenticated && authState.principal) {
        this.currentPrincipal = Principal.fromText(authState.principal);
        this.updateActorWithAuth();
      } else {
        this.currentPrincipal = null;
        this.updateActorWithAuth();
      }
    });
  }

  /**
   * Update actor with current authentication
   */
  private async updateActorWithAuth(): Promise<void> {
    await this.initializeAgent();
  }

  /**
   * Initialize HTTP agent and actor with proper identity
   */
  private async initializeAgent(): Promise<void> {
    try {
      const host = import.meta.env.DFX_NETWORK === 'local' 
        ? 'http://localhost:4943' 
        : 'https://ic0.app';

      console.log('🔧 Initializing LogicService agent...');
      console.log('Host:', host);
      console.log('Canister ID:', this.canisterId);
      console.log('Network:', import.meta.env.DFX_NETWORK);

      // Get current identity from Internet Identity service
      let identity = null;
      const authState = internetIdentityService.getAuthState();
      
      if (authState.isAuthenticated && authState.identity) {
        identity = authState.identity;
        console.log('✅ Using authenticated identity:', authState.principal);
      } else {
        console.log('⚠️ No authenticated identity found, using anonymous');
      }

      // Create agent with or without identity
      const agentConfig: any = { 
        host,
        verifyQuerySignatures: false // For local development
      };
      
      if (identity) {
        agentConfig.identity = identity;
      }

      this.agent = new HttpAgent(agentConfig);

      // Fetch root key for local development
      if (import.meta.env.DFX_NETWORK === 'local') {
        await this.agent.fetchRootKey();
        console.log('✅ Root key fetched for local development');
      }

      this.actor = createActor(this.canisterId, {
        agent: this.agent,
      });
      
      console.log('✅ LogicService agent initialized successfully with identity:', !!identity);

    } catch (error) {
      console.error('❌ Failed to initialize Logic agent:', error);
      throw error;
    }
  }

  /**
   * Ensure actor is initialized
   */
  private async ensureActor(): Promise<void> {
    if (!this.actor) {
      await this.initializeAgent();
    }
  }

  /**
   * Get current user principal from Internet Identity
   */
  private getCurrentPrincipal(): Principal | null {
    return this.currentPrincipal || (internetIdentityService.getPrincipal() 
      ? Principal.fromText(internetIdentityService.getPrincipal()!) 
      : null);
  }

  /**
   * Register a new user
   */
  async register(fullName: string, email: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔧 Starting logic service registration...');
    
    try {
      // Force re-initialize agent with current authentication
      await this.initializeAgent();
      
      if (!this.actor) {
        console.error('❌ Actor not initialized');
        return { success: false, error: 'Service not initialized' };
      }
      
      // Verify we have authentication
      const authState = internetIdentityService.getAuthState();
      if (!authState.isAuthenticated || !authState.principal) {
        console.error('❌ No authenticated user found');
        return { success: false, error: 'User must be authenticated to register' };
      }
      
      console.log('✅ Actor ready with authenticated user:', authState.principal);
      console.log('📋 Registration payload:', { fullName, email });
      
      const result = await this.actor.register({
        fullName,
        email
      });
      
      console.log('📊 Raw registration result:', result);
      console.log('📊 Result type:', typeof result);
      console.log('📊 Result keys:', Object.keys(result || {}));

      // Handle both uppercase and lowercase response formats
      if ('Ok' in result || 'ok' in result) {
        console.log('✅ Registration successful in logic canister');
        console.log('📋 Success response:', result.Ok || result.ok);
        return { success: true };
      } else if ('Err' in result || 'err' in result) {
        const errorMsg = result.Err || result.err;
        console.error('❌ Registration rejected by canister:', errorMsg);
        return { success: false, error: errorMsg };
      } else {
        console.error('❌ Unexpected response format:', result);
        console.error('📊 Full response object:', JSON.stringify(result, null, 2));
        return { success: false, error: 'Unexpected response format' };
      }
    } catch (error) {
      console.error('❌ Registration request failed:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          return { success: false, error: 'Network connection failed. Please check your internet connection.' };
        } else if (error.message.includes('agent')) {
          return { success: false, error: 'Canister connection failed. Please try again.' };
        } else if (error.message.includes('ANONYMOUS')) {
          return { success: false, error: 'Authentication required. Please ensure you are logged in.' };
        } else {
          return { success: false, error: `Registration failed: ${error.message}` };
        }
      }
      
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  /**
   * Login user
   */
  async login(): Promise<{ success: boolean; user?: User; error?: string }> {
    await this.ensureActor();
    
    try {
      const result = await this.actor.login();

      if ('Ok' in result || 'ok' in result) {
        const user = result.Ok || result.ok;
        return { success: true, user };
      } else if ('Err' in result || 'err' in result) {
        const errorMsg = result.Err || result.err;
        return { success: false, error: errorMsg };
      } else {
        return { success: false, error: 'Unexpected response format' };
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Get current user information
   */
  async getUser(): Promise<{ success: boolean; user?: any; error?: string }> {
    await this.ensureActor();
    
    try {
      const result = await this.actor.getUser();

      if ('Ok' in result || 'ok' in result) {
        const user = result.Ok || result.ok;
        return { success: true, user };
      } else if ('Err' in result || 'err' in result) {
        const errorMsg = result.Err || result.err;
        return { success: false, error: errorMsg };
      } else {
        return { success: false, error: 'Unexpected response format' };
      }
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      return { success: false, error: 'Failed to get user' };
    }
  }

  /**
   * Check if user is authenticated with Internet Identity
   */
  async isAuthenticated(): Promise<boolean> {
    return await internetIdentityService.isAuthenticated();
  }

  /**
   * Get user quota status
   */
  async getQuotaStatus(): Promise<QuotaStatus> {
    await this.ensureActor();
    
    // Check if user is authenticated
    const isAuth = await this.isAuthenticated();
    
    if (!isAuth) {
      // Return guest quota for unauthenticated users
      return {
        remaining: 5,
        total: 5,
        resets_at: null,
        tier: 'guest'
      };
    }
    
    try {
      const result = await this.actor.getQuotaStatus();

      if ('Ok' in result) {
        const quota = result.Ok;
        const tierString = quota.tier.authenticated ? 'authenticated' : 
                          quota.tier.premium ? 'premium' : 'guest';
        
        return {
          remaining: Number(quota.dailyLimit) - Number(quota.dailyUsage),
          total: Number(quota.dailyLimit),
          resets_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Reset in 24h
          tier: tierString
        };
      } else {
        // Return default guest quota if canister call fails
        return {
          remaining: 5,
          total: 5,
          resets_at: null,
          tier: 'guest'
        };
      }
    } catch (error) {
      console.error('❌ Failed to get quota status:', error);
      // Return default guest quota on error
      return {
        remaining: 5,
        total: 5,
        resets_at: null,
        tier: 'guest'
      };
    }
  }

  /**
   * Upgrade user tier
   */
  async upgradeTier(newTier: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureActor();
    
    try {
      const result = await this.actor.upgradeTier({ [newTier]: null });

      if ('Ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('❌ Tier upgrade failed:', error);
      return { success: false, error: 'Tier upgrade failed' };
    }
  }

  /**
   * Make API call with anonymous token (for guest users)
   */
  async apiCallWithToken(anonToken: string, operation: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureActor();
    
    try {
      const result = await this.actor.apiCallWithToken(anonToken, operation);

      if ('Ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
      return { success: false, error: 'API call failed' };
    }
  }

  /**
   * Quick setup for admin (development only)
   */
  async quickSetupAdmin(fullName: string, email: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureActor();
    
    try {
      const result = await this.actor.quickSetupAdmin(fullName, email);

      if ('Ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.Err };
      }
    } catch (error) {
      console.error('❌ Admin setup failed:', error);
      return { success: false, error: 'Admin setup failed' };
    }
  }

  /**
   * Test connection to logic canister
   */
  async ping(): Promise<string> {
    await this.ensureActor();
    
    try {
      return await this.actor.ping();
    } catch (error) {
      console.error('❌ Ping failed:', error);
      return 'Connection failed';
    }
  }

  /**
   * Get current user principal as text
   */
  async whoAmI(): Promise<string> {
    await this.ensureActor();
    
    try {
      return await this.actor.whoAmIText();
    } catch (error) {
      console.error('❌ WhoAmI failed:', error);
      return 'Unknown';
    }
  }
}

// Singleton instance
export const logicService = new LogicService();
