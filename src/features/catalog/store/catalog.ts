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
  addModel: (model: CutModel) => void;
  toggleModelFavorite: (id: string) => void;
  removeModel: (id: string) => void;

  // Actions - Style
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

  addModel: (model) =>
    set((state) => {
      const models = [...state.models, model];
      const favoriteModels = model.is_favorite
        ? [...state.favoriteModels, model]
        : state.favoriteModels;
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
