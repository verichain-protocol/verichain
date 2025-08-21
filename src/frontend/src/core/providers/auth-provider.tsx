import React, {createContext, useContext, useState, useEffect} from 'react'
import { AuthClient } from '@dfinity/auth-client'
import { Actor } from '@dfinity/agent'
import { Identity } from '@dfinity/agent'
import { getInternetIdentityNetwork } from '../utils/canisterUtils'
import { mapOptionalToFormattedJSON } from '../utils/canisterUtils'
import { logic_canister } from '../../../../declarations/logic_canister'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const principal = identity?.getPrincipal().toText();
  console.log("Principal:", principal);

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create({
      });
      setAuthClient(client);
      await updateIdentity(client);
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
        
        // Update the agent identity for the logic_canister
        const agent = Actor.agentOf(logic_canister);
        if (agent?.replaceIdentity) {
          agent.replaceIdentity(newIdentity);
        }
        
        const userResponse = await logic_canister.login();

        setIsLoading(false);

        if ("ok" in userResponse) {
          setUser(mapOptionalToFormattedJSON(userResponse.ok));
        } else if ("err" in userResponse) {
          console.log("Error:", userResponse.err);
        }
      } else {
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
