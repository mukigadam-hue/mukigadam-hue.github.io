
-- Add discoverable toggle to businesses
ALTER TABLE public.businesses ADD COLUMN is_discoverable boolean NOT NULL DEFAULT true;

-- Blocklist table: block specific businesses from seeing yours
CREATE TABLE public.business_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  blocked_business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, blocked_business_id)
);

ALTER TABLE public.business_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view blocks"
  ON public.business_blocks FOR SELECT TO authenticated
  USING (is_business_member(auth.uid(), business_id));

CREATE POLICY "Owner/admin can add blocks"
  ON public.business_blocks FOR INSERT TO authenticated
  WITH CHECK (is_owner_or_admin(auth.uid(), business_id));

CREATE POLICY "Owner/admin can remove blocks"
  ON public.business_blocks FOR DELETE TO authenticated
  USING (is_owner_or_admin(auth.uid(), business_id));

-- Update search_businesses to respect visibility and blocks
CREATE OR REPLACE FUNCTION public.search_businesses(_query text DEFAULT '', _limit int DEFAULT 20, _offset int DEFAULT 0)
RETURNS TABLE(
  id uuid, name text, business_type text, address text, contact text, email text,
  logo_url text, business_code text, products_description text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT b.id, b.name, b.business_type, b.address, b.contact, b.email, b.logo_url, b.business_code, b.products_description
  FROM public.businesses b
  WHERE 
    b.is_discoverable = true
    AND NOT EXISTS (
      SELECT 1 FROM public.business_blocks bl
      WHERE bl.business_id = b.id
      AND bl.blocked_business_id IN (
        SELECT bm.business_id FROM public.business_memberships bm WHERE bm.user_id = auth.uid()
      )
    )
    AND (
      _query = '' OR
      b.name ILIKE '%' || _query || '%' OR
      b.business_type ILIKE '%' || _query || '%' OR
      b.address ILIKE '%' || _query || '%' OR
      b.products_description ILIKE '%' || _query || '%'
    )
  ORDER BY b.name ASC
  LIMIT _limit OFFSET _offset;
$$;
