import React from 'react';
import { Shield } from 'lucide-react';
import Footer from '../components/Footer';

const CookiePolicy = () => {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <Shield className="h-8 w-8 text-[#f5a623]" />
          <h1 className="text-4xl font-bold">Cookie Policy</h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-800 rounded-lg p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
              <p className="text-gray-300">
                Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide a better user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
              <p className="text-gray-300">
                CashuMints.space uses cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
                <li>To store your preferences and settings</li>
                <li>To maintain your session information</li>
                <li>To improve the performance and reliability of our service</li>
                <li>To analyze how our website is used</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">Essential Cookies</h3>
                  <p className="text-gray-300">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security and network management.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Performance Cookies</h3>
                  <p className="text-gray-300">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
              <p className="text-gray-300">
                Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact your experience using our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-gray-300">
                If you have any questions about our Cookie Policy, please contact us at support@cashumints.space.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CookiePolicy;