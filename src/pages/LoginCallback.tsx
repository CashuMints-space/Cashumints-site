import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNDK } from '../hooks/useNDK';
import { useNotification } from '../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import { log, logError } from '../lib/debug';

const LoginCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const pubkey = params.get('pubkey');
      const returnPath = params.get('return') || '/';

      if (!pubkey) {
        showNotification('Login failed: No public key received', 'error');
        navigate('/login');
        return;
      }

      try {
        // Store the public key
        localStorage.setItem('ndk:pubkey', pubkey);
        log.nostr('Login successful with Amber');
        
        showNotification('Login successful!', 'success');
        navigate(returnPath);
      } catch (error) {
        logError(error, 'Processing login callback');
        showNotification('Login failed', 'error');
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate, showNotification]);

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#f5a623] mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Logging in...</h1>
        <p className="text-gray-400">Please wait while we complete your login.</p>
      </div>
    </div>
  );
};

export default LoginCallback;