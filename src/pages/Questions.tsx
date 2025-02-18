import React from 'react';
import { HelpCircle } from 'lucide-react';
import Footer from '../components/Footer';

const Questions = () => {
  const faqs = [
    {
      question: "What is Cashu?",
      answer: "Cashu is a privacy-focused digital cash system that uses Chaumian ecash for Bitcoin. It allows you to make private transactions without revealing your identity or transaction history."
    },
    {
      question: "How do Cashu mints work?",
      answer: "Cashu mints are servers that issue and redeem ecash tokens. They act as custodians of Bitcoin and issue Cashu tokens that can be transferred between users privately."
    },
    {
      question: "Is Cashu anonymous?",
      answer: "Yes, Cashu transactions are private by design. The mint cannot link withdrawals to deposits, and transactions between users are completely private."
    },
    {
      question: "Can I lose my tokens?",
      answer: "Yes, Cashu tokens are like physical cash. If you lose your wallet or backup, you lose your tokens. Always keep backups of your wallet data."
    },
    {
      question: "How do I choose a mint?",
      answer: "Choose mints based on their reputation, uptime, and community trust. Look for mints with positive recommendations and high ratings on CashuMints.space."
    }
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center space-x-4 mb-12">
          <HelpCircle className="h-10 w-10 text-[#f5a623]" />
          <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{faq.question}</h2>
              <p className="text-gray-400">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Have more questions? Join the{' '}
            <a 
              href="https://t.me/cashubtc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              Cashu Telegram group
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Questions;