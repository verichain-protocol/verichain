import React, {createContext, useContext, useState, useEffect} from 'react'
import { AuthClient } from '@dfinity/auth-client'
import { Actor, HttpAgent } from '@dfinity/agent'
import { Identity } from '@dfinity/agent'
import { getInternetIdentityNetwork } from '../utils/canisterUtils'
import { mapOptionalToFormattedJSON } from '../utils/canisterUtils'
import { LocalStorageManager } from '../utils/localStorage'
import { idlFactory } from '../../../../declarations/logic_canister/logic_canister.did.js'

interface User {
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => Promise<void>;
  identity: Identity | null;
  logout: () => Promise<void>;
  isLoading: boolean;
  user: User | null;
  storedPrincipal: string | null;
  hasStoredAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [storedPrincipal, setStoredPrincipal] = useState<string | null>(null);
  const [hasStoredAuth, setHasStoredAuth] = useState<boolean>(false);
  const [logicActor, setLogicActor] = useState<any>(null);

  const principal = identity?.getPrincipal().toText() || storedPrincipal;
  console.log("Principal:", principal);

  // Create logic canister actor with proper configuration
  const createLogicActor = (identity?: Identity) => {
    try {
      const host = import.meta.env.DFX_NETWORK === 'local' 
        ? 'http://localhost:4943' 
        : 'https://ic0.app';

      console.log('🔧 Creating Logic Actor with host:', host);

      const agent = new HttpAgent({ 
        host,
        ...(identity ? { identity } : {})
      });

      // Fetch root key for local development
      if (import.meta.env.DFX_NETWORK === 'local') {
        agent.fetchRootKey().catch(console.warn);
      }

      const canisterId = import.meta.env.CANISTER_ID_LOGIC_CANISTER || 'br5f7-7uaaa-aaaaa-qaaca-cai';
      
      console.log('🎯 Creating actor for canister:', canisterId);
      
      // Create actor directly using Actor.createActor
      return Actor.createActor(idlFactory, {
        agent,
        canisterId,
      });
    } catch (error) {
      console.error('❌ Failed to create logic actor:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored authentication first
        const stored = LocalStorageManager.getPrincipal();
        const hasStored = LocalStorageManager.isStoredAuthenticated();
        
        setStoredPrincipal(stored);
        setHasStoredAuth(hasStored);
        
        if (hasStored && stored) {
          console.log('📱 Found stored authentication:', stored);
        }
        
        // Initialize AuthClient
        const client = await AuthClient.create({});
        setAuthClient(client);
        
        // Initialize logic actor (without identity first)
        const actor = createLogicActor();
        setLogicActor(actor);
        
        await updateIdentity(client);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const updateIdentity = async (client: AuthClient) => {
    try {
      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const newIdentity = client.getIdentity();
        setIdentity(newIdentity);
        
        // Store principal when authenticated
        const principalText = newIdentity.getPrincipal().toText();
        LocalStorageManager.storePrincipal(principalText);
        setStoredPrincipal(principalText);
        setHasStoredAuth(true);
        
        // Create logic actor with authenticated identity
        const actor = createLogicActor(newIdentity);
        setLogicActor(actor);
        
        if (actor) {
          try {
            const userResponse = await actor.login();

            if (userResponse && typeof userResponse === 'object' && 'ok' in userResponse) {
              setUser(mapOptionalToFormattedJSON((userResponse as any).ok));
            } else if (userResponse && typeof userResponse === 'object' && 'err' in userResponse) {
              console.log("Error:", (userResponse as any).err);
            }
          } catch (error) {
            console.error('Failed to login to logic canister:', error);
          }
        }
        
        setIsLoading(false);
      } else {
        // Check if we have stored auth but no active session
        const stored = LocalStorageManager.getPrincipal();
        const hasStored = LocalStorageManager.isStoredAuthenticated();
        
        if (hasStored && stored) {
          console.log('📱 No active session, but found stored data:', stored);
          setStoredPrincipal(stored);
          setHasStoredAuth(true);
        } else {
          // Clear any invalid stored data
          LocalStorageManager.clearUserData();
          setStoredPrincipal(null);
          setHasStoredAuth(false);
        }
        
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setIsLoading(false);
    }
  };  const login = async () => {
    if (!authClient) return;
    
    const identityProvider = getInternetIdentityNetwork();
    if (!identityProvider) {
      console.error("Identity provider not configured");
      return;
    }

    try {
      await new Promise<void>((resolve, reject) =>
        authClient.login({
          identityProvider,
          onSuccess: resolve,
          onError: reject,
        })
      );
      await updateIdentity(authClient);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIdentity(null);
    
    // Clear stored authentication data
    LocalStorageManager.clearUserData();
    setStoredPrincipal(null);
    setHasStoredAuth(false);
    
    console.log('🚪 Logout completed, cleared all auth data');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        identity,
        logout,
        isLoading,
        user,
        storedPrincipal,
        hasStoredAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider
