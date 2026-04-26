-- Add missing RLS policies so owners/admins can clean up child rows
-- when permanently deleting parent records (stock items, sales, purchases).
-- Without these policies, the cascade nullification/deletion in
-- permanentDeleteRecord() fails silently, leaving FK constraints in place
-- and blocking the parent DELETE.

-- sale_items: allow owners/admins to update/delete (needed when permanently
-- removing a stock item or sale).
CREATE POLICY "Owner/admin can update sale items"
ON public.sale_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_items.sale_id
      AND public.is_owner_or_admin(auth.uid(), s.business_id)
  )
);

CREATE POLICY "Owner/admin can delete sale items"
ON public.sale_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_items.sale_id
      AND public.is_owner_or_admin(auth.uid(), s.business_id)
  )
);

-- service_items: same — needed for stock_item permanent delete.
CREATE POLICY "Owner/admin can update service items"
ON public.service_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_items.service_id
      AND public.is_owner_or_admin(auth.uid(), s.business_id)
  )
);

-- purchase_items: needed when permanently deleting a purchase.
CREATE POLICY "Owner/admin can delete purchase items"
ON public.purchase_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_items.purchase_id
      AND public.is_owner_or_admin(auth.uid(), p.business_id)
  )
);

CREATE POLICY "Owner/admin can update purchase items"
ON public.purchase_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_items.purchase_id
      AND public.is_owner_or_admin(auth.uid(), p.business_id)
  )
);