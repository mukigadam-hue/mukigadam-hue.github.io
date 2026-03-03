
-- Create service_items table to track stock items used in services
CREATE TABLE public.service_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  quality TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view service items"
ON public.service_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.id = service_items.service_id
  AND is_business_member(auth.uid(), s.business_id)
));

CREATE POLICY "Members can add service items"
ON public.service_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.id = service_items.service_id
  AND is_business_member(auth.uid(), s.business_id)
));

CREATE POLICY "Members can delete service items"
ON public.service_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.id = service_items.service_id
  AND is_business_member(auth.uid(), s.business_id)
));
