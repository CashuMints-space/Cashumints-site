import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNDK } from '../hooks/useNDK';
import { Key, AlertCircle, Smartphone } from 'lucide-react';
import Footer from '../components/Footer';

const Login = () => {
  const { login, publicKey, isMobile } = useNDK();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAmberInstructions, setShowAmberInstructions] = useState(false);

  useEffect(() => {
    if (publicKey) {
      // Get the return path from location state
      const state = location.state as { from?: { pathname: string }; mintId?: string };
      let returnPath = state?.from?.pathname || '/dashboard';

      // If we have a mintId, ensure we return to that mint's page
      if (state?.mintId && !returnPath.includes('/mint/')) {
        returnPath = `/mint/${state.mintId}`;
      }

      navigate(returnPath);
    }
  }, [publicKey, navigate, location]);

  const handleAmberLogin = () => {
    if (!window.amber) {
      setShowAmberInstructions(true);
      return;
    }

    const returnPath = location.state?.from?.pathname || '/dashboard';
    const callbackUrl = `${window.location.origin}/login-callback?return=${encodeURIComponent(returnPath)}`;
    
    // Redirect to Amber
    window.location.href = `nostrsigner:?compressionType=none&returnType=signature&type=get_public_key&appName=${import.meta.env.VITE_APP_NAME}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handleNsecBunkerLogin = () => {
    // Open in new window to handle the callback
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      'https://nsecbunker.com/login',
      'nsecbunker',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <Key className="h-12 w-12 text-[#f5a623]" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-6">Login to CashuMints</h1>
          
          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full bg-[#f5a623] text-black px-4 py-3 rounded-md hover:bg-[#d48c1c] transition-colors font-medium"
            >
              Connect with Extension
            </button>

            <button
              onClick={handleNsecBunkerLogin}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-md hover:bg-gray-600 transition-colors font-medium"
            >
              Login with Nsec Bunker
            </button>

            {isMobile && (
              <button
                onClick={handleAmberLogin}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-md hover:bg-gray-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Smartphone className="h-5 w-5" />
                <span>Login with Amber</span>
              </button>
            )}

            {showAmberInstructions && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-[#f5a623] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium mb-2">Amber is not installed</p>
                    <p>
                      To use Amber:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Install Amber from your app store</li>
                      <li>Open this page in Amber's built-in browser</li>
                      <li>Try logging in again</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-[#f5a623] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium mb-1">Why login with Nostr?</p>
                  <p>
                    Logging in with Nostr allows you to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Write reviews for Cashu mints</li>
                    <li>Manage your mint listings</li>
                    <li>Participate in the community</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;