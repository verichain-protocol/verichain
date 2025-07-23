/**
 * VeriChain User Authentication Component
 * Clean implementation with Internet Identity + Logic Canister integration
 */

import React, { useState, useEffect } from 'react';
import { User, Shield, LogIn, LogOut, Zap } from 'lucide-react';
import { logicService } from '../services/logic.service';
import { internetIdentityService } from '../services/internetIdentity.service';
import './UserAuth.scss';

interface UserAuthProps {
  className?: string;
}

interface UserState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  quotaStatus: any | null;
  principal: string | null;
  error: string | null;
}

export const UserAuth: React.FC<UserAuthProps> = ({ className = '' }) => {
  const [userState, setUserState] = useState<UserState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    quotaStatus: null,
    principal: null,
    error: null
  });

  // Load user data from logic canister
  const loadUserData = async () => {
    try {
      setUserState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Get authentication status
      const isAuthenticated = await internetIdentityService.isAuthenticated();
      
      if (isAuthenticated) {
        // Get principal
        const principal = await internetIdentityService.getPrincipal();
        
        // Get user data and quota from logic canister
        const userResult = await logicService.getUser();
        const quotaStatus = await logicService.getQuotaStatus();
        
        setUserState({
          isAuthenticated: true,
          isLoading: false,
          user: userResult.user || null,
          quotaStatus,
          principal: principal?.toString() || null,
          error: null
        });
      } else {
        // Not authenticated - show guest quota
        const quotaStatus = await logicService.getQuotaStatus();
        
        setUserState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          quotaStatus,
          principal: null,
          error: null
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setUserState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load user data'
      }));
    }
  };

  // Login with Internet Identity
  const handleLogin = async () => {
    try {
      setUserState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Login with Internet Identity
      await internetIdentityService.login();
      
      // Reload user data after login
      await loadUserData();
    } catch (error) {
      console.error('Login failed:', error);
      setUserState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      setUserState(prev => ({ ...prev, isLoading: true }));
      
      // Logout from Internet Identity
      await internetIdentityService.logout();
      
      // Reset state
      setUserState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        quotaStatus: null,
        principal: null,
        error: null
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setUserState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
    }
  };

  // Initialize on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Loading state
  if (userState.isLoading) {
    return (
      <div className={`user-auth loading ${className}`}>
        <div className="auth-spinner">
          <div className="spinner" />
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (userState.error) {
    return (
      <div className={`user-auth error ${className}`}>
        <div className="error-message">
          <span>Error: {userState.error}</span>
          <button onClick={loadUserData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`user-auth ${className}`}>
      {!userState.isAuthenticated ? (
        // Not authenticated - show login button and guest quota
        <div className="auth-section">
          {userState.quotaStatus && (
            <div className="guest-info">
              <div className="guest-details">
                <div className="guest-avatar">G</div>
                <div className="guest-data">
                  <div className="guest-name">Guest User</div>
                  <div className="guest-quota">
                    <span className="quota-used">{userState.quotaStatus.remaining}</span>
                    <span>/</span>
                    <span className="quota-total">{userState.quotaStatus.total}</span>
                    <span> analyses left</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={userState.isLoading}
          >
            <LogIn size={16} />
            <span>Login with Internet Identity</span>
          </button>
        </div>
      ) : (
        // Authenticated - show user info
        <div className="user-section">
          <div className="user-info">
            <div className="user-details">
              <div className="user-icon">
                <User size={16} />
              </div>
              <div className="user-data">
                <div className="user-name">
                  {userState.user?.fullName || 'Anonymous User'}
                </div>
                <div className="user-tier">
                  <Shield size={12} />
                  <span>{userState.user?.tier || 'Guest'}</span>
                </div>
              </div>
            </div>
            
            {userState.quotaStatus && (
              <div className="quota-info">
                <div className="quota-text">
                  <Zap size={12} />
                  <span>{userState.quotaStatus.remaining}/{userState.quotaStatus.total}</span>
                </div>
                <div className="quota-bar">
                  <div 
                    className="quota-fill"
                    style={{ 
                      width: `${(userState.quotaStatus.remaining / userState.quotaStatus.total) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
