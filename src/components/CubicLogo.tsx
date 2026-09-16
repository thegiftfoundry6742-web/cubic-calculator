import React from 'react';

interface CubicLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CubicLogo: React.FC<CubicLogoProps> = ({ className = '', size = 'md' }) => {
  const dimensions = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Cubic Extruder Logo Icon */}
      <div className={`${dimensions} rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/40 shadow-md shadow-emerald-500/20 shrink-0`}>
        <svg className={`${iconSize}`} viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="url(#cubic-green-grad)"
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
          />
          <defs>
            <linearGradient id="cubic-green-grad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22c55e" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className="font-extrabold text-slate-900 tracking-tight text-lg sm:text-xl font-heading leading-tight flex items-center gap-1.5">
          CUBIC <span className="text-[#16a34a] font-black">EXTRUDER</span>
        </span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest -mt-0.5">
          3D Printing Solutions
        </span>
      </div>
    </div>
  );
};
