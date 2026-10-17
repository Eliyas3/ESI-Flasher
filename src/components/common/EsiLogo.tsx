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
      <div className={`relative ${sizeMap[size]} flex-shrink-0 group`}>
        <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md group-hover:bg-blue-500/35 transition-all duration-300 pointer-events-none" />
        <img
          src="/logo-enhanced.png"
          alt="Eliyas Science Info Logo"
          className="relative w-full h-full object-contain drop-shadow-md select-none transform transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback to SVG vector version if PNG has any issue
            (e.target as HTMLImageElement).src = '/logo.svg';
          }}
        />
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
            ESI Embedded Systems Suite
          </span>
        </div>
      )}
    </div>
  );
};
