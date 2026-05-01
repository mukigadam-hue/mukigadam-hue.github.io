
-- Add payment tracking columns to sales and purchases (orders/bookings already have them)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid';

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid';

-- Backfill: existing rows treated as fully paid
UPDATE public.sales SET amount_paid = grand_total, balance = 0, payment_status = 'paid'
  WHERE amount_paid = 0 AND balance = 0;
UPDATE public.purchases SET amount_paid = grand_total, balance = 0, payment_status = 'paid'
  WHERE amount_paid = 0 AND balance = 0;

-- Invoice payments log (full payment history)
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('sale','purchase','order','booking')),
  source_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  proof_url text,
  recorded_by text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_source ON public.invoice_payments(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_business ON public.invoice_payments(business_id);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invoice payments"
  ON public.invoice_payments FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Members can add invoice payments"
  ON public.invoice_payments FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid(), business_id));

CREATE POLICY "Owner/admin can update invoice payments"
  ON public.invoice_payments FOR UPDATE TO authenticated
  USING (public.is_owner_or_admin(auth.uid(), business_id));

CREATE POLICY "Owner/admin can delete invoice payments"
  ON public.invoice_payments FOR DELETE TO authenticated
  USING (public.is_owner_or_admin(auth.uid(), business_id));

-- Recompute parent record from payments
CREATE OR REPLACE FUNCTION public.recompute_invoice_status(_source_type text, _source_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid numeric := 0;
  grand numeric := 0;
  new_status text;
  new_balance numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.invoice_payments
  WHERE source_type = _source_type AND source_id = _source_id;

  IF _source_type = 'sale' THEN
    SELECT grand_total INTO grand FROM public.sales WHERE id = _source_id;
  ELSIF _source_type = 'purchase' THEN
    SELECT grand_total INTO grand FROM public.purchases WHERE id = _source_id;
  ELSIF _source_type = 'order' THEN
    SELECT grand_total INTO grand FROM public.orders WHERE id = _source_id;
  ELSIF _source_type = 'booking' THEN
    SELECT total_price INTO grand FROM public.property_bookings WHERE id = _source_id;
  END IF;

  IF grand IS NULL THEN RETURN; END IF;
  new_balance := GREATEST(grand - total_paid, 0);

  IF total_paid <= 0 THEN new_status := 'unpaid';
  ELSIF total_paid >= grand THEN new_status := 'paid';
  ELSE new_status := 'partial';
  END IF;

  IF _source_type = 'sale' THEN
    UPDATE public.sales SET amount_paid = total_paid, balance = new_balance, payment_status = new_status WHERE id = _source_id;
  ELSIF _source_type = 'purchase' THEN
    UPDATE public.purchases SET amount_paid = total_paid, balance = new_balance, payment_status = new_status WHERE id = _source_id;
  ELSIF _source_type = 'order' THEN
    UPDATE public.orders SET amount_paid = total_paid, balance = new_balance, payment_status = new_status WHERE id = _source_id;
  ELSIF _source_type = 'booking' THEN
    UPDATE public.property_bookings SET amount_paid = total_paid, payment_status = new_status WHERE id = _source_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_invoice_payments_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_invoice_status(OLD.source_type, OLD.source_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_invoice_status(NEW.source_type, NEW.source_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_payments_recompute ON public.invoice_payments;
CREATE TRIGGER trg_invoice_payments_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
FOR EACH ROW EXECUTE FUNCTION public.tg_invoice_payments_recompute();
