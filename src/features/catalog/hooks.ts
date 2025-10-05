import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { features as appFeatures } from '@/shared/config';

import { listCatalogModels, saveCatalogModels, type SaveCutModelInput } from './api/models';
import { listCatalogStyles, saveCatalogStyles, type SaveCatalogStyleInput } from './api/styles';
import { useCatalogStore } from './store/catalog';
import type { CutModel, HairStyle, HairStyleStatus, HairParameters } from './types';

const queryKeys = {
  models: ['catalog', 'models'] as const,
  styles: ['catalog', 'styles'] as const,
};

export interface CatalogModelsQueryResult {
  models: CutModel[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<CutModel[]>;
  isSupabaseEnabled: boolean;
}

export function useCatalogModelsQuery(): CatalogModelsQueryResult {
  const setModels = useCatalogStore((state) => state.setModels);
  const models = useCatalogStore((state) => state.models);
  const isSupabaseEnabled = appFeatures.catalog.useSupabase;

  const query = useQuery<CutModel[]>({
    queryKey: queryKeys.models,
    queryFn: listCatalogModels,
    staleTime: 1000 * 60 * 5,
    enabled: isSupabaseEnabled,
  });

  useEffect(() => {
    if (isSupabaseEnabled && query.data) {
      setModels(query.data);
    }
  }, [isSupabaseEnabled, query.data, setModels]);

  if (!isSupabaseEnabled) {
    return {
      models,
      isLoading: false,
      isError: false,
      error: null,
      refetch: async () => models,
      isSupabaseEnabled,
    };
  }

  return {
    models,
    isLoading: query.isLoading,
    isError: query.isError ?? false,
    error: query.error ?? null,
    refetch: async () => {
      const result = await query.refetch();
      if (result.data) {
        setModels(result.data);
        return result.data;
      }
      return useCatalogStore.getState().models;
    },
    isSupabaseEnabled,
  };
}

function buildLocalModels(inputs: SaveCutModelInput[]): CutModel[] {
  const timestamp = Date.now();
  return inputs.map((input, index) => {
    const hairProfile = input.hairProfile ?? {};
    const generationParams = input.generationParams ?? {};
    const id = `local-model-${timestamp}-${index}`;
    const now = new Date().toISOString();

    const model: CutModel = {
      id,
      gender: input.gender,
      age_range: input.ageRange,
      image_url: input.imageUrl,
      generation_params: generationParams,
      is_favorite: false,
      tags: input.tags && input.tags.length > 0 ? input.tags : [],
      created_at: now,
      updated_at: now,
      created_by: 'local-user',
    };

    if (input.faceType) {
      model.face_type = input.faceType;
    }
    if (Object.keys(hairProfile).length > 0) {
      model.hair_profile = hairProfile;
    }
    if (input.generationPrompt) {
      model.generation_prompt = input.generationPrompt;
    }
    if (input.synthidMetadata !== undefined) {
      model.synthid_metadata = input.synthidMetadata;
    }

    return model;
  });
}

export function useSaveCatalogModelsMutation() {
  const queryClient = useQueryClient();
  const upsertModels = useCatalogStore((state) => state.upsertModels);
  const isSupabaseEnabled = appFeatures.catalog.useSupabase;

  return useMutation<CutModel[], Error, SaveCutModelInput[]>({
    mutationFn: async (inputs) => {
      if (!isSupabaseEnabled) {
        return buildLocalModels(inputs);
      }
      return saveCatalogModels(inputs);
    },
    onSuccess: (models) => {
      upsertModels(models);
      if (isSupabaseEnabled) {
        queryClient.invalidateQueries({ queryKey: queryKeys.models });
      }
    },
  });
}

export type { SaveCutModelInput };

export interface CatalogStylesQueryResult {
  styles: HairStyle[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<HairStyle[]>;
  isSupabaseEnabled: boolean;
}

export function useCatalogStylesQuery(): CatalogStylesQueryResult {
  const setStyles = useCatalogStore((state) => state.setStyles);
  const styles = useCatalogStore((state) => state.styles);
  const isSupabaseEnabled = appFeatures.catalog.useSupabase;

  const query = useQuery<HairStyle[]>({
    queryKey: queryKeys.styles,
    queryFn: listCatalogStyles,
    staleTime: 1000 * 60 * 5,
    enabled: isSupabaseEnabled,
  });

  useEffect(() => {
    if (isSupabaseEnabled && query.data) {
      setStyles(query.data);
    }
  }, [isSupabaseEnabled, query.data, setStyles]);

  if (!isSupabaseEnabled) {
    return {
      styles,
      isLoading: false,
      isError: false,
      error: null,
      refetch: async () => styles,
      isSupabaseEnabled,
    };
  }

  return {
    styles,
    isLoading: query.isLoading,
    isError: query.isError ?? false,
    error: query.error ?? null,
    refetch: async () => {
      const result = await query.refetch();
      if (result.data) {
        setStyles(result.data);
        return result.data;
      }
      return useCatalogStore.getState().styles;
    },
    isSupabaseEnabled,
  };
}

function buildLocalStyles(
  inputs: SaveCatalogStyleInput[],
  baseParams: { status: HairStyleStatus },
): HairStyle[] {
  const timestamp = Date.now();
  return inputs.map((input, index) => {
    const id = `local-style-${timestamp}-${index}`;
    const now = new Date().toISOString();
    const tags = input.tags && input.tags.length > 0 ? input.tags : [];

    const style: HairStyle = {
      id,
      parameters: input.parameters,
      image_url: input.imageUrl,
      status: baseParams.status,
      is_favorite: false,
      tags,
      generation_job_id: input.generationJobId ?? `local-job-${timestamp}`,
      created_at: now,
      updated_at: now,
      created_by: 'local-user',
      approved_at: null,
    };

    if (input.cutModelId) {
      style.cut_model_id = input.cutModelId;
    }
    if (input.referenceImageUrl) {
      style.reference_image_url = input.referenceImageUrl;
    }
    if (input.generationParams) {
      style.generation_params = input.generationParams;
    }
    if (input.generationPrompt) {
      style.generation_prompt = input.generationPrompt;
    }
    if (input.title) {
      style.title = input.title;
    }
    if (input.description) {
      style.description = input.description;
    }

    return style;
  });
}

export function useSaveCatalogStylesMutation(defaultStatus: HairStyleStatus = 'draft') {
  const queryClient = useQueryClient();
  const upsertStyles = useCatalogStore((state) => state.upsertStyles);
  const isSupabaseEnabled = appFeatures.catalog.useSupabase;

  return useMutation<HairStyle[], Error, SaveCatalogStyleInput[]>({
    mutationFn: async (inputs) => {
      if (!isSupabaseEnabled) {
        return buildLocalStyles(inputs, { status: defaultStatus });
      }
      return saveCatalogStyles(inputs);
    },
    onSuccess: (styles) => {
      upsertStyles(styles);
      if (isSupabaseEnabled) {
        queryClient.invalidateQueries({ queryKey: queryKeys.styles });
      }
    },
  });
}

export type { SaveCatalogStyleInput };
