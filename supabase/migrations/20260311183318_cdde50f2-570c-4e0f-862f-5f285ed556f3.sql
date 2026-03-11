
-- Fix business_memberships SELECT policies: change from RESTRICTIVE to PERMISSIVE
-- so members can see ALL members of their business (not just their own record)

DROP POLICY IF EXISTS "Members can view business memberships" ON public.business_memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.business_memberships;

-- Recreate as PERMISSIVE (default) so either condition allows access
CREATE POLICY "Members can view business memberships"
  ON public.business_memberships FOR SELECT
  TO public
  USING (is_business_member(auth.uid(), business_id));

CREATE POLICY "Users can view own memberships"
  ON public.business_memberships FOR SELECT
  TO public
  USING (user_id = auth.uid());
