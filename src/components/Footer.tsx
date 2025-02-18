import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Coins, 
  Github, 
  Twitter, 
  MessageCircle,
  Heart,
  Shield,
  FileText,
  AlertTriangle
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center mb-4">
              <Coins className="h-8 w-8 text-[#f5a623] mr-2" />
              <span className="text-xl font-bold">CashuMints.space</span>
            </div>
            <p className="text-gray-400 text-sm">
              Discover and review Cashu mints. Your gateway to trusted ecash services in the Bitcoin ecosystem.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/all-mints" className="text-gray-400 hover:text-white transition-colors">
                  All Mints
                </Link>
              </li>
              <li>
                <Link to="/get-started" className="text-gray-400 hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/wallets" className="text-gray-400 hover:text-white transition-colors">
                  Wallets
                </Link>
              </li>
              <li>
                <Link to="/more-info" className="text-gray-400 hover:text-white transition-colors">
                  More Info
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/cashubtc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/CashuBTC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://t.me/cashubtc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Telegram
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/terms" 
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link 
                  to="/disclaimer" 
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookie-policy" 
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} CashuMints.space. All rights reserved.
            </p>
            <div className="flex items-center text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>for the Bitcoin community</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;