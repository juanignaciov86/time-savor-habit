-- Check if habits table exists and has the correct structure
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'habits') THEN
        CREATE TABLE public.habits (
            id UUID PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT NOT NULL,
            created_at BIGINT NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
        );
        
        -- Create index on user_id
        CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);
    END IF;
    
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'habits' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can read their own habits" ON public.habits;
    DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
    DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
    DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
    
    -- Create fresh policies
    CREATE POLICY "Users can read their own habits"
        ON public.habits
        FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own habits"
        ON public.habits
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own habits"
        ON public.habits
        FOR UPDATE
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own habits"
        ON public.habits
        FOR DELETE
        USING (auth.uid() = user_id);
        
END $$;
