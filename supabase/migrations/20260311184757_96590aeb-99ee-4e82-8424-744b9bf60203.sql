CREATE OR REPLACE FUNCTION public.get_business_members(_business_id uuid)
RETURNS TABLE (
  user_id uuid,
  role public.business_role,
  full_name text,
  email text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bm.user_id,
    bm.role,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(p.email, '') AS email,
    bm.created_at
  FROM public.business_memberships bm
  LEFT JOIN public.profiles p
    ON p.id = bm.user_id
  WHERE bm.business_id = _business_id
    AND public.is_business_member(auth.uid(), _business_id)
  ORDER BY
    CASE bm.role
      WHEN 'owner' THEN 0
      WHEN 'admin' THEN 1
      ELSE 2
    END,
    bm.created_at ASC;
$$;