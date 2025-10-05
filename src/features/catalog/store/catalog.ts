import { create } from 'zustand';
import type { CutModel, HairStyle, GenerationJob } from '../types';

interface CatalogStore {
  // Current selections
  currentModel: CutModel | null;

  // Collections
  models: CutModel[];
  styles: HairStyle[];
  jobs: GenerationJob[];

  // Favorites / Catalog
  favoriteModels: CutModel[];
  catalogStyles: HairStyle[]; // approved styles

  // Actions - Model
  setCurrentModel: (model: CutModel | null) => void;
  setModels: (models: CutModel[]) => void;
  upsertModels: (models: CutModel[]) => void;
  toggleModelFavorite: (id: string) => void;
  removeModel: (id: string) => void;

  // Actions - Style
  setStyles: (styles: HairStyle[]) => void;
  upsertStyles: (styles: HairStyle[]) => void;
  addStyle: (style: HairStyle) => void;
  updateStyle: (id: string, updates: Partial<HairStyle>) => void;
  toggleStyleFavorite: (id: string) => void;
  approveStyle: (id: string) => void;
  removeStyle: (id: string) => void;

  // Actions - Job
  addJob: (job: GenerationJob) => void;
  updateJob: (id: string, updates: Partial<GenerationJob>) => void;

  // Utility
  getModelStyles: (modelId: string) => HairStyle[];
  getAllModels: () => CutModel[];
  getAllStyles: () => HairStyle[];

  // Clear
  clearAll: () => void;
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  // Initial state
  currentModel: null,
  models: [],
  styles: [],
  jobs: [],
  favoriteModels: [],
  catalogStyles: [],

  // Model actions
  setCurrentModel: (model) => set({ currentModel: model }),

  setModels: (models) =>
    set(() => ({
      models,
      favoriteModels: models.filter((model) => model.is_favorite),
    })),

  upsertModels: (incoming) =>
    set((state) => {
      const merged = new Map(state.models.map((model) => [model.id, model] as const));
      incoming.forEach((model) => {
        merged.set(model.id, model);
      });
      const models = Array.from(merged.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const favoriteModels = models.filter((model) => model.is_favorite);
      return { models, favoriteModels };
    }),

  toggleModelFavorite: (id) =>
    set((state) => {
      const models = state.models.map((m) =>
        m.id === id ? { ...m, is_favorite: !m.is_favorite } : m,
      );
      const favoriteModels = models.filter((m) => m.is_favorite);
      return { models, favoriteModels };
    }),

  removeModel: (id) =>
    set((state) => ({
      models: state.models.filter((m) => m.id !== id),
      favoriteModels: state.favoriteModels.filter((m) => m.id !== id),
    })),

  // Style actions
  setStyles: (styles) =>
    set(() => ({
      styles,
      catalogStyles: styles.filter((style) => style.status === 'approved'),
    })),

  upsertStyles: (incoming) =>
    set((state) => {
      const merged = new Map(state.styles.map((style) => [style.id, style] as const));
      incoming.forEach((style) => {
        merged.set(style.id, style);
      });
      const styles = Array.from(merged.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const catalogStyles = styles.filter((style) => style.status === 'approved');
      return { styles, catalogStyles };
    }),

  addStyle: (style) =>
    set((state) => {
      const styles = [...state.styles, style];
      const catalogStyles =
        style.status === 'approved' ? [...state.catalogStyles, style] : state.catalogStyles;
      return { styles, catalogStyles };
    }),

  updateStyle: (id, updates) =>
    set((state) => {
      const styles = state.styles.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const catalogStyles = styles.filter((s) => s.status === 'approved');
      return { styles, catalogStyles };
    }),

  toggleStyleFavorite: (id) =>
    set((state) => ({
      styles: state.styles.map((s) => (s.id === id ? { ...s, is_favorite: !s.is_favorite } : s)),
    })),

  approveStyle: (id) =>
    set((state) => {
      const styles = state.styles.map((s) =>
        s.id === id
          ? { ...s, status: 'approved' as const, approved_at: new Date().toISOString() }
          : s,
      );
      const catalogStyles = styles.filter((s) => s.status === 'approved');
      return { styles, catalogStyles };
    }),

  removeStyle: (id) =>
    set((state) => ({
      styles: state.styles.filter((s) => s.id !== id),
      catalogStyles: state.catalogStyles.filter((s) => s.id !== id),
    })),

  // Job actions
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    })),

  // Utility functions
  getModelStyles: (modelId) => get().styles.filter((s) => s.cut_model_id === modelId),

  getAllModels: () => get().models,

  getAllStyles: () => get().styles,

  // Clear all
  clearAll: () =>
    set({
      currentModel: null,
      models: [],
      styles: [],
      jobs: [],
      favoriteModels: [],
      catalogStyles: [],
    }),
}));
