import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useNDK } from '../hooks/useNDK';
import { Coins, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { publicKey, logout } = useNDK();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-[#1a1f2e] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Coins className="h-8 w-8 text-[#f5a623]" />
            <span className="ml-2 text-xl font-bold text-white">CashuMints.space</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/all-mints" className="text-gray-300 hover:text-white px-3 py-2">All mints</Link>
            <Link to="/get-started" className="text-gray-300 hover:text-white px-3 py-2">Get started</Link>
            <Link to="/wallets" className="text-gray-300 hover:text-white px-3 py-2">Wallets</Link>
            <Link to="/more-info" className="text-gray-300 hover:text-white px-3 py-2">More info</Link>
            
            {publicKey ? (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/dashboard"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2"
                >
                  <User className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#f5a623] text-black px-4 py-2 rounded-md hover:bg-[#d48c1c]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#f5a623] text-black px-4 py-2 rounded-md hover:bg-[#d48c1c]"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`fixed inset-y-0 right-0 w-64 bg-[#1a1f2e] shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-bold text-white">Menu</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col space-y-2">
              <Link 
                to="/all-mints" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800"
              >
                All mints
              </Link>
              <Link 
                to="/get-started" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800"
              >
                Get started
              </Link>
              <Link 
                to="/wallets" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800"
              >
                Wallets
              </Link>
              <Link 
                to="/more-info" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800"
              >
                More info
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-700">
              {publicKey ? (
                <div className="space-y-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800"
                  >
                    <User className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-[#f5a623] text-black px-4 py-2 rounded-md hover:bg-[#d48c1c]"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block w-full bg-[#f5a623] text-black px-4 py-2 rounded-md hover:bg-[#d48c1c] text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;