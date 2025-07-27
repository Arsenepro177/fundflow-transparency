-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('ngo', 'donor', 'validator');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role app_role NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ngo_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  funding_goal REAL NOT NULL,
  funds_raised REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount_needed REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proofs table
CREATE TABLE public.proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  proof_url TEXT NOT NULL,
  geotag TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create validations table
CREATE TABLE public.validations (
  id BIGSERIAL PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(milestone_id, validator_id)
);

-- Create donations table
CREATE TABLE public.donations (
  id BIGSERIAL PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ledger table
CREATE TABLE public.ledger (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "NGOs can insert projects" ON public.projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = ngo_id AND user_id = auth.uid() AND role = 'ngo')
);
CREATE POLICY "NGOs can update own projects" ON public.projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = ngo_id AND user_id = auth.uid() AND role = 'ngo')
);

-- RLS Policies for milestones
CREATE POLICY "Anyone can view milestones" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "NGOs can insert milestones for own projects" ON public.milestones FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    JOIN public.profiles pr ON p.ngo_id = pr.id 
    WHERE p.id = project_id AND pr.user_id = auth.uid() AND pr.role = 'ngo'
  )
);

-- RLS Policies for proofs
CREATE POLICY "Anyone can view proofs" ON public.proofs FOR SELECT USING (true);
CREATE POLICY "NGOs can insert proofs for own milestones" ON public.proofs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.projects p ON m.project_id = p.id
    JOIN public.profiles pr ON p.ngo_id = pr.id
    WHERE m.id = milestone_id AND pr.user_id = auth.uid() AND pr.role = 'ngo'
  )
);

-- RLS Policies for validations
CREATE POLICY "Anyone can view validations" ON public.validations FOR SELECT USING (true);
CREATE POLICY "Validators can insert validations" ON public.validations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = validator_id AND user_id = auth.uid() AND role = 'validator')
);

-- RLS Policies for donations
CREATE POLICY "Users can view own donations" ON public.donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = donor_id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can make donations" ON public.donations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = donor_id AND user_id = auth.uid())
);

-- RLS Policies for ledger (read-only for users)
CREATE POLICY "Anyone can view ledger" ON public.ledger FOR SELECT USING (true);

-- Create storage bucket for proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true);

-- Storage policies for proofs bucket
CREATE POLICY "Anyone can view proofs" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');
CREATE POLICY "NGOs can upload proofs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'proofs' AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ngo')
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor')::app_role,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();