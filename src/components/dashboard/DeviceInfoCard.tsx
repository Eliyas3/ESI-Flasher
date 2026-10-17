import React from 'react';
import { Info, Cpu, HardDrive, Wifi, Radio, Usb } from 'lucide-react';
import { DeviceInfo } from '../../types/hardware';

interface DeviceInfoCardProps {
  deviceInfo: DeviceInfo | null;
  isConnected: boolean;
}

export const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({
  deviceInfo,
  isConnected,
}) => {
  const rows = [
    { label: 'Chip', value: isConnected ? (deviceInfo?.chip || '—') : 'Not connected', highlight: isConnected },
    { label: 'Adapter', value: isConnected ? (deviceInfo?.adapter || '—') : '—' },
    { label: 'USB ID', value: isConnected ? (deviceInfo?.usbId || '—') : '—', mono: true },
    { label: 'MAC / Sign', value: isConnected ? (deviceInfo?.mac || '—') : '—', mono: true },
    { label: 'Flash Size', value: isConnected ? (deviceInfo?.flashSize || '—') : '—' },
    { label: 'Flash Mode', value: isConnected ? (deviceInfo?.flashMode || '—') : '—' },
    { label: 'Frequency', value: isConnected ? (deviceInfo?.flashFreq || '—') : '—' },
    { label: 'Chip Rev', value: isConnected ? (deviceInfo?.chipRevision || '—') : '—' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-card p-5 space-y-3">
      
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Device Information</span>
        </h3>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
          isConnected
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'
        }`}>
          {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {rows.map((r, idx) => (
          <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {r.label}
            </span>
            <span className={`text-right truncate max-w-[190px] ${
              r.mono ? 'font-mono text-[11px]' : 'font-semibold'
            } ${
              r.highlight 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : isConnected 
                ? 'text-slate-800 dark:text-slate-200' 
                : 'text-slate-400 dark:text-slate-500'
            }`}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};
