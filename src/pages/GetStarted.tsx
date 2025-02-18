import React from 'react';
import { Wallet, Zap, Shield } from 'lucide-react';
import Footer from '../components/Footer';

const GetStarted = () => {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">Get Started with Cashu</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Wallet className="h-12 w-12 text-[#f5a623]" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">1. Choose a Wallet</h2>
            <p className="text-gray-400 text-center">
              Download and install a Cashu-compatible wallet to start using ecash.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-12 w-12 text-[#f5a623]" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">2. Add a Mint</h2>
            <p className="text-gray-400 text-center">
              Select a trusted mint from our list and add it to your wallet.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-[#f5a623]" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">3. Start Using Cashu</h2>
            <p className="text-gray-400 text-center">
              Send and receive payments privately using Cashu tokens.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">What is Cashu?</h2>
          <p className="text-gray-400 mb-4">
            Cashu is a privacy-focused digital cash system that uses Chaumian ecash for Bitcoin. 
            It allows you to make private transactions without revealing your identity or transaction history.
          </p>
          <p className="text-gray-400 mb-4">
            Key features:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Complete privacy for your transactions</li>
            <li>No KYC requirements</li>
            <li>Lightning Network integration</li>
            <li>Instant transfers</li>
            <li>Low to no fees</li>
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GetStarted;