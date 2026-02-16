
-- Add type column to invite_codes to distinguish worker vs customer invites
ALTER TABLE public.invite_codes ADD COLUMN type text NOT NULL DEFAULT 'worker';

-- Create business_customers table
CREATE TABLE public.business_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;

-- Members can view customers of their business
CREATE POLICY "Members can view business customers"
  ON public.business_customers FOR SELECT
  USING (is_business_member(auth.uid(), business_id));

-- Owner/admin can add customers
CREATE POLICY "Owner/admin can add customers"
  ON public.business_customers FOR INSERT
  WITH CHECK (is_business_member(auth.uid(), business_id));

-- Owner/admin can remove customers
CREATE POLICY "Owner/admin can remove customers"
  ON public.business_customers FOR DELETE
  USING (is_owner_or_admin(auth.uid(), business_id));

-- Owner/admin can update customers
CREATE POLICY "Owner/admin can update customers"
  ON public.business_customers FOR UPDATE
  USING (is_owner_or_admin(auth.uid(), business_id));
