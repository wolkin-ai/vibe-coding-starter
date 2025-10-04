-- Seed data for Vibe Coding Starter
-- This file provides sample data for development and testing

-- Note: In a real application with authentication, you would need actual user IDs
-- For local development and testing purposes, we'll create a test user first

-- Insert test users for development (only if they don't exist)
-- These users will only exist in local development environment
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
SELECT 
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Test User"}'::jsonb,
    false,
    'authenticated'
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
);

-- Insert sample todos for the test user
INSERT INTO todos (title, completed, user_id) VALUES
    ('Vibe Coding Starterを使ってみる', false, '11111111-1111-1111-1111-111111111111'::uuid),
    ('Todoアプリの基本機能をテスト', false, '11111111-1111-1111-1111-111111111111'::uuid),
    ('完了済みTodoの一括削除をテスト', true, '11111111-1111-1111-1111-111111111111'::uuid),
    ('Supabaseローカル環境の確認', true, '11111111-1111-1111-1111-111111111111'::uuid),
    ('型安全なAPIの動作確認', false, '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Create additional test data for demonstration
INSERT INTO todos (title, completed, user_id) VALUES
    ('React Query フックの動作確認', false, '11111111-1111-1111-1111-111111111111'::uuid),
    ('Feature-first アーキテクチャの理解', false, '11111111-1111-1111-1111-111111111111'::uuid),
    ('RLSポリシーのセキュリティ確認', true, '11111111-1111-1111-1111-111111111111'::uuid),
    ('コミット前チェックの動作確認', true, '11111111-1111-1111-1111-111111111111'::uuid),
    ('初心者向けVibeコーディング学習', false, '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Seed salon projects
INSERT INTO public.salon_projects (id, name, salon_id, owner_id, status, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000101'::uuid, '春の新スタイル提案', 'salon-1', '11111111-1111-1111-1111-111111111111'::uuid, 'active', timezone('utc', now()) - interval '20 days', timezone('utc', now()) - interval '5 days'),
    ('00000000-0000-0000-0000-000000000102'::uuid, 'カラーバリエーション比較', 'salon-1', '11111111-1111-1111-1111-111111111111'::uuid, 'active', timezone('utc', now()) - interval '30 days', timezone('utc', now()) - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Seed salon assets
INSERT INTO public.salon_assets (id, project_id, original_url, storage_path, status, uploaded_by, uploaded_at, description)
VALUES
    (
      '00000000-0000-0000-0000-000000000201'::uuid,
      '00000000-0000-0000-0000-000000000101'::uuid,
      'https://placehold.co/800x1000/e3b7ff/FFF?text=Original+Photo+1',
      'projects/00000000-0000-0000-0000-000000000101/original-1.jpg',
      'ready_for_generation',
      '11111111-1111-1111-1111-111111111111'::uuid,
      timezone('utc', now()) - interval '5 days',
      '顧客Aさんの現在のスタイル'
    ),
    (
      '00000000-0000-0000-0000-000000000202'::uuid,
      '00000000-0000-0000-0000-000000000101'::uuid,
      'https://placehold.co/800x1000/ffb7c5/FFF?text=Original+Photo+2',
      'projects/00000000-0000-0000-0000-000000000101/original-2.jpg',
      'ready_for_generation',
      '11111111-1111-1111-1111-111111111111'::uuid,
      timezone('utc', now()) - interval '4 days',
      '顧客Bさんの参考画像'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed generation jobs
INSERT INTO public.salon_generation_jobs (
    id,
    asset_id,
    project_id,
    parameters,
    status,
    variation_count,
    created_by,
    created_at,
    started_at,
    completed_at,
    response_id
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000301'::uuid,
    '00000000-0000-0000-0000-000000000201'::uuid,
    '00000000-0000-0000-0000-000000000101'::uuid,
    '{"hair_length": "ミディアム", "color": "ブラウン系", "image_style": "ナチュラル"}'::jsonb,
    'completed',
    4,
    '11111111-1111-1111-1111-111111111111'::uuid,
    timezone('utc', now()) - interval '4 days',
    timezone('utc', now()) - interval '4 days',
    timezone('utc', now()) - interval '4 days' + interval '3 minutes',
    'gemini-resp-abc123'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed generated variations
INSERT INTO public.salon_variations (
    id,
    generation_job_id,
    variation_rank,
    image_url,
    storage_path,
    status,
    safety_flags,
    created_at
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000401'::uuid,
    '00000000-0000-0000-0000-000000000301'::uuid,
    1,
    'https://placehold.co/800x1000/d4a5ff/FFF?text=Variation+1-1',
    'jobs/00000000-0000-0000-0000-000000000301/variation-1.png',
    'approved',
    ARRAY['safe']::text[],
    timezone('utc', now()) - interval '4 days'
  ),
  (
    '00000000-0000-0000-0000-000000000402'::uuid,
    '00000000-0000-0000-0000-000000000301'::uuid,
    2,
    'https://placehold.co/800x1000/c5a5ff/FFF?text=Variation+1-2',
    'jobs/00000000-0000-0000-0000-000000000301/variation-2.png',
    'reviewing',
    ARRAY['safe']::text[],
    timezone('utc', now()) - interval '4 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed reviews
INSERT INTO public.salon_reviews (
    id,
    variation_id,
    reviewed_by,
    status,
    comment,
    reviewed_at
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000501'::uuid,
    '00000000-0000-0000-0000-000000000401'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'approved',
    '最終案として採用',
    timezone('utc', now()) - interval '4 days'
  )
ON CONFLICT (id) DO NOTHING;
