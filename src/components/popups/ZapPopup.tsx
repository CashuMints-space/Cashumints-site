import React, { useState } from 'react';
import { Zap, Loader2, X, Copy } from 'lucide-react';
import { useNDK } from '@/hooks/useNDK';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/hooks/useSettings';
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
import { log } from '@/lib/debug';
import QRCode from 'qrcode';

interface ZapPopupProps {
  pubkey: string;
  eventId?: string;
  defaultAmount: number;
  onClose: () => void;
}

const ZapPopup: React.FC<ZapPopupProps> = ({ pubkey, eventId, defaultAmount, onClose }) => {
  const { ndk, publicKey } = useNDK();
  const { showNotification } = useNotification();
  const { settings } = useSettings();
  const [amount, setAmount] = useState(defaultAmount);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const presetAmounts = [21, 42, 69, 100, 210, 420, 1000];

  const generateQR = async (data: string) => {
    try {
      const qr = await QRCode.toDataURL(data, {
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCode(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCopyInvoice = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice)
        .then(() => showNotification('Invoice copied to clipboard', 'success'))
        .catch(() => showNotification('Failed to copy invoice', 'error'));
    }
  };

  const handleNWCPayment = async (lightningInvoice: string): Promise<boolean> => {
    if (!ndk || !settings.nwcUrl || !settings.nwcRelay || !settings.nwcPubkey) {
      return false;
    }

    try {
      // Create NWC payment request
      const nwcEvent = new NDKEvent(ndk, {
        kind: 23194,
        content: JSON.stringify({
          method: 'pay_invoice',
          params: {
            invoice: lightningInvoice
          }
        }),
        tags: [['p', settings.nwcPubkey]]
      });

      await nwcEvent.sign();
      
      // Publish to multiple relays for redundancy
      const relays = Array.from(ndk.pool?.relays.values() || []);
      const publishPromises = relays.map(relay => 
        relay.publish(nwcEvent)
          .then(() => log.nostr(`NWC request published to ${relay.url}`))
          .catch(err => console.warn(`Failed to publish to ${relay.url}:`, err))
      );

      // Wait for at least one successful publish
      await Promise.any(publishPromises);

      // Subscribe to response
      return new Promise((resolve, reject) => {
        const sub = ndk.subscribe(
          [{
            kinds: [23195],
            '#e': [nwcEvent.id],
            since: Math.floor(Date.now() / 1000)
          }],
          { 
            closeOnEose: false,
            // Add some redundancy
            relay: settings.nwcRelay
          }
        );

        const timeout = setTimeout(() => {
          sub.stop();
          reject(new Error('Payment request timed out'));
        }, 30000);

        sub.on('event', (event: NDKEvent) => {
          try {
            const response = JSON.parse(event.content);
            
            if (response.error) {
              sub.stop();
              clearTimeout(timeout);
              reject(new Error(response.error.message || 'Payment failed'));
              return;
            }

            if (response.result?.preimage) {
              sub.stop();
              clearTimeout(timeout);
              resolve(true);
              return;
            }
          } catch (error) {
            console.warn('Error parsing NWC response:', error);
          }
        });

        // Handle subscription errors
        sub.on('error', (error: any) => {
          console.warn('NWC subscription error:', error);
          reject(error);
        });
      });
    } catch (error) {
      throw error;
    }
  };

  const handleWebLNPayment = async (lightningInvoice: string): Promise<boolean> => {
    if (!window.webln) {
      return false;
    }

    try {
      await window.webln.enable();
      await window.webln.sendPayment(lightningInvoice);
      return true;
    } catch (error) {
      console.warn('WebLN payment failed:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ndk || !publicKey) {
      showNotification('Please login to zap', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setInvoice(null);
      setQrCode(null);

      // Get recipient user
      const recipient = new NDKUser({ pubkey });
      await recipient.fetchProfile();

      // Create zap request event
      const zapEvent = new NDKEvent(ndk);
      zapEvent.kind = 9734; // Zap request
      zapEvent.content = message;
      zapEvent.tags = [
        ['p', pubkey],
        ['amount', (amount * 1000).toString()], // Convert to millisats
        ['relays', 'wss://relay.damus.io'],
      ];

      if (eventId) {
        zapEvent.tags.push(['e', eventId]);
      }

      await zapEvent.sign();

      // Create LNURL invoice
      const encodedZapRequest = btoa(JSON.stringify(zapEvent));
      const lnurlEndpoint = `https://api.getalby.com/nostr/zap/${encodedZapRequest}`;
      
      // Fetch invoice
      const lnurlResponse = await fetch(lnurlEndpoint);
      if (!lnurlResponse.ok) {
        throw new Error('Failed to get invoice');
      }
      
      const { pr: lightningInvoice } = await lnurlResponse.json();
      if (!lightningInvoice) {
        throw new Error('No invoice received');
      }

      // Try NWC payment first
      try {
        if (settings.nwcUrl) {
          const success = await handleNWCPayment(lightningInvoice);
          if (success) {
            showNotification('Zap sent successfully!', 'success');
            onClose();
            return;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'NWC payment failed';
        log.error('NWC payment error:', message);
        // Continue to next payment method
      }

      // Try WebLN payment
      try {
        const success = await handleWebLNPayment(lightningInvoice);
        if (success) {
          showNotification('Zap sent successfully!', 'success');
          onClose();
          return;
        }
      } catch (error) {
        // Continue to manual payment
      }

      // Show invoice and QR code for manual payment
      setInvoice(lightningInvoice);
      await generateQR(lightningInvoice);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send zap';
      console.error('Error sending zap:', error);
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 isolate z-[99999]">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[100000] overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Zap</h3>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (sats)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623] border border-gray-600"
                  min="1"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      amount === preset
                        ? 'bg-[#f5a623] text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623] resize-none border border-gray-600"
                  rows={3}
                  placeholder="Add a message to your zap..."
                />
              </div>

              {invoice && qrCode ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg flex justify-center">
                    <img src={qrCode} alt="Lightning Invoice QR Code" className="w-48 h-48" />
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInvoice}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Invoice</span>
                    </button>
                    
                    <a
                      href={`lightning:${invoice}`}
                      className="flex-1 flex items-center justify-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Open Wallet</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || amount < 1}
                    className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-6 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Send {amount} sats</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZapPopup;