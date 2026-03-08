
-- Add country_code column to businesses
ALTER TABLE public.businesses ADD COLUMN country_code text NOT NULL DEFAULT '';

-- Update the business code generation to include country prefix
CREATE OR REPLACE FUNCTION public.generate_business_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code TEXT;
  code_exists BOOLEAN;
  max_attempts INT := 10;
  attempt INT := 0;
  prefix TEXT;
BEGIN
  IF NEW.business_code IS NULL OR NEW.business_code = '' THEN
    -- Use country_code as prefix if provided
    prefix := COALESCE(NULLIF(UPPER(TRIM(NEW.country_code)), ''), 'XX');
    
    LOOP
      attempt := attempt + 1;
      new_code := '';
      FOR i IN 1..6 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      
      -- Format: KE-ABC123 (country prefix + 6 chars)
      new_code := prefix || '-' || new_code;
      
      SELECT EXISTS(SELECT 1 FROM public.businesses WHERE business_code = new_code) INTO code_exists;
      
      IF NOT code_exists THEN
        NEW.business_code := new_code;
        EXIT;
      END IF;
      
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique business code after % attempts', max_attempts;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update search_businesses to accept country filter
CREATE OR REPLACE FUNCTION public.search_businesses(_query text DEFAULT ''::text, _limit integer DEFAULT 20, _offset integer DEFAULT 0, _country_code text DEFAULT ''::text)
 RETURNS TABLE(id uuid, name text, business_type text, address text, contact text, email text, logo_url text, business_code text, products_description text, country_code text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.id, b.name, b.business_type, b.address, b.contact, b.email, b.logo_url, b.business_code, b.products_description, b.country_code
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
  ORDER BY 
    CASE WHEN _country_code != '' AND b.country_code = _country_code THEN 0 ELSE 1 END,
    b.name ASC
  LIMIT _limit OFFSET _offset;
$function$;
