-- ==============================================================================
-- SCRIPT: CRÉATION DES TABLES POUR PREDICTBET AI (Données Sportives & Utilisateurs)
-- ==============================================================================

-- 1. TABLE : matches (Les matchs programmés)
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_home text NOT NULL,
  team_away text NOT NULL,
  competition text,
  start_time timestamp with time zone NOT NULL,
  status text DEFAULT 'scheduled' -- scheduled, live, finished
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
-- Tout le monde peut lire les matchs
CREATE POLICY "Les matchs sont visibles par tous les utilisateurs connectés" ON public.matches FOR SELECT USING (auth.role() = 'authenticated');

-- 2. TABLE : predictions (Les prédictions générées par l'IA pour un match)
CREATE TABLE IF NOT EXISTS public.predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  prediction_type text NOT NULL, -- ex: '1X2', 'BTTS', 'Over 2.5'
  prediction_value text NOT NULL, -- ex: '1', 'Oui', 'Over'
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  odds decimal(5,2),
  is_premium boolean DEFAULT false
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les prédictions sont visibles par les utilisateurs connectés" ON public.predictions FOR SELECT USING (auth.role() = 'authenticated');

-- 3. TABLE : coupons (Les coupons de paris créés par l'utilisateur)
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  matches_array jsonb DEFAULT '[]'::jsonb, -- Stocke les détails du pari
  total_odds decimal(5,2) DEFAULT 1.0,
  status text DEFAULT 'pending', -- pending, won, lost
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs voient leurs propres coupons" ON public.coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent créer leurs coupons" ON public.coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent modifier leurs coupons" ON public.coupons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent supprimer leurs coupons" ON public.coupons FOR DELETE USING (auth.uid() = user_id);


-- 4. TABLE : notifications (Système d'alertes internes)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs gèrent leurs notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);


-- 5. TABLE : subscriptions (Gestion des abonnements Premium via SaaSPay plus tard)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_name text DEFAULT 'Gratuit',
  status text DEFAULT 'active',
  end_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs voient leur abonnement" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Fonction optionnelle : Créer un abonnement Gratuit par défaut à l'inscription
-- (S'ajoute au trigger handle_new_user existant de supabase_setup.sql)
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_name, status)
  VALUES (NEW.id, 'Gratuit', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_sub
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_subscription();
