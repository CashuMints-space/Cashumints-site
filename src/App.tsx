import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import AllMints from './pages/AllMints';
import MintDetails from './pages/MintDetails';
import GetStarted from './pages/GetStarted';
import Wallets from './pages/Wallets';
import MoreInfo from './pages/MoreInfo';
import Login from './pages/Login';
import LoginCallback from './pages/LoginCallback';
import Dashboard from './pages/Dashboard';
import CookiePolicy from './pages/CookiePolicy';
import Disclaimer from './pages/Disclaimer';
import Terms from './pages/Terms';
import { NDKProvider } from './hooks/useNDK';
import { MintsProvider } from './context/MintsContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import ReviewCallback from './pages/ReviewCallback';
import ZapCallback from './pages/ZapCallback';
import { PopupProvider } from '@/context/PopupContext';

function App() {
  return (
    <NDKProvider>
      <MintsProvider>
        <NotificationProvider>
          <PopupProvider>
            <Router>
              <ScrollToTop />
              <div className="min-h-screen bg-[#1a1f2e] text-white">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/all-mints" element={<AllMints />} />
                  <Route path="/mint/:mintId" element={<MintDetails />} />
                  <Route path="/get-started" element={<GetStarted />} />
                  <Route path="/wallets" element={<Wallets />} />
                  <Route path="/more-info" element={<MoreInfo />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/login-callback" element={<LoginCallback />} />
                  <Route path="/review-callback" element={<ReviewCallback />} />
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/cookie-policy" element={<CookiePolicy />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/zap-callback" element={<ZapCallback />} />
                </Routes>
              </div>
              <Toaster />
            </Router>
          </PopupProvider>
        </NotificationProvider>
      </MintsProvider>
    </NDKProvider>
  );
}

export default App;