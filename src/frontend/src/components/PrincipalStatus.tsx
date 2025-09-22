/// VeriChain Principal Status Component
/// Menampilkan status principal di UI

import React from 'react';
import { useAuth } from '../core/providers/auth-provider';
import { LocalStorageManager } from '../core/utils/localStorage';

export const PrincipalStatus: React.FC = () => {
  const { isAuthenticated, storedPrincipal, hasStoredAuth, identity } = useAuth();

  const currentPrincipal = identity?.getPrincipal().toString();
  const sessionInfo = LocalStorageManager.getSessionInfo();

  // Don't show anything if no authentication data
  if (!isAuthenticated && !hasStoredAuth) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Authentication Status</h3>
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🔐 Active Session
            </span>
          )}
          {hasStoredAuth && !isAuthenticated && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📱 Stored Session
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {currentPrincipal && (
          <div>
            <span className="text-xs text-gray-500">Current Principal:</span>
            <div className="text-xs font-mono bg-gray-50 p-2 rounded border break-all">
              {currentPrincipal}
            </div>
          </div>
        )}

        {storedPrincipal && storedPrincipal !== currentPrincipal && (
          <div>
            <span className="text-xs text-gray-500">Stored Principal:</span>
            <div className="text-xs font-mono bg-blue-50 p-2 rounded border break-all">
              {storedPrincipal}
            </div>
          </div>
        )}

        {sessionInfo.hasData && (
          <div className="text-xs text-gray-500">
            {sessionInfo.isValid ? (
              <span className="text-green-600">
                ✅ Session valid for {Math.floor(sessionInfo.timeRemaining / (1000 * 60 * 60))}h {Math.floor((sessionInfo.timeRemaining % (1000 * 60 * 60)) / (1000 * 60))}m
              </span>
            ) : (
              <span className="text-red-600">❌ Session expired</span>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={() => {
            console.log('🔍 Principal Status Debug:');
            console.log('Current Principal:', currentPrincipal);
            console.log('Stored Principal:', storedPrincipal);
            console.log('Session Info:', sessionInfo);
            console.log('localStorage data:', {
              principal: localStorage.getItem('verichain_user_principal'),
              userData: localStorage.getItem('verichain_user_data'),
              authState: localStorage.getItem('verichain_auth_state')
            });
          }}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          🔍 Debug in Console
        </button>
      </div>
    </div>
  );
};

export default PrincipalStatus;
