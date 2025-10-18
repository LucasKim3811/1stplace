-- Add user_id column to track job ownership
ALTER TABLE public.optimization_jobs 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id required for new jobs
ALTER TABLE public.optimization_jobs 
ALTER COLUMN user_id SET NOT NULL;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view jobs" ON public.optimization_jobs;
DROP POLICY IF EXISTS "Anyone can create jobs" ON public.optimization_jobs;
DROP POLICY IF EXISTS "Anyone can update jobs" ON public.optimization_jobs;

-- Create restrictive policies based on user ownership
CREATE POLICY "Users can view their own jobs"
ON public.optimization_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
ON public.optimization_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
ON public.optimization_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
ON public.optimization_jobs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_user_id ON public.optimization_jobs(user_id);