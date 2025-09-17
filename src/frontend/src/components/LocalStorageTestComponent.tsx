/// VeriChain LocalStorage Test Component
/// Component untuk testing dan debugging localStorage functionality

import React from 'react';
import { LocalStorageManager } from '../core/utils/localStorage';
import { debugLocalStorage } from '../core/utils/canisterUtils';
import { useAuth } from '../core/providers/auth-provider';

export const LocalStorageTestComponent: React.FC = () => {
  const { 
    isAuthenticated, 
    storedPrincipal, 
    hasStoredAuth, 
    identity,
    login,
    logout 
  } = useAuth();

  const handleDebugStorage = () => {
    debugLocalStorage();
    const sessionInfo = LocalStorageManager.getSessionInfo();
    console.log('📊 Session Info:', sessionInfo);
  };

  const handleClearStorage = () => {
    LocalStorageManager.clearUserData();
    console.log('🧹 Storage cleared manually');
    // Refresh page to see changes
    window.location.reload();
  };

  const handleRefreshSession = () => {
    LocalStorageManager.refreshSession();
    console.log('🔄 Session refreshed');
  };

  const currentPrincipal = identity?.getPrincipal().toString();
  const sessionInfo = LocalStorageManager.getSessionInfo();

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🔍 VeriChain Authentication & LocalStorage Test
      </h2>
      
      {/* Current State */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Current Authentication State</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Internet Identity Authenticated:</span>{' '}
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Has Stored Authentication:</span>{' '}
            <span className={hasStoredAuth ? 'text-green-600' : 'text-red-600'}>
              {hasStoredAuth ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Current Principal:</span>{' '}
            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
              {currentPrincipal || 'None'}
            </span>
          </div>
          <div>
            <span className="font-medium">Stored Principal:</span>{' '}
            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
              {storedPrincipal || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Session Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Session Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Has Stored Data:</span>{' '}
            <span className={sessionInfo.hasData ? 'text-green-600' : 'text-red-600'}>
              {sessionInfo.hasData ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Session Valid:</span>{' '}
            <span className={sessionInfo.isValid ? 'text-green-600' : 'text-red-600'}>
              {sessionInfo.isValid ? '✅ Valid' : '❌ Invalid/Expired'}
            </span>
          </div>
          {sessionInfo.timeRemaining > 0 && (
            <div>
              <span className="font-medium">Time Remaining:</span>{' '}
              <span className="text-blue-600">
                {Math.floor(sessionInfo.timeRemaining / (1000 * 60 * 60))} hours,{' '}
                {Math.floor((sessionInfo.timeRemaining % (1000 * 60 * 60)) / (1000 * 60))} minutes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDebugStorage}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔍 Debug Storage (Check Console)
          </button>
          
          <button
            onClick={handleRefreshSession}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            disabled={!storedPrincipal}
          >
            🔄 Refresh Session
          </button>
          
          <button
            onClick={handleClearStorage}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            🧹 Clear Storage
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <button
              onClick={login}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              🔐 Login with Internet Identity
            </button>
          ) : (
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
          <li>Click "Login with Internet Identity" to authenticate</li>
          <li>Check that both current and stored principals are populated</li>
          <li>Refresh the page - the stored principal should persist</li>
          <li>Use "Debug Storage" to see localStorage contents in console</li>
          <li>Test "Clear Storage" to see data removal</li>
          <li>Test session expiration (24 hours from login)</li>
        </ol>
      </div>

      {/* Console Output Instructions */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
        <p className="font-medium mb-1">Console Commands:</p>
        <p>• Open browser DevTools and type: <code className="bg-gray-200 px-1 rounded">debugVeriChainStorage()</code></p>
        <p>• This will show all localStorage data and session info</p>
      </div>
    </div>
  );
};

export default LocalStorageTestComponent;
