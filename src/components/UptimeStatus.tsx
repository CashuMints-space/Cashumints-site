import React from 'react';
import { Activity, Clock, Wifi, Shield } from 'lucide-react';

interface UptimeStatusProps {
  uptime: {
    '24': number;
    '720': number;
  };
  status: number;
  avgPing?: number;
  certInfo?: {
    valid: boolean;
    certInfo: {
      subject: {
        CN?: string;
      };
      issuer: {
        O?: string;
        CN?: string;
      };
      valid_from: string;
      valid_to: string;
      daysRemaining: number;
    };
  };
}

const UptimeStatus: React.FC<UptimeStatusProps> = ({ uptime, status, avgPing, certInfo }) => {
  const getStatusColor = () => {
    if (status === 1) return 'text-green-500';
    if (status === 0) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (status === 1) return 'Online';
    if (status === 0) return 'Offline';
    if (status === 2) return 'Pending';
    if (status === 3) return 'Maintenance';
    return 'Unknown';
  };

  const formatUptime = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatPing = (ping?: number) => {
    if (typeof ping !== 'number' || isNaN(ping)) return 'N/A';
    return `${ping.toFixed(0)}ms`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className={`h-5 w-5 ${getStatusColor()}`} />
            <span className="font-medium">Status</span>
          </div>
          <span className={`${getStatusColor()} font-medium`}>{getStatusText()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-[#f5a623]" />
            <span className="font-medium">Uptime (24h)</span>
          </div>
          <span className="text-gray-300">{formatUptime(uptime['24'])}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-[#f5a623]" />
            <span className="font-medium">Uptime (30d)</span>
          </div>
          <span className="text-gray-300">{formatUptime(uptime['720'])}</span>
        </div>

        {avgPing !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-[#f5a623]" />
              <span className="font-medium">Avg. Response</span>
            </div>
            <span className="text-gray-300">{formatPing(avgPing)}</span>
          </div>
        )}
      </div>

      {certInfo && (
        <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className={certInfo.valid ? 'text-green-500' : 'text-red-500'} />
            <h3 className="text-lg font-medium">SSL Certificate</h3>
          </div>
          <div className="space-y-2 text-sm">
            {certInfo.certInfo.subject.CN && (
              <div className="flex justify-between text-gray-400">
                <span>Domain:</span>
                <span className="break-words text-right">{certInfo.certInfo.subject.CN}</span>
              </div>
            )}
            {certInfo.certInfo.issuer.O && (
              <div className="flex justify-between text-gray-400">
                <span>Issuer:</span>
                <span className="break-words text-right">{certInfo.certInfo.issuer.O}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Valid Until:</span>
              <span>{new Date(certInfo.certInfo.valid_to).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Days Remaining:</span>
              <span className={certInfo.certInfo.daysRemaining < 30 ? 'text-red-500' : 'text-green-500'}>
                {certInfo.certInfo.daysRemaining}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UptimeStatus;