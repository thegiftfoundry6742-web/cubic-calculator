import React from 'react';
import { RefreshCw, BookmarkCheck, Sparkles, LayoutDashboard, Calculator } from 'lucide-react';
import { CubicLogo } from './CubicLogo';

interface HeaderProps {
  currentView: 'dashboard' | 'calculator';
  onViewChange: (view: 'dashboard' | 'calculator') => void;
  onReset: () => void;
  onOpenPresets: () => void;
  presetCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onReset,
  onOpenPresets,
  presetCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Cubic Extruder Brand Logo */}
        <div className="flex items-center gap-3">
          <CubicLogo size="md" />
          <span className="hidden md:inline-block h-6 w-px bg-slate-200 mx-1"></span>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200/80">
            <Sparkles className="w-3 h-3 text-[#22c55e]" /> Cost Calculator & Catalog
          </span>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {/* Main Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200 mr-1">
            <button
              onClick={() => onViewChange('dashboard')}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-slate-900 text-emerald-400 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Catalog Dashboard</span>
            </button>

            <button
              onClick={() => onViewChange('calculator')}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'calculator'
                  ? 'bg-slate-900 text-emerald-400 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Cost Calculator</span>
            </button>
          </div>

          <button
            onClick={onOpenPresets}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            title="Saved Presets"
          >
            <BookmarkCheck className="w-4 h-4 text-[#16a34a]" />
            <span className="hidden sm:inline">Presets</span>
            {presetCount > 0 && (
              <span className="ml-1 bg-[#16a34a] text-white text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                {presetCount}
              </span>
            )}
          </button>

          {currentView === 'calculator' && (
            <button
              onClick={onReset}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
              title="Reset to default sample values"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
