import React from 'react';

interface EsiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const EsiLogo: React.FC<EsiLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* High clarity enhanced logo mark with sleek ambient glow */}
      {/* Background is PERMANENTLY deep black - never changes to white even if site theme is changed to white */}
      <div className={`relative ${sizeMap[size]} flex-shrink-0 group select-none`}>
        {/* Ambient backlight glow */}
        <div className="absolute -inset-0.5 bg-blue-600/30 rounded-xl blur-sm group-hover:bg-blue-500/60 transition-all duration-300 pointer-events-none" />
        
        {/* Solid Black Badge Container - strictly black in all themes */}
        <div className="relative w-full h-full bg-[#05070e] rounded-xl p-1 border border-slate-800/90 shadow-md flex items-center justify-center overflow-hidden ring-1 ring-white/10 group-hover:border-blue-500/50 transition-all">
          <img
            src="/logo-enhanced.png"
            alt="Eliyas Science Info Logo"
            className="w-full h-full object-contain drop-shadow-md select-none transform transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to SVG vector version if PNG has any issue
              (e.target as HTMLImageElement).src = '/logo.svg';
            }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
              Eliyas Science Info
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 shadow-sm">
              Flasher
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Professional Web Serial Embedded Flasher
          </span>
        </div>
      )}
    </div>
  );
};
