import { create } from 'zustand';
import type { Asset, GenerationJob, Variation } from '../types';

interface GenerationStore {
  // Current asset being worked on
  currentAsset: Asset | null;
  currentAssetFile: File | null;

  // Generation job and results
  currentJob: GenerationJob | null;
  variations: Variation[];

  // Actions
  setCurrentAsset: (asset: Asset, file: File) => void;
  setCurrentJob: (job: GenerationJob) => void;
  setVariations: (variations: Variation[] | ((prev: Variation[]) => Variation[])) => void;
  clearGeneration: () => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  currentAsset: null,
  currentAssetFile: null,
  currentJob: null,
  variations: [],

  setCurrentAsset: (asset, file) => set({ currentAsset: asset, currentAssetFile: file }),

  setCurrentJob: (job) => set({ currentJob: job }),

  setVariations: (variations) =>
    set((state) => ({
      variations: typeof variations === 'function' ? variations(state.variations) : variations,
    })),

  clearGeneration: () =>
    set({
      currentAsset: null,
      currentAssetFile: null,
      currentJob: null,
      variations: [],
    }),
}));
