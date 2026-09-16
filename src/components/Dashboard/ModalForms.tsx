import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Layers, Pencil } from 'lucide-react';
import type { Category, Subcategory } from '../../types/calculator';

interface CategoryModalProps {
  isOpen: boolean;
  initialData?: Category | null;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

export const CreateCategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, description);
    setName('');
    setDescription('');
    onClose();
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold font-heading text-base">
            {isEditing ? (
              <Pencil className="w-5 h-5 text-emerald-400" />
            ) : (
              <FolderPlus className="w-5 h-5 text-blue-400" />
            )}
            <span>{isEditing ? 'Edit Category' : 'Create Product Category'}</span>
          </div>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Planters & Pots, Desk Accessories, Custom Enclosures..."
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Specialized 3D printed desktop items and plant pots"
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-[#22c55e] hover:bg-[#16a34a] hover:text-white rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isEditing ? 'Save Category Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SubcategoryModalProps {
  isOpen: boolean;
  categoryName: string;
  initialData?: Subcategory | null;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

export const CreateSubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  categoryName,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, description);
    setName('');
    setDescription('');
    onClose();
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold font-heading text-base">
            {isEditing ? (
              <Pencil className="w-5 h-5 text-indigo-400" />
            ) : (
              <Layers className="w-5 h-5 text-indigo-400" />
            )}
            <span>{isEditing ? `Edit Subcategory` : `Add Subcategory to ${categoryName}`}</span>
          </div>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subcategory Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Indoor Planters, Cable Clips, Phone Stands..."
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subcategory Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Specific subgroup for succulents and drip trays"
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isEditing ? 'Save Subcategory Changes' : 'Add Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
