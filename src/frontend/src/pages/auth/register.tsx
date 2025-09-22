
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/providers/auth-provider';
import { logicService } from '../../services/logic.service';
import { internetIdentityService } from '../../services/internetIdentity.service';
import { LocalStorageManager } from '../../core/utils/localStorage';

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, identity, storedPrincipal, hasStoredAuth } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // Test canister connection
  const testCanisterConnection = async () => {
    try {
      console.log('🧪 Testing canister connection...');
      
      // Test authentication state
      const authState = internetIdentityService.getAuthState();
      console.log('🧪 Auth state:', authState);
      
      // Refresh identity first
      await internetIdentityService.refreshIdentity();
      
      // Test after refresh
      const authStateAfter = internetIdentityService.getAuthState();
      console.log('🧪 Auth state after refresh:', authStateAfter);
      
      // Test canister call
      const result = await logicService.getUser();
      console.log('🧪 Test result:', result);
      
      setDebugInfo(`Auth: ${authStateAfter.isAuthenticated ? '✅' : '❌'} | Canister: ${result.success ? 'Connected' : 'Failed - ' + result.error}`);
    } catch (error) {
      console.error('🧪 Test failed:', error);
      setDebugInfo(`Test failed: ${error}`);
    }
  };

  // Check if user came from smart login redirect
  useEffect(() => {
    const checkSmartLoginRedirect = () => {
      // Check if user was redirected here after authentication but no registration
      if (isAuthenticated && (identity || storedPrincipal)) {
        console.log('🔐 User authenticated but needs registration (redirected from smart login)');
        const currentPrincipal = identity?.getPrincipal().toText() || storedPrincipal;
        console.log('📋 Principal available for registration:', currentPrincipal);
      }
    };

    checkSmartLoginRedirect();
  }, [isAuthenticated, identity, storedPrincipal, hasStoredAuth]);

  // Check if user is already authenticated
  useEffect(() => {
    const checkExistingAuth = () => {
      console.log('🔍 Checking authentication status...');
      console.log('  - isAuthenticated:', isAuthenticated);
      console.log('  - identity:', identity?.getPrincipal().toText());
      console.log('  - storedPrincipal:', storedPrincipal);
      console.log('  - hasStoredAuth:', hasStoredAuth);
      
      // Check if user already has valid authentication
      if (isAuthenticated && (identity || storedPrincipal)) {
        console.log('🔐 User already authenticated, checking if registered...');
        const currentPrincipal = identity?.getPrincipal().toText() || storedPrincipal;
        console.log('📋 Current principal for VeriChain access:', currentPrincipal);
        
        // TODO: Add check if user is already registered in logic canister
        // If already registered, redirect to dashboard
        // If not registered, let them fill the form
      }
      
      // Check for stored authentication
      if (hasStoredAuth && storedPrincipal) {
        console.log('💾 Found stored authentication for principal:', storedPrincipal);
        console.log('✅ Principal ready for VeriChain feature access');
      }
      
      // Check localStorage directly
      const directCheck = LocalStorageManager.getPrincipal();
      if (directCheck) {
        console.log('📱 Direct localStorage check - principal:', directCheck);
      }
    };

    checkExistingAuth();
  }, [isAuthenticated, identity, storedPrincipal, hasStoredAuth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let currentPrincipal = null;
      
      console.log('🚀 Starting registration process...');
      console.log('📊 Current auth state:', {
        isAuthenticated,
        hasIdentity: !!identity,
        hasStoredAuth,
        storedPrincipal
      });
      
      // Check if already authenticated
      if (isAuthenticated && identity) {
        currentPrincipal = identity.getPrincipal().toText();
        console.log('✅ Already authenticated with principal:', currentPrincipal);
      } else if (hasStoredAuth && storedPrincipal) {
        currentPrincipal = storedPrincipal;
        console.log('📱 Using stored principal:', currentPrincipal);
      } else {
        // Need to authenticate with Internet Identity
        console.log('🔐 Starting Internet Identity authentication...');
        
        try {
          const loginResult = await internetIdentityService.login();
          console.log('🔍 Login result:', loginResult);
          
          if (!loginResult.success) {
            console.error('❌ Authentication failed:', loginResult.error);
            setError(loginResult.error || 'Authentication failed');
            setLoading(false);
            return;
          }
          
          // Wait a bit for the authentication to fully complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh identity to ensure it's properly set
          await internetIdentityService.refreshIdentity();
          
          // Try multiple ways to get the principal
          console.log('🔍 Getting principal from service...');
          let principalFromService = await internetIdentityService.getPrincipal();
          console.log('📋 Principal from service:', principalFromService);
          
          if (!principalFromService) {
            // Try getting from auth provider
            console.log('🔍 Trying to get principal from auth provider...');
            const authState = internetIdentityService.getAuthState();
            principalFromService = authState.principal;
            console.log('📋 Principal from auth state:', principalFromService);
          }
          
          if (!principalFromService) {
            // Last resort: try localStorage
            console.log('🔍 Trying to get principal from localStorage...');
            principalFromService = LocalStorageManager.getPrincipal();
            console.log('📋 Principal from localStorage:', principalFromService);
          }
          
          if (principalFromService) {
            currentPrincipal = principalFromService;
          } else {
            console.error('❌ Could not retrieve principal from any source');
            setError('Authentication succeeded but could not retrieve user principal. Please try again.');
            setLoading(false);
            return;
          }
          
          console.log('✅ Authentication successful with principal:', currentPrincipal);
        } catch (authError) {
          console.error('❌ Authentication error:', authError);
          setError('Authentication failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Ensure we have a principal
      if (!currentPrincipal) {
        console.error('❌ No principal available');
        setError('Failed to get user principal. Please try again.');
        setLoading(false);
        return;
      }

      // Store principal in localStorage for persistence
      console.log('💾 Storing principal in localStorage...');
      try {
        LocalStorageManager.storePrincipal(currentPrincipal);
        console.log('✅ Principal stored successfully');
      } catch (storageError) {
        console.error('❌ Storage error:', storageError);
        // Continue anyway, storage is not critical for registration
      }

      // Register user with the provided details
      console.log('📝 Registering user with logic canister...');
      console.log('📋 Registration data:', {
        fullName: formData.fullName,
        email: formData.email,
        principal: currentPrincipal
      });
      
      // Wait a bit more to ensure authentication is fully propagated
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify authentication state before registration
      const finalAuthCheck = internetIdentityService.getAuthState();
      console.log('🔍 Final auth check before registration:', finalAuthCheck);
      
      if (!finalAuthCheck.isAuthenticated || !finalAuthCheck.principal) {
        console.error('❌ Authentication not properly established');
        setError('Authentication not properly established. Please try again.');
        setLoading(false);
        return;
      }
      
      try {
        const registerResult = await logicService.register(formData.fullName, formData.email);
        console.log('📊 Registration result:', registerResult);
        
        if (registerResult.success) {
          console.log('✅ Registration successful!');
          setSuccess('Registration successful! Redirecting to dashboard...');
          
          // Verify principal is stored and accessible for VeriChain features
          const verifyStored = LocalStorageManager.getPrincipal();
          const verifyAuth = LocalStorageManager.isStoredAuthenticated();
          
          console.log('🔐 Final principal verification:');
          console.log('  - Stored principal:', verifyStored);
          console.log('  - Current principal:', currentPrincipal);
          console.log('  - Auth state:', verifyAuth);
          console.log('  - Match:', verifyStored === currentPrincipal);
          
          if (verifyStored === currentPrincipal && verifyAuth) {
            console.log('✅ Principal verification successful - VeriChain features ready');
            console.log('🚀 User can now access all VeriChain functionality');
            setTimeout(() => {
              navigate('/Dashboard');
            }, 2000);
          } else {
            console.warn('⚠️ Principal storage verification failed');
            // Try to store again
            LocalStorageManager.storePrincipal(currentPrincipal);
            const retryVerify = LocalStorageManager.getPrincipal();
            
            if (retryVerify === currentPrincipal) {
              console.log('✅ Principal re-stored successfully');
              setTimeout(() => {
                navigate('/Dashboard');
              }, 2000);
            } else {
              console.error('❌ Principal storage failed completely');
              setError('Registration completed but session storage failed. Please try logging in again.');
            }
          }
        } else {
          console.error('❌ Registration failed:', registerResult.error);
          setError(registerResult.error || 'Registration failed');
        }
      } catch (registerError) {
        console.error('❌ Registration request failed:', registerError);
        setError('Registration request failed. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Registration Form */}
        <div className="bg-gray-900 border-2 border-lime-400 rounded-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-lime-400 mb-2">VeriChain</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {isAuthenticated ? 'Complete Your Registration' : 'Create Account'}
          </h2>
          <p className="text-gray-400">
            {isAuthenticated 
              ? 'You\'re authenticated! Complete your profile to access VeriChain features'
              : 'Join VeriChain to access media verification features'
            }
          </p>
        </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-lime-400 text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-96 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-lime-400 text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-96 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-400 text-black py-3 px-4 rounded-lg font-semibold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>
                  {isAuthenticated ? 'Complete Registration' : 'Create Account & Login'}
                </span>
              )}
            </button>
          </form>

          {/* Info Text */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
            <p className="text-blue-200 text-sm text-center">
              {isAuthenticated 
                ? '✅ You are authenticated! Complete your profile to access all VeriChain features'
                : '🔐 This will authenticate you with Internet Identity and create your VeriChain account'
              }
            </p>
            <p className="text-blue-300 text-xs text-center mt-2">
              Your principal will be securely stored for accessing VeriChain features
            </p>
          </div>
          
          {/* Principal Info */}
          {(storedPrincipal || (identity && identity.getPrincipal().toText())) && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <p className="text-green-200 text-xs text-center">
                🔑 Principal: {storedPrincipal || identity?.getPrincipal().toText()}
              </p>
            </div>
          )}
        </div>

        {/* Debug Section - Remove in production */}
        <div className="mt-4 p-4 bg-gray-800 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-300 text-sm">Debug Info:</p>
            <button
              onClick={testCanisterConnection}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300"
            >
              Test Connection
            </button>
          </div>
          {debugInfo && (
            <p className="text-xs text-gray-400">{debugInfo}</p>
          )}
          <p className="text-xs text-gray-400">
            Network: {import.meta.env.DFX_NETWORK || 'local'} | 
            Canister: br5f7-7uaaa-aaaaa-qaaca-cai |
            Auth: {isAuthenticated ? '✅' : '❌'} |
            Principal: {storedPrincipal || identity?.getPrincipal().toText() || 'None'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-red-400 text-xl">❌</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 bg-green-900/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-green-400 text-xl">✅</span>
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/Dashboard')}
              className="text-lime-400 hover:text-lime-300 underline"
            >
              Go to Dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
