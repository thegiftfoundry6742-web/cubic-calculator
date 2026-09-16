import React from 'react';
import { Zap, Clock, Cpu } from 'lucide-react';
import type { ElectricityConfig } from '../types/calculator';
import { formatINR } from '../utils/formatters';

interface ElectricitySectionProps {
  config: ElectricityConfig;
  calculatedKwh: number;
  electricityCost: number;
  onUpdate: (updates: Partial<ElectricityConfig>) => void;
}

export const ElectricitySection: React.FC<ElectricitySectionProps> = ({
  config,
  calculatedKwh,
  electricityCost,
  onUpdate,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-5 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            B
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Electricity Cost
            </h2>
            <p className="text-xs text-slate-500">
              Calculate power consumption cost during 3D printing.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Electricity Cost</span>
          <span className="text-base font-bold text-amber-600">{formatINR(electricityCost)}</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => onUpdate({ mode: 'manual' })}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            config.mode === 'manual'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Enter kWh Manually</span>
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ mode: 'calculated' })}
          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            config.mode === 'calculated'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Calculate from Wattage + Print Time</span>
        </button>
      </div>

      {/* Input Fields depending on Mode */}
      {config.mode === 'manual' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Electricity Used (kWh) */}
          <div>
            <label htmlFor="manual-kwh" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Electricity Used (kWh / Units)
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <input
                id="manual-kwh"
                type="number"
                min="0"
                step="any"
                value={config.manualKwh === 0 ? '' : config.manualKwh}
                onChange={(e) => onUpdate({ manualKwh: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 0.8"
                className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
                kWh
              </span>
            </div>
          </div>

          {/* Electricity Cost per Unit */}
          <div>
            <label htmlFor="manual-rate" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Electricity Cost per Unit (₹/kWh)
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
                ₹
              </div>
              <input
                id="manual-rate"
                type="number"
                min="0"
                step="any"
                value={config.ratePerKwh === 0 ? '' : config.ratePerKwh}
                onChange={(e) => onUpdate({ ratePerKwh: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 15"
                className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Printer Wattage */}
            <div>
              <label htmlFor="printer-watts" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-400" />
                Printer Power (Watts)
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <input
                  id="printer-watts"
                  type="number"
                  min="0"
                  step="any"
                  value={config.printerWatts === 0 ? '' : config.printerWatts}
                  onChange={(e) => onUpdate({ printerWatts: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 120"
                  className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
                  W
                </span>
              </div>
            </div>

            {/* Print Hours & Minutes */}
            <div>
              <label htmlFor="print-hours" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Print Time (Hours & Mins)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="print-hours"
                    type="number"
                    min="0"
                    step="1"
                    value={config.printHours === 0 ? '' : config.printHours}
                    onChange={(e) => onUpdate({ printHours: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                    className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
                    h
                  </span>
                </div>
                <div className="relative flex-1">
                  <input
                    id="print-minutes"
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={config.printMinutes === 0 ? '' : config.printMinutes}
                    onChange={(e) => onUpdate({ printMinutes: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
                    m
                  </span>
                </div>
              </div>
            </div>

            {/* Electricity Rate per Unit */}
            <div>
              <label htmlFor="calc-rate" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Electricity Rate (₹/unit)
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
                  ₹
                </div>
                <input
                  id="calc-rate"
                  type="number"
                  min="0"
                  step="any"
                  value={config.ratePerKwh === 0 ? '' : config.ratePerKwh}
                  onChange={(e) => onUpdate({ ratePerKwh: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 15"
                  className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formula hint footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>
          kWh Used: <strong className="font-sans text-slate-800">{calculatedKwh.toFixed(3)} kWh</strong>
        </span>
        <span>
          {calculatedKwh.toFixed(2)} kWh × ₹{config.ratePerKwh} = <strong className="font-sans text-slate-800">{formatINR(electricityCost)}</strong>
        </span>
      </div>
    </div>
  );
};
