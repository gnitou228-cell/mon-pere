-- ==============================================================================
-- SCRIPT: MISE À JOUR DE LA BD POUR INTÉGRATION API-FOOTBALL
-- ==============================================================================

-- 1. TABLE : matches (Adaptée pour API-Football)
-- On supprime l'ancienne si elle existe pour recréer proprement avec la contrainte unique
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;

CREATE TABLE public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  api_fixture_id integer UNIQUE NOT NULL, -- Clé unique venant de l'API pour éviter les doublons
  team_home text NOT NULL,
  team_away text NOT NULL,
  team_home_logo text,
  team_away_logo text,
  competition text,
  competition_logo text,
  start_time timestamp with time zone NOT NULL,
  status text DEFAULT 'NS', -- NS (Not Started), 1H, HT, 2H, FT (Full Time)
  score_home integer DEFAULT null,
  score_away integer DEFAULT null,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture pour tous les utilisateurs connectés" ON public.matches FOR SELECT USING (auth.role() = 'authenticated');


-- 2. TABLE : predictions (Liée à l'API)
CREATE TABLE public.predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  api_fixture_id integer UNIQUE NOT NULL, -- Clé unique pour UPSERT
  prediction_type text NOT NULL, -- ex: 'Winner', 'BTTS'
  prediction_value text NOT NULL, -- ex: 'Home', 'Yes'
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  odds decimal(5,2),
  is_premium boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture des prédictions" ON public.predictions FOR SELECT USING (auth.role() = 'authenticated');
