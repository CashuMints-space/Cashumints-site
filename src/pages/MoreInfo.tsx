import React from 'react';
import { Book, Github, MessageCircle } from 'lucide-react';
import Footer from '../components/Footer';

const MoreInfo = () => {
  const resources = [
    {
      title: "Documentation",
      description: "Learn about Cashu protocol specifications, NUTs, and implementation details.",
      icon: Book,
      url: "https://docs.cashu.space"
    },
    {
      title: "GitHub",
      description: "Explore the open-source code and contribute to the project.",
      icon: Github,
      url: "https://github.com/cashubtc"
    },
    {
      title: "Community",
      description: "Join the Cashu community on Telegram to discuss and get help.",
      icon: MessageCircle,
      url: "https://t.me/cashubtc"
    }
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">Learn More About Cashu</h1>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-center mb-4">
                  <Icon className="h-12 w-12 text-[#f5a623]" />
                </div>
                <h2 className="text-xl font-semibold text-center mb-4">{resource.title}</h2>
                <p className="text-gray-400 text-center">{resource.description}</p>
              </a>
            );
          })}
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Technical Overview</h2>
          <div className="space-y-4 text-gray-400">
            <p>
              Cashu is built on David Chaum's ecash protocol, providing strong privacy guarantees through blind signatures. 
              The protocol is defined through NUTs (Numbering Upgrade Tracks) that specify different aspects of the system.
            </p>
            <p>
              Key technical features:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Blind signatures for transaction privacy</li>
              <li>Lightning Network integration for Bitcoin deposits/withdrawals</li>
              <li>Token-based transfers without on-chain transactions</li>
              <li>Decentralized mint architecture</li>
              <li>Open protocol specification</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MoreInfo;