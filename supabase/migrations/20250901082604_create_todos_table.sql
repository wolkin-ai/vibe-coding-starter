-- Create todos table for Vibe Coding Starter
-- This migration creates a secure, user-isolated todos table with RLS policies

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure data access
-- Users can only see their own todos
CREATE POLICY "Users can only see their own todos" ON todos
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own todos
CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own todos
CREATE POLICY "Users can update their own todos" ON todos  
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own todos
CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos(user_id);
CREATE INDEX IF NOT EXISTS todos_created_at_idx ON todos(created_at DESC);
CREATE INDEX IF NOT EXISTS todos_user_completed_idx ON todos(user_id, completed);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on every UPDATE
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments for documentation
COMMENT ON TABLE todos IS 'User todos with Row Level Security enabled';
COMMENT ON COLUMN todos.id IS 'Primary key (UUID)';
COMMENT ON COLUMN todos.title IS 'Todo title with length validation';
COMMENT ON COLUMN todos.completed IS 'Whether the todo is completed';
COMMENT ON COLUMN todos.user_id IS 'Reference to auth.users, ensures data isolation';
COMMENT ON COLUMN todos.created_at IS 'Creation timestamp (UTC)';
COMMENT ON COLUMN todos.updated_at IS 'Last update timestamp (UTC, auto-updated)';
