import React from 'react';
import { FileText } from 'lucide-react';
import Footer from '../components/Footer';

const Terms = () => {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <FileText className="h-8 w-8 text-[#f5a623]" />
          <h1 className="text-4xl font-bold">Terms & Conditions</h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-800 rounded-lg p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-300">
                By accessing and using CashuMints.space, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p className="text-gray-300">
                Permission is granted to temporarily access the materials (information or software) on CashuMints.space for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              <div className="mt-4">
                <p className="text-gray-300">Under this license, you may not:</p>
                <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Contributions</h2>
              <p className="text-gray-300">
                Users may contribute reviews and recommendations for Cashu mints. By submitting content, you grant CashuMints.space a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and distribute your content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Disclaimer</h2>
              <p className="text-gray-300">
                The materials on CashuMints.space are provided on an 'as is' basis. CashuMints.space makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Limitations</h2>
              <p className="text-gray-300">
                In no event shall CashuMints.space or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Accuracy of Materials</h2>
              <p className="text-gray-300">
                The materials appearing on CashuMints.space could include technical, typographical, or photographic errors. CashuMints.space does not warrant that any of the materials on its website are accurate, complete, or current.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Links</h2>
              <p className="text-gray-300">
                CashuMints.space has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by CashuMints.space of the site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Modifications</h2>
              <p className="text-gray-300">
                CashuMints.space may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
              <p className="text-gray-300">
                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Terms;