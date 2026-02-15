
-- Create role enum
CREATE TYPE public.business_role AS ENUM ('owner', 'admin', 'worker');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  total_capital NUMERIC NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Business memberships
CREATE TABLE public.business_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role business_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;

-- Invite codes
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Stock items
CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  wholesale_price NUMERIC NOT NULL DEFAULT 0,
  retail_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Sales
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  recorded_by TEXT NOT NULL DEFAULT '',
  from_order_id UUID,
  from_order_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Sale items
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  price_type TEXT NOT NULL DEFAULT 'retail',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT NOT NULL DEFAULT '',
  recorded_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Purchase items
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'my_order',
  customer_name TEXT NOT NULL DEFAULT '',
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  code TEXT NOT NULL,
  transferred_to_sale BOOLEAN NOT NULL DEFAULT false,
  sharing_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  price_type TEXT NOT NULL DEFAULT 'retail',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cost NUMERIC NOT NULL DEFAULT 0,
  customer_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Shared orders (inter-business)
CREATE TABLE public.shared_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  to_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sharing_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_orders ENABLE ROW LEVEL SECURITY;

-- Helper functions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_business_member(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = _user_id AND business_id = _business_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_business(_user_id UUID, _business_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.business_memberships
  WHERE user_id = _user_id AND business_id = _business_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = _user_id AND business_id = _business_id AND role IN ('owner', 'admin')
  );
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Businesses
CREATE POLICY "Members can view business" ON public.businesses FOR SELECT USING (public.is_business_member(auth.uid(), id));
CREATE POLICY "Users can create business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner/admin can update business" ON public.businesses FOR UPDATE USING (public.is_owner_or_admin(auth.uid(), id));
CREATE POLICY "Owner can delete business" ON public.businesses FOR DELETE USING (public.get_user_role_in_business(auth.uid(), id) = 'owner');

-- Business memberships
CREATE POLICY "Users can view own memberships" ON public.business_memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Members can view business memberships" ON public.business_memberships FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner/admin can add members" ON public.business_memberships FOR INSERT WITH CHECK (
  public.is_owner_or_admin(auth.uid(), business_id) OR (user_id = auth.uid() AND role = 'owner')
);
CREATE POLICY "Owner/admin can remove members" ON public.business_memberships FOR DELETE USING (
  public.is_owner_or_admin(auth.uid(), business_id) OR user_id = auth.uid()
);

-- Invite codes
CREATE POLICY "Owner/admin can create invite codes" ON public.invite_codes FOR INSERT WITH CHECK (
  public.is_owner_or_admin(auth.uid(), business_id)
);
CREATE POLICY "Owner/admin can view invite codes" ON public.invite_codes FOR SELECT USING (
  public.is_owner_or_admin(auth.uid(), business_id)
);

-- Stock items
CREATE POLICY "Members can view stock" ON public.stock_items FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add stock" ON public.stock_items FOR INSERT WITH CHECK (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update stock" ON public.stock_items FOR UPDATE USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete stock" ON public.stock_items FOR DELETE USING (public.is_owner_or_admin(auth.uid(), business_id));

-- Sales
CREATE POLICY "Members can view sales" ON public.sales FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add sales" ON public.sales FOR INSERT WITH CHECK (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update sales" ON public.sales FOR UPDATE USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete sales" ON public.sales FOR DELETE USING (public.is_owner_or_admin(auth.uid(), business_id));

-- Sale items
CREATE POLICY "Members can view sale items" ON public.sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.is_business_member(auth.uid(), s.business_id))
);
CREATE POLICY "Members can add sale items" ON public.sale_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.is_business_member(auth.uid(), s.business_id))
);

-- Purchase items
CREATE POLICY "Members can view purchase items" ON public.purchase_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND public.is_business_member(auth.uid(), p.business_id))
);
CREATE POLICY "Members can add purchase items" ON public.purchase_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND public.is_business_member(auth.uid(), p.business_id))
);

-- Purchases
CREATE POLICY "Members can view purchases" ON public.purchases FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add purchases" ON public.purchases FOR INSERT WITH CHECK (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update purchases" ON public.purchases FOR UPDATE USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete purchases" ON public.purchases FOR DELETE USING (public.is_owner_or_admin(auth.uid(), business_id));

-- Orders
CREATE POLICY "Members can view orders" ON public.orders FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add orders" ON public.orders FOR INSERT WITH CHECK (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update orders" ON public.orders FOR UPDATE USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete orders" ON public.orders FOR DELETE USING (public.is_owner_or_admin(auth.uid(), business_id));

-- Order items
CREATE POLICY "Members can view order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_business_member(auth.uid(), o.business_id))
);
CREATE POLICY "Members can add order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_business_member(auth.uid(), o.business_id))
);
CREATE POLICY "Members can update order items" ON public.order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_business_member(auth.uid(), o.business_id))
);

-- Services
CREATE POLICY "Members can view services" ON public.services FOR SELECT USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can add services" ON public.services FOR INSERT WITH CHECK (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Members can update services" ON public.services FOR UPDATE USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Owner can delete services" ON public.services FOR DELETE USING (public.is_owner_or_admin(auth.uid(), business_id));

-- Shared orders
CREATE POLICY "Members can view shared orders" ON public.shared_orders FOR SELECT USING (
  public.is_business_member(auth.uid(), from_business_id) OR public.is_business_member(auth.uid(), to_business_id)
);
CREATE POLICY "Members can share orders" ON public.shared_orders FOR INSERT WITH CHECK (
  public.is_business_member(auth.uid(), from_business_id)
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;

-- Auto-add owner as member when business created
CREATE OR REPLACE FUNCTION public.handle_new_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_memberships (user_id, business_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_business();
