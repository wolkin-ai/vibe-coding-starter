import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useSalonProjects } from '../hooks';

export function ProjectList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
  const { data: projects = [], isLoading, isError, error, refetch } = useSalonProjects();

  const filteredProjects = useMemo(
    () => (filter === 'all' ? projects : projects.filter((project) => project.status === filter)),
    [projects, filter],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">プロジェクト一覧</h1>
          <p className="mt-2 text-gray-600">美容室スタイル画像の管理とHPB入稿準備</p>
        </div>
        <Button onClick={() => navigate('/salon/projects/new')}>新規プロジェクト</Button>
      </div>

      {isError && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center justify-between">
            <p>プロジェクトの読み込みに失敗しました: {error?.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              再読み込み
            </Button>
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'primary' : 'outline'} onClick={() => setFilter('all')}>
          すべて
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'outline'}
          onClick={() => setFilter('active')}
        >
          進行中
        </Button>
        <Button
          variant={filter === 'archived' ? 'primary' : 'outline'}
          onClick={() => setFilter('archived')}
        >
          アーカイブ
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-6 text-center text-gray-500">読み込み中です...</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => navigate(`/salon/projects/${project.id}`)}
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {project.status === 'active' ? '進行中' : 'アーカイブ'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>総画像数</span>
                    <span className="font-medium">{project.asset_count}枚</span>
                  </div>
                  <div className="flex justify-between">
                    <span>承認済み</span>
                    <span className="font-medium text-green-600">
                      {project.approved_variation_count}枚
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>生成済み</span>
                    <span className="font-medium">{project.variation_count}案</span>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    更新日: {new Date(project.updated_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredProjects.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <p>プロジェクトがありません</p>
        </div>
      )}
    </div>
  );
}
