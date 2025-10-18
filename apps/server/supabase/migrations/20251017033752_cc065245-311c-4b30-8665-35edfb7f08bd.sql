-- Create optimization jobs table
CREATE TABLE public.optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued', -- queued|running|succeeded|failed|stopped
  iteration INTEGER DEFAULT 0,
  spec JSONB NOT NULL,
  best_result JSONB,
  optimized_verilog TEXT,
  diffs JSONB DEFAULT '[]'::jsonb,
  charts JSONB DEFAULT '{}'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  artifacts JSONB,
  logs_tail TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.optimization_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since this is a demo tool)
CREATE POLICY "Anyone can view jobs"
  ON public.optimization_jobs
  FOR SELECT
  USING (true);

-- Allow public insert
CREATE POLICY "Anyone can create jobs"
  ON public.optimization_jobs
  FOR INSERT
  WITH CHECK (true);

-- Allow public update
CREATE POLICY "Anyone can update jobs"
  ON public.optimization_jobs
  FOR UPDATE
  USING (true);

-- Create storage bucket for artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('optimization-artifacts', 'optimization-artifacts', true);

-- Storage policies
CREATE POLICY "Anyone can upload artifacts"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'optimization-artifacts');

CREATE POLICY "Anyone can view artifacts"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'optimization-artifacts');

-- Index for faster job lookups
CREATE INDEX idx_jobs_job_id ON public.optimization_jobs(job_id);
CREATE INDEX idx_jobs_state ON public.optimization_jobs(state);