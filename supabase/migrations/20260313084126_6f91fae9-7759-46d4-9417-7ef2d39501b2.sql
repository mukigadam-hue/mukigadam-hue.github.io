
-- Add room support to property_assets
ALTER TABLE public.property_assets ADD COLUMN IF NOT EXISTS total_rooms integer NOT NULL DEFAULT 0;
ALTER TABLE public.property_assets ADD COLUMN IF NOT EXISTS room_size text NOT NULL DEFAULT '';

-- Add booking_type and proof_url to property_bookings
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'online';
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS proof_url text;

-- Create property_complaints table
CREATE TABLE IF NOT EXISTS public.property_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.property_bookings(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES public.property_assets(id) NOT NULL,
  business_id uuid REFERENCES public.businesses(id) NOT NULL,
  renter_id uuid NOT NULL,
  renter_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  owner_response text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.property_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view complaints" ON public.property_complaints FOR SELECT TO public USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Renters can view own complaints" ON public.property_complaints FOR SELECT TO authenticated USING (renter_id = auth.uid());
CREATE POLICY "Renters can create complaints" ON public.property_complaints FOR INSERT TO authenticated WITH CHECK (renter_id = auth.uid());
CREATE POLICY "Members can update complaints" ON public.property_complaints FOR UPDATE TO public USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete complaints" ON public.property_complaints FOR DELETE TO public USING (is_owner_or_admin(auth.uid(), business_id));

-- Recreate search function with new columns
CREATE FUNCTION public.search_property_assets(
  _query text DEFAULT '',
  _category text DEFAULT '',
  _location text DEFAULT '',
  _min_price numeric DEFAULT 0,
  _max_price numeric DEFAULT 999999999,
  _start_date timestamptz DEFAULT NULL,
  _end_date timestamptz DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, business_id uuid, name text, description text, category text, sub_category text,
  location text, area_size numeric, area_unit text, hourly_price numeric, daily_price numeric,
  monthly_price numeric, image_url_1 text, owner_name text, owner_contact text, features text,
  business_name text, business_contact text, total_rooms integer, room_size text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.id, a.business_id, a.name, a.description, a.category, a.sub_category,
    a.location, a.area_size, a.area_unit, a.hourly_price, a.daily_price,
    a.monthly_price, a.image_url_1, a.owner_name, a.owner_contact, a.features,
    b.name AS business_name, b.contact AS business_contact,
    a.total_rooms, a.room_size
  FROM public.property_assets a
  JOIN public.businesses b ON b.id = a.business_id
  WHERE a.is_available = true AND a.deleted_at IS NULL
    AND (_category = '' OR a.category = _category)
    AND (_location = '' OR a.location ILIKE '%' || _location || '%')
    AND (a.daily_price >= _min_price)
    AND (a.daily_price <= _max_price OR _max_price = 999999999)
    AND (_query = '' OR a.name ILIKE '%' || _query || '%' OR a.description ILIKE '%' || _query || '%' OR a.location ILIKE '%' || _query || '%')
    AND (
      _start_date IS NULL OR _end_date IS NULL OR
      NOT EXISTS (
        SELECT 1 FROM public.property_bookings pb
        WHERE pb.asset_id = a.id AND pb.status IN ('confirmed', 'active')
          AND pb.start_date < _end_date AND pb.end_date > _start_date
      )
    )
  ORDER BY a.created_at DESC
  LIMIT _limit OFFSET _offset;
$$;
