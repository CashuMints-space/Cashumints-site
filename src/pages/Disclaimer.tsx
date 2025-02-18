import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Footer from '../components/Footer';

const Disclaimer = () => {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <AlertTriangle className="h-8 w-8 text-[#f5a623]" />
          <h1 className="text-4xl font-bold">Legal Disclaimer</h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-800 rounded-lg p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">General Information</h2>
              <p className="text-gray-300">
                Welcome to CashuMints.space. This platform serves as a Bitcoin and Cashu ecash mint index. All content provided is for informational purposes only and is shared in good faith. While we strive to keep the information up-to-date and correct, we make no representations or warranties, either express or implied, as to the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose. Any reliance you place on such information is therefore strictly at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Responsibility</h2>
              <p className="text-gray-300">
                The decision to engage with any mint indexed on CashuMints.space is entirely at your discretion and your own risk. CashuMints.space is not liable for any outcomes directly or indirectly related to the use of any content available through this site. The mints listed are not owned, controlled, or endorsed by CashuMints.space, thus we expressly disclaim any liability related to these entities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">External Links Disclaimer</h2>
              <p className="text-gray-300">
                This site may contain links to external websites that are not operated by us. These links are provided for your convenience to provide further information. They do not signify that we endorse the website(s). CashuMints.space has no control over the nature, content, and availability of those sites and assumes no responsibility for the content, privacy policies, or practices of any third-party sites or services. We strongly advise you to review the terms and conditions and privacy policies of any third-party sites or services that you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="text-gray-300">
                Under no circumstances shall CashuMints.space or its agents, directors, employees, or officers be liable for any direct, indirect, punitive, incidental, special, or consequential damages or any damages whatsoever including, without limitation, damages for loss of use, data, or profits, arising out of or in any way connected with the use or performance of CashuMints.space, with the delay or inability to use the website, or for any content, products, services made available or obtained through this site, or otherwise arising out of the utilization of the website, whether based on contract, tort, negligence, strict liability, or otherwise, even if CashuMints.space has been advised of the possibility of damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-gray-300">
                For any feedback, comments, requests for technical support, or other inquiries, please do not hesitate to contact us at support@cashumints.space.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Disclaimer;