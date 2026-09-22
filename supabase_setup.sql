-- ==============================================================================
-- 1. CRÉATION DE LA TABLE PROFILES
-- ==============================================================================
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text,
  whatsapp text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- La clé primaire est l'ID de l'utilisateur provenant de auth.users
  PRIMARY KEY (id)
);

-- ==============================================================================
-- 2. ACTIVATION DU RLS (Row Level Security)
-- ==============================================================================
-- On force l'activation de RLS sur la table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Un utilisateur peut voir son PROPRE profil
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

-- Politique : Un utilisateur peut modifier son PROPRE profil
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- ==============================================================================
-- 3. CRÉATION DU TRIGGER POUR L'INSCRIPTION
-- ==============================================================================
-- Cette fonction sera appelée à chaque fois qu'un utilisateur est créé dans auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, whatsapp, avatar_url)
  VALUES (
    NEW.id,
    -- On récupère les métadonnées (first_name, last_name, whatsapp) envoyées par le front-end
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'whatsapp',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Création du Trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
