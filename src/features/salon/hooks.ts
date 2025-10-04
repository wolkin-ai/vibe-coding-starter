import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { uploadAsset, listAssets, findAssetById } from './api/assets';
import { fetchProject, listProjects } from './api/projects';
import {
  createGenerationJob,
  fetchLatestJobByAsset,
  listVariationsByJob,
  saveGeneratedVariation,
  updateGenerationJobStatus,
  updateVariationStatus,
} from './api/generation';
import { createReview, listReviewsByVariations } from './api/reviews';
import type {
  Asset,
  GenerationJob,
  GenerationJobStatus,
  GenerationJobWithVariations,
  ProjectDetail,
  ProjectSummary,
  Review,
  StyleParameters,
  Variation,
  VariationStatus,
} from './types';

type UploadAssetArgs = {
  projectId: string;
  file: File;
  description?: string;
};

type GenerationJobArgs = {
  assetId: string;
  projectId: string;
  parameters: StyleParameters;
  variationCount: number;
};

type SaveVariationArgs = {
  jobId: string;
  variationRank: number;
  dataUrl: string;
  status?: VariationStatus;
  safetyFlags?: string[];
};

type UpdateVariationStatusArgs = {
  variationId: string;
  jobId: string;
  status: VariationStatus;
  projectId: string;
};

type CreateReviewArgs = {
  variationId: string;
  status: 'approved' | 'rejected';
  comment?: string;
};

const queryKeys = {
  projects: ['salon', 'projects'] as const,
  project: (projectId: string) => ['salon', 'projects', projectId] as const,
  assets: (projectId: string) => ['salon', 'assets', projectId] as const,
  asset: (assetId: string) => ['salon', 'asset', assetId] as const,
  variations: (jobId: string) => ['salon', 'variations', jobId] as const,
  reviews: (variationIds: string[]) => ['salon', 'reviews', ...variationIds.sort()] as const,
  latestJob: (assetId: string) => ['salon', 'latest-job', assetId] as const,
};

export function useSalonProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: queryKeys.projects,
    queryFn: listProjects,
  });
}

export function useSalonProject(projectId: string | undefined) {
  return useQuery<ProjectDetail | null>({
    queryKey: queryKeys.project(projectId ?? 'unknown'),
    queryFn: () => (projectId ? fetchProject(projectId) : Promise.resolve(null)),
    enabled: Boolean(projectId),
  });
}

export function useProjectAssets(projectId: string | undefined) {
  return useQuery<Asset[]>({
    queryKey: queryKeys.assets(projectId ?? 'unknown'),
    queryFn: () => (projectId ? listAssets(projectId) : Promise.resolve([])),
    enabled: Boolean(projectId),
  });
}

export function useAsset(assetId: string | undefined) {
  return useQuery<Asset | null>({
    queryKey: queryKeys.asset(assetId ?? 'unknown'),
    queryFn: () => (assetId ? findAssetById(assetId) : Promise.resolve(null)),
    enabled: Boolean(assetId),
  });
}

export function useLatestGenerationJob(assetId: string | undefined) {
  return useQuery<GenerationJobWithVariations | null>({
    queryKey: queryKeys.latestJob(assetId ?? 'unknown'),
    queryFn: () => (assetId ? fetchLatestJobByAsset(assetId) : Promise.resolve(null)),
    enabled: Boolean(assetId),
  });
}

export function useUploadAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation<Asset, Error, UploadAssetArgs>({
    mutationFn: ({ projectId, file, description }) =>
      uploadAsset({
        projectId,
        file,
        ...(description ? { description } : {}),
      }),
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets(asset.project_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(asset.project_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useCreateGenerationJobMutation() {
  const queryClient = useQueryClient();

  return useMutation<GenerationJob, Error, GenerationJobArgs>({
    mutationFn: createGenerationJob,
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(job.project_id) });
    },
  });
}

export function useGenerationJobStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      jobId: string;
      status: GenerationJobStatus;
      options?: { errorMessage?: string; responseId?: string };
    }
  >({
    mutationFn: ({ jobId, status, options }) => updateGenerationJobStatus(jobId, status, options),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variations(variables.jobId) });
    },
  });
}

export function useVariations(jobId: string | undefined) {
  return useQuery<Variation[]>({
    queryKey: queryKeys.variations(jobId ?? 'unknown'),
    queryFn: () => (jobId ? listVariationsByJob(jobId) : Promise.resolve([])),
    enabled: Boolean(jobId),
  });
}

export function useSaveVariationMutation() {
  const queryClient = useQueryClient();

  return useMutation<Variation, Error, SaveVariationArgs>({
    mutationFn: saveGeneratedVariation,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variations(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useVariationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateVariationStatusArgs>({
    mutationFn: ({ variationId, status }) => updateVariationStatus(variationId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variations(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews([variables.variationId]) });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useReviews(variationIds: string[]) {
  return useQuery<Review[]>({
    queryKey: queryKeys.reviews(variationIds),
    queryFn: () => listReviewsByVariations(variationIds),
    enabled: variationIds.length > 0,
  });
}

export function useCreateReviewMutation(variationIds: string[]) {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, CreateReviewArgs>({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(variationIds) });
    },
  });
}
