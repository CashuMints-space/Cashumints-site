import React from 'react';
import { Settings, Activity, Shield, Loader2 } from 'lucide-react';
import type { CashuMint, MintInfo } from '../../types/mint';
import UptimeStatus from '../UptimeStatus';

interface MintSidebarProps {
  mint: CashuMint;
  mintInfo: MintInfo | null;
  uptimeData: any;
  loadingUptime: boolean;
  getNutLink: (nut: string) => string | null;
}

const MintSidebar: React.FC<MintSidebarProps> = ({
  mint,
  mintInfo,
  uptimeData,
  loadingUptime,
  getNutLink
}) => {
  return (
    <>
      <div className="bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-[#f5a623]" />
          <h2 className="text-xl font-semibold">Technical Details</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
            <h3 className="font-medium mb-2 text-[#f5a623]">Version</h3>
            <p className="text-gray-300 break-words">{mintInfo?.version || 'Not specified'}</p>
          </div>
          <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
            <h3 className="font-medium mb-2 text-[#f5a623]">Network</h3>
            <p className="text-gray-300 break-words">{mint.network}</p>
          </div>
          <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
            <h3 className="font-medium mb-3 text-[#f5a623]">Supported NUTs</h3>
            <div className="flex flex-wrap gap-2">
              {mint.nuts.map((nut, index) => {
                const nutLink = getNutLink(nut);
                return nutLink ? (
                  <a
                    key={index}
                    href={nutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-600/50 backdrop-blur rounded-full text-sm text-gray-300 hover:bg-gray-500/50 transition-colors"
                  >
                    {nut}
                  </a>
                ) : (
                  <span 
                    key={index}
                    className="px-3 py-1.5 bg-gray-600/50 backdrop-blur rounded-full text-sm text-gray-300"
                  >
                    {nut}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="h-6 w-6 text-[#f5a623]" />
          <h2 className="text-xl font-semibold">Status</h2>
        </div>
        {loadingUptime ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#f5a623]" />
          </div>
        ) : uptimeData ? (
          <UptimeStatus {...uptimeData} />
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Monitoring data not available</p>
          </div>
        )}
      </div>
    </>
  );
};

export default MintSidebar;