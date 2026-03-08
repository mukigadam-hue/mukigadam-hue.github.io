
-- Business contacts table: stores B2B connections between businesses
CREATE TABLE public.business_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, contact_business_id)
);

ALTER TABLE public.business_contacts ENABLE ROW LEVEL SECURITY;

-- Members can view their business contacts
CREATE POLICY "Members can view contacts"
  ON public.business_contacts FOR SELECT
  USING (is_business_member(auth.uid(), business_id));

-- Members can add contacts
CREATE POLICY "Members can add contacts"
  ON public.business_contacts FOR INSERT
  WITH CHECK (is_business_member(auth.uid(), business_id));

-- Members can update contacts (nickname, notes)
CREATE POLICY "Members can update contacts"
  ON public.business_contacts FOR UPDATE
  USING (is_business_member(auth.uid(), business_id));

-- Owner/admin can delete contacts
CREATE POLICY "Owner can delete contacts"
  ON public.business_contacts FOR DELETE
  USING (is_owner_or_admin(auth.uid(), business_id));

-- Allow businesses to be found by code (public lookup)
-- We need a function that returns limited business info by code
CREATE OR REPLACE FUNCTION public.lookup_business_by_code(_code text)
RETURNS TABLE(id uuid, name text, business_type text, address text, contact text, email text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.id, b.name, b.business_type, b.address, b.contact, b.email, b.logo_url
  FROM public.businesses b
  WHERE b.business_code = upper(_code)
  LIMIT 1;
$$;
