-- Seed data for Vibe Coding Starter
-- This file provides sample data for development and testing

-- Note: In a real application with authentication, you would need actual user IDs
-- For local development and testing purposes, we'll create a test user first

-- Insert test users for development (only if they don't exist)
-- These users will only exist in local development environment
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
SELECT 
    'test-user-1'::uuid,
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
    SELECT 1 FROM auth.users WHERE id = 'test-user-1'::uuid
);

-- Insert sample todos for the test user
INSERT INTO todos (title, completed, user_id) VALUES
    ('Vibe Coding Starterを使ってみる', false, 'test-user-1'::uuid),
    ('Todoアプリの基本機能をテスト', false, 'test-user-1'::uuid),
    ('完了済みTodoの一括削除をテスト', true, 'test-user-1'::uuid),
    ('Supabaseローカル環境の確認', true, 'test-user-1'::uuid),
    ('型安全なAPIの動作確認', false, 'test-user-1'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Create additional test data for demonstration
INSERT INTO todos (title, completed, user_id) VALUES
    ('React Query フックの動作確認', false, 'test-user-1'::uuid),
    ('Feature-first アーキテクチャの理解', false, 'test-user-1'::uuid),
    ('RLSポリシーのセキュリティ確認', true, 'test-user-1'::uuid),
    ('コミット前チェックの動作確認', true, 'test-user-1'::uuid),
    ('初心者向けVibeコーディング学習', false, 'test-user-1'::uuid)
ON CONFLICT (id) DO NOTHING;
