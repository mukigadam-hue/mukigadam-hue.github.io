-- Business team members table (for tracking workers with salary info)
CREATE TABLE public.business_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  rank TEXT NOT NULL DEFAULT 'worker',
  salary NUMERIC NOT NULL DEFAULT 0,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_payment_due DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business worker payments table
CREATE TABLE public.business_worker_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.business_team_members(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_due NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  advance_deducted NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business worker advances table
CREATE TABLE public.business_worker_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.business_team_members(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC NOT NULL DEFAULT 0,
  date_given DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_worker_advances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_team_members
CREATE POLICY "Members can view" ON public.business_team_members FOR SELECT USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add" ON public.business_team_members FOR INSERT WITH CHECK (is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update" ON public.business_team_members FOR UPDATE USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete" ON public.business_team_members FOR DELETE USING (is_owner_or_admin(auth.uid(), business_id));

-- RLS Policies for business_worker_payments
CREATE POLICY "Members can view" ON public.business_worker_payments FOR SELECT USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add" ON public.business_worker_payments FOR INSERT WITH CHECK (is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update" ON public.business_worker_payments FOR UPDATE USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete" ON public.business_worker_payments FOR DELETE USING (is_owner_or_admin(auth.uid(), business_id));

-- RLS Policies for business_worker_advances
CREATE POLICY "Members can view" ON public.business_worker_advances FOR SELECT USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add" ON public.business_worker_advances FOR INSERT WITH CHECK (is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update" ON public.business_worker_advances FOR UPDATE USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete" ON public.business_worker_advances FOR DELETE USING (is_owner_or_admin(auth.uid(), business_id));