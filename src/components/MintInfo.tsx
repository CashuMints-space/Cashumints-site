import React from 'react';
import { Mail, Twitter, Globe, ExternalLink, Info } from 'lucide-react';
import { MintInfo as MintInfoType } from '../types/mint';
import { useWindowSize } from '../hooks/useWindowSize';

interface MintInfoProps {
  mintInfo: MintInfoType;
  renderContactLink: (method: string, info: string) => React.ReactNode;
}

const MintInfo: React.FC<MintInfoProps> = ({ mintInfo, renderContactLink }) => {
  const { width } = useWindowSize();

  const formatNpub = (npub: string) => {
    if (!npub) return '';
    
    let visibleChars = 8;
    if (width >= 640) visibleChars = 12;
    if (width >= 768) visibleChars = 16;
    if (width >= 1024) visibleChars = 20;

    if (npub.length <= visibleChars * 2) return npub;
    
    return `${npub.slice(0, visibleChars)}...${npub.slice(-visibleChars)}`;
  };

  const formatContactInfo = (method: string, info: string) => {
    if (!info) return '';
    
    if (method === 'npub' || (typeof info === 'string' && info.startsWith('npub1'))) {
      return formatNpub(info);
    }
    
    if (width < 640 && info.length > 20) {
      return `${info.slice(0, 17)}...`;
    }
    
    return info;
  };

  if (!mintInfo) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {mintInfo.description_long && (
        <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="h-6 w-6 text-[#f5a623]" />
            <h2 className="text-2xl font-semibold">About</h2>
          </div>
          <p className="text-gray-300 leading-relaxed break-words">{mintInfo.description_long}</p>
        </div>
      )}

      {mintInfo.contact && mintInfo.contact.length > 0 && (
        <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4 sm:p-6">
          <h2 className="text-2xl font-semibold mb-4 sm:mb-6">Contact</h2>
          <div className="grid gap-3">
            {mintInfo.contact.map((contact, index) => {
              if (!contact || !contact.method || !contact.info) {
                return null;
              }

              const getIcon = () => {
                switch (contact.method) {
                  case 'email':
                    return <Mail className="h-5 w-5 text-[#f5a623]" />;
                  case 'twitter':
                    return <Twitter className="h-5 w-5 text-[#f5a623]" />;
                  case 'website':
                    return <Globe className="h-5 w-5 text-[#f5a623]" />;
                  default:
                    return null;
                }
              };

              const getLabel = () => {
                switch (contact.method) {
                  case 'email':
                    return 'Email';
                  case 'twitter':
                    return 'Twitter';
                  case 'website':
                    return 'Website';
                  default:
                    return contact.method.charAt(0).toUpperCase() + contact.method.slice(1);
                }
              };

              return (
                <div 
                  key={index} 
                  className="bg-gray-600/50 backdrop-blur rounded-xl p-4 hover:bg-gray-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="flex-shrink-0">
                        {getIcon()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#f5a623] mb-1">
                          {getLabel()}
                        </div>
                        <div className="truncate">
                          {renderContactLink(contact.method, formatContactInfo(contact.method, contact.info))}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mintInfo.urls && mintInfo.urls.length > 0 && (
        <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4 sm:p-6">
          <h2 className="text-2xl font-semibold mb-4 sm:mb-6">Alternative URLs</h2>
          <div className="space-y-3">
            {mintInfo.urls.map((url, index) => {
              if (!url) return null;
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 bg-gray-600/50 backdrop-blur rounded-xl hover:bg-gray-500/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Globe className="h-5 w-5 text-[#f5a623] flex-shrink-0" />
                    <span className="text-gray-300 break-all min-w-0 line-clamp-1">{url}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MintInfo;