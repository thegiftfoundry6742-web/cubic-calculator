import { useState, useEffect, useCallback } from 'react';
import type { Category, Subcategory, CatalogProduct, GlobalSettings } from '../types/calculator';
import { getSupabaseClient } from '../lib/supabase';
import { calculate3DPrintCost } from '../engine/calculationEngine';

const API_BASE = 'http://localhost:3001/api';
const STORAGE_CATALOG_KEY = 'cubic_catalog_db_real_v2';
const STORAGE_SETTINGS_KEY = 'cubic_catalog_global_settings_v1';

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultFilamentCostPerKg: 1399,
  defaultElectricityRatePerKwh: 15,
};

export function useCatalog() {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.defaultFilamentCostPerKg === 'number' &&
          typeof parsed.defaultElectricityRatePerKwh === 'number'
        ) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_GLOBAL_SETTINGS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_CATALOG_KEY}_categories`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [subcategories, setSubcategories] = useState<Subcategory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_CATALOG_KEY}_subcategories`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [products, setProducts] = useState<CatalogProduct[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_CATALOG_KEY}_products`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_CATALOG_KEY}_categories`, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_CATALOG_KEY}_subcategories`, JSON.stringify(subcategories));
    } catch {}
  }, [subcategories]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_CATALOG_KEY}_products`, JSON.stringify(products));
    } catch {}
  }, [products]);

  // Fetch catalog data from Supabase backend
  const fetchCatalogFromSupabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Try Supabase Client
      const supabase = getSupabaseClient();
      if (supabase) {
        const [catRes, subRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').order('created_at', { ascending: true }),
          supabase.from('subcategories').select('*').order('created_at', { ascending: true }),
          supabase.from('products').select('*').order('created_at', { ascending: false }),
        ]);

        if (!catRes.error && !subRes.error && !prodRes.error) {
          setCategories(
            (catRes.data || []).map((c) => ({
              id: c.id,
              name: c.name,
              description: c.description || '',
              createdAt: new Date(c.created_at).getTime(),
            }))
          );

          setSubcategories(
            (subRes.data || []).map((s) => ({
              id: s.id,
              categoryId: s.category_id,
              name: s.name,
              description: s.description || '',
              createdAt: new Date(s.created_at).getTime(),
            }))
          );

          setProducts(
            (prodRes.data || []).map((p) => ({
              id: p.id,
              categoryId: p.category_id,
              subcategoryId: p.subcategory_id,
              name: p.name,
              dimensions: p.dimensions,
              calculatorState: p.calculator_state,
              calculationResult: p.calculation_result,
              createdAt: new Date(p.created_at).getTime(),
              updatedAt: new Date(p.updated_at).getTime(),
            }))
          );

          setIsSupabaseConnected(true);
          setIsSyncing(false);
          return;
        }
      }

      // 2. Fallback to API sync server (direct DB connection)
      const res = await fetch(`${API_BASE}/catalog`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setSubcategories(data.subcategories || []);
        setProducts(data.products || []);
        setIsSupabaseConnected(true);
      }
    } catch (err) {
      console.warn('Supabase sync notice:', err);
      setIsSupabaseConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Subscribe to Realtime events
  useEffect(() => {
    fetchCatalogFromSupabase();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('public-catalog-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCatalogFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
        fetchCatalogFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchCatalogFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCatalogFromSupabase]);

  // CATEGORY OPERATIONS
  const addCategory = useCallback(
    async (name: string, description: string) => {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        createdAt: Date.now(),
      };

      setCategories((prev) => [...prev, newCat]);

      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('categories').insert({
            id: newCat.id,
            name: newCat.name,
            description: newCat.description,
          });
        }
        await fetch(`${API_BASE}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCat),
        });
      } catch (err) {
        console.error('Failed to sync new category to Supabase:', err);
      }

      return newCat;
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, name: string, description: string) => {
      const updatedName = name.trim();
      const updatedDesc = description.trim();

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: updatedName, description: updatedDesc } : c))
      );

      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase
            .from('categories')
            .update({ name: updatedName, description: updatedDesc })
            .eq('id', id);
        }
        await fetch(`${API_BASE}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name: updatedName, description: updatedDesc }),
        });
      } catch (err) {
        console.error('Failed to update category in Supabase:', err);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setSubcategories((prev) => prev.filter((s) => s.categoryId !== id));
    setProducts((prev) => prev.filter((p) => p.categoryId !== id));

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('categories').delete().eq('id', id);
      }
      await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete category in Supabase:', err);
    }
  }, []);

  // SUBCATEGORY OPERATIONS
  const addSubcategory = useCallback(
    async (categoryId: string, name: string, description: string) => {
      const newSub: Subcategory = {
        id: `sub-${Date.now()}`,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        createdAt: Date.now(),
      };

      setSubcategories((prev) => [...prev, newSub]);

      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('subcategories').insert({
            id: newSub.id,
            category_id: newSub.categoryId,
            name: newSub.name,
            description: newSub.description,
          });
        }
        await fetch(`${API_BASE}/subcategories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSub),
        });
      } catch (err) {
        console.error('Failed to sync new subcategory to Supabase:', err);
      }

      return newSub;
    },
    []
  );

  const updateSubcategory = useCallback(
    async (id: string, name: string, description: string) => {
      const updatedName = name.trim();
      const updatedDesc = description.trim();

      setSubcategories((prev) => {
        return prev.map((s) =>
          s.id === id ? { ...s, name: updatedName, description: updatedDesc } : s
        );
      });

      try {
        const target = subcategories.find((s) => s.id === id);
        const categoryId = target?.categoryId || '';
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase
            .from('subcategories')
            .update({ name: updatedName, description: updatedDesc })
            .eq('id', id);
        }
        await fetch(`${API_BASE}/subcategories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, categoryId, name: updatedName, description: updatedDesc }),
        });
      } catch (err) {
        console.error('Failed to update subcategory in Supabase:', err);
      }
    },
    [subcategories]
  );

  const deleteSubcategory = useCallback(async (id: string) => {
    setSubcategories((prev) => prev.filter((s) => s.id !== id));
    setProducts((prev) => prev.filter((p) => p.subcategoryId !== id));

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('subcategories').delete().eq('id', id);
      }
      await fetch(`${API_BASE}/subcategories/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete subcategory in Supabase:', err);
    }
  }, []);

  // PRODUCT OPERATIONS
  const saveCatalogProduct = useCallback(
    async (
      productData: Omit<CatalogProduct, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ) => {
      const now = Date.now();
      let savedProd: CatalogProduct;

      if (productData.id) {
        savedProd = {
          ...productData,
          id: productData.id,
          updatedAt: now,
        } as CatalogProduct;
      } else {
        savedProd = {
          ...productData,
          id: `prod-${now}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: now,
          updatedAt: now,
        } as CatalogProduct;
      }

      setProducts((prev) => {
        const existingIndex = prev.findIndex((p) => p.id === savedProd.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedProd;
          return updated;
        }
        return [savedProd, ...prev];
      });

      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('products').upsert({
            id: savedProd.id,
            category_id: savedProd.categoryId,
            subcategory_id: savedProd.subcategoryId,
            name: savedProd.name,
            dimensions: savedProd.dimensions,
            calculator_state: savedProd.calculatorState,
            calculation_result: savedProd.calculationResult,
          });
        }
        await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedProd),
        });
      } catch (err) {
        console.error('Failed to sync product to Supabase:', err);
      }

      return savedProd;
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('products').delete().eq('id', id);
      }
      await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete product in Supabase:', err);
    }
  }, []);

  const updateGlobalSettings = useCallback(
    async (newSettings: GlobalSettings, applyToExistingProducts: boolean = false) => {
      setGlobalSettings(newSettings);
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
      } catch {}

      if (applyToExistingProducts) {
        setProducts((prev) => {
          return prev.map((p) => {
            const currentSt = p.calculatorState || {};
            const currentFils = Array.isArray(currentSt.filaments) ? currentSt.filaments : [];
            const updatedFils =
              currentFils.length > 0
                ? currentFils.map((f, idx) =>
                    idx === 0 ? { ...f, costPerKg: newSettings.defaultFilamentCostPerKg } : f
                  )
                : [
                    {
                      id: 'fil-1',
                      name: 'PLA Standard',
                      usedGrams: 200,
                      costPerKg: newSettings.defaultFilamentCostPerKg,
                    },
                  ];

            const updatedElec = {
              ...(currentSt.electricity || {}),
              ratePerKwh: newSettings.defaultElectricityRatePerKwh,
            };

            const updatedSt = {
              ...currentSt,
              filaments: updatedFils,
              electricity: updatedElec,
            };

            const updatedRes = calculate3DPrintCost(updatedSt as any);

            const updatedProd = {
              ...p,
              calculatorState: updatedSt as any,
              calculationResult: updatedRes,
              updatedAt: Date.now(),
            };

            // Sync updated product to Supabase
            try {
              const supabase = getSupabaseClient();
              if (supabase) {
                supabase.from('products').upsert({
                  id: updatedProd.id,
                  category_id: updatedProd.categoryId,
                  subcategory_id: updatedProd.subcategoryId,
                  name: updatedProd.name,
                  dimensions: updatedProd.dimensions,
                  calculator_state: updatedProd.calculatorState,
                  calculation_result: updatedProd.calculationResult,
                });
              }
            } catch {}

            return updatedProd;
          });
        });
      }
    },
    []
  );

  return {
    globalSettings,
    updateGlobalSettings,
    categories,
    subcategories,
    products,
    addCategory,
    updateCategory,
    addSubcategory,
    updateSubcategory,
    saveCatalogProduct,
    deleteProduct,
    deleteCategory,
    deleteSubcategory,
    isSupabaseConnected,
    isSyncing,
    refetchCatalog: fetchCatalogFromSupabase,
  };
}
