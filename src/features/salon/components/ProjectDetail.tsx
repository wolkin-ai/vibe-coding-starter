import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useSalonProject } from '../hooks';

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, isError, error, refetch } = useSalonProject(projectId);

  const variationCounts = useMemo(() => {
    if (!project) {
      return { draft: 0, reviewing: 0, approved: 0, rejected: 0 } as const;
    }

    const base: Record<'draft' | 'reviewing' | 'approved' | 'rejected', number> = {
      draft: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
    };

    return project.jobs.reduce(
      (acc, job) => {
        job.variations.forEach((variation) => {
          acc[variation.status] += 1;
        });
        return acc;
      },
      { ...base },
    );
  }, [project]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center text-gray-500">読み込み中です...</Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="mb-4">プロジェクトの取得に失敗しました: {error?.message}</p>
          <Button variant="outline" onClick={() => refetch()}>
            再読み込み
          </Button>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p>プロジェクトが見つかりません</p>
      </div>
    );
  }

  const assets = project.assets;
  const jobs = project.jobs;
  const totalVariations = jobs.flatMap((job) => job.variations);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      uploaded: 'アップロード済み',
      ready_for_generation: '生成準備完了',
      draft: '未レビュー',
      reviewing: 'レビュー中',
      approved: '承認済み',
      rejected: '却下',
    };
    return labels[status] ?? status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      uploaded: 'bg-gray-100 text-gray-700',
      ready_for_generation: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-700',
      reviewing: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                project.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {project.status === 'active' ? '進行中' : 'アーカイブ'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            更新日: {new Date(project.updated_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/salon/projects')}>
            プロジェクト一覧へ
          </Button>
          <Button onClick={() => navigate(`/salon/projects/${projectId}/upload`)}>
            画像をアップロード
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">元画像</p>
          <p className="text-2xl font-bold">{assets.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">生成ジョブ</p>
          <p className="text-2xl font-bold">{jobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">生成バリエーション</p>
          <p className="text-2xl font-bold">{totalVariations.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">承認済み</p>
          <p className="text-2xl font-bold text-green-600">{variationCounts.approved}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate(`/salon/projects/${projectId}/upload`)}>
            📤 画像アップロード
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/salon/projects/${projectId}/approved-export`)}
            disabled={variationCounts.approved === 0}
          >
            📦 承認済み案エクスポート ({variationCounts.approved})
          </Button>
          <Button variant="outline" disabled>
            📊 生成レポート
          </Button>
          <Button variant="outline" disabled>
            🎨 スタイルプリセット管理
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">画像一覧 ({assets.length}枚)</h2>

        {assets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group cursor-pointer overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
                onClick={() => navigate(`/salon/assets/${asset.id}/style-parameters`)}
              >
                <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                  <img
                    src={asset.original_url}
                    alt="Asset"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <div className="mb-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${getStatusColor(asset.status)}`}
                    >
                      {getStatusLabel(asset.status)}
                    </span>
                  </div>
                  {asset.description && (
                    <p className="line-clamp-2 text-sm text-gray-600">{asset.description}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(asset.uploaded_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <p className="mb-4">まだ画像がありません</p>
            <Button onClick={() => navigate(`/salon/projects/${projectId}/upload`)}>
              最初の画像をアップロード
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
