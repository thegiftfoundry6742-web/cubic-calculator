import React, { useState } from 'react';
import { X, BookmarkCheck, Trash2, Sparkles } from 'lucide-react';
import type { Preset, CalculatorState } from '../types/calculator';

interface PresetModalProps {
  isOpen: boolean;
  presets: Preset[];
  currentState: CalculatorState;
  onClose: () => void;
  onLoadPreset: (preset: Preset) => void;
  onSavePreset: (name: string, description: string, state: CalculatorState) => void;
  onDeletePreset: (id: string) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  presets,
  currentState,
  onClose,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSavePreset(name, description, currentState);
    setName('');
    setDescription('');
    setActiveTab('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base font-heading">3D Printing Presets</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('list')}
            type="button"
            className={`flex-1 py-3 text-center cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Presets ({presets.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            type="button"
            className={`flex-1 py-3 text-center cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Save Current Config
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      {preset.name}
                    </h4>
                    {preset.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {preset.description}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Spool: ₹{preset.filaments[0]?.costPerKg}/kg • Rate: ₹{preset.electricity.ratePerKwh}/unit
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onLoadPreset(preset);
                        onClose();
                      }}
                      type="button"
                      className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      Load
                    </button>
                    {!preset.id.startsWith('preset-') && (
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bambu Lab P1S High-Speed PETG"
                  className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Machine Specs (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 0.4mm nozzle, 160W, 25% markup preset"
                  className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl text-xs text-blue-900 border border-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
                This will capture current filament pricing, electricity rate, wear/labour rates & profit settings into your browser.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Save Preset Configuration
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
