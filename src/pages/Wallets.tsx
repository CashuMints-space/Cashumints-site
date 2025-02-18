import React from 'react';
import { Smartphone, Globe, Shield } from 'lucide-react';
import Footer from '../components/Footer';

// Import all wallet data
import nutstash from '../data/wallets/nutstash.json';
import nutshell from '../data/wallets/nutshell.json';
import cashuMe from '../data/wallets/cashu-me.json';
import minibits from '../data/wallets/minibits.json';

// Icon mapping
const icons = {
  Smartphone,
  Globe,
  Shield
};

const Wallets = () => {
  const wallets = [nutstash, nutshell, cashuMe, minibits];

  const renderIcon = (icon: string) => {
    // Check if the icon is a URL
    if (icon.startsWith('http')) {
      return (
        <img 
          src={icon} 
          alt="Wallet icon" 
          className="h-12 w-12 rounded-full object-cover border-2 border-[#f5a623]"
        />
      );
    }
    
    // Otherwise use Lucide icon
    const Icon = icons[icon as keyof typeof icons];
    return <Icon className="h-8 w-8 text-[#f5a623]" />;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">Cashu Wallets</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {wallets.map((wallet) => (
            <div key={wallet.name} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                {renderIcon(wallet.icon)}
                <h2 className="text-xl font-semibold">{wallet.name}</h2>
              </div>
              <p className="text-gray-400 mb-4">{wallet.description}</p>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {wallet.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                  >
                    {platform}
                  </span>
                ))}
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Features:</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  {wallet.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              <a
                href={wallet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#f5a623] text-black px-4 py-2 rounded-md hover:bg-[#d48c1c] transition-colors"
              >
                Visit Website
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-800 rounded-lg p-8">
          <div className="flex items-center space-x-4 mb-6">
            <Shield className="h-8 w-8 text-[#f5a623]" />
            <h2 className="text-2xl font-semibold">Wallet Security</h2>
          </div>
          <p className="text-gray-400 mb-4">
            When choosing a Cashu wallet, consider these security aspects:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Open source code for transparency</li>
            <li>Regular security updates</li>
            <li>Backup and recovery options</li>
            <li>Community trust and reviews</li>
            <li>Token storage security</li>
            <li>Privacy features</li>
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Wallets;