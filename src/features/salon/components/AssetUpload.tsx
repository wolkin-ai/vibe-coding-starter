import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useGenerationStore } from '../store/generation';
import { useUploadAssetMutation } from '../hooks';

export function AssetUpload() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadAssetMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // プレビュー用のURLを生成
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...urls]);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleRemove = (index: number) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const { setCurrentAsset } = useGenerationStore();

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    if (!projectId) {
      console.error('Project ID is required');
      return;
    }

    const firstFile = uploadedFiles[0];
    if (!firstFile) {
      return;
    }

    try {
      const asset = await uploadMutation.mutateAsync({
        projectId,
        file: firstFile,
        description: `アップロード画像 - ${firstFile.name}`,
      });

      setCurrentAsset(asset, firstFile);

      navigate(`/salon/assets/${asset.id}/style-parameters`);
    } catch (error) {
      console.error('Upload failed', error);
      alert(error instanceof Error ? error.message : 'アップロードに失敗しました');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">画像アップロード</h1>
          <p className="mt-2 text-sm text-gray-600">
            スタイル提案の元となる顧客写真または参考画像をアップロードしてください
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          戻る
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition-colors hover:border-gray-400 hover:bg-gray-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">クリックして選択</span>
                またはドラッグ&ドロップ
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, HEIC (推奨サイズ: 800x1000px以上)</p>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <strong>💡 ヒント:</strong>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>顔がはっきり写っている写真が最適です</li>
              <li>正面または斜めからの角度が理想的です</li>
              <li>明るく鮮明な画像をご使用ください</li>
            </ul>
          </div>
        </div>
      </Card>

      {previewUrls.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">選択された画像 ({previewUrls.length}枚)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100"
              >
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-xs text-white">
                  {uploadedFiles[index]?.name}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewUrls([]);
                setUploadedFiles([]);
              }}
            >
              すべてクリア
            </Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending
                ? 'アップロード中...'
                : `${uploadedFiles.length}枚をアップロード`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
