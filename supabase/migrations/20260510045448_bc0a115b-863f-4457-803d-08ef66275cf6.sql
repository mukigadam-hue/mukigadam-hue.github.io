CREATE OR REPLACE FUNCTION public.verify_receipt(_type text, _id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  biz record;
  items jsonb;
BEGIN
  IF _type = 'sale' THEN
    SELECT s.*, b.name AS biz_name, b.logo_url, b.contact AS biz_contact, b.address AS biz_address,
           b.email AS biz_email, b.business_code, b.currency_symbol
      INTO biz
      FROM public.sales s JOIN public.businesses b ON b.id = s.business_id
      WHERE s.id = _id AND s.deleted_at IS NULL;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('item_name', si.item_name, 'category', si.category,
      'quality', si.quality, 'quantity', si.quantity, 'unit_price', si.unit_price,
      'subtotal', si.subtotal, 'price_type', si.price_type) ORDER BY si.created_at), '[]'::jsonb)
      INTO items FROM public.sale_items si WHERE si.sale_id = _id;
    result := jsonb_build_object(
      'type','sale','id', biz.id,'date', biz.created_at,'customer_name', biz.customer_name,
      'grand_total', biz.grand_total,'amount_paid', biz.amount_paid,'balance', biz.balance,
      'payment_status', biz.payment_status,'recorded_by', biz.recorded_by,
      'items', items);
  ELSIF _type = 'purchase' THEN
    SELECT p.*, b.name AS biz_name, b.logo_url, b.contact AS biz_contact, b.address AS biz_address,
           b.email AS biz_email, b.business_code, b.currency_symbol
      INTO biz
      FROM public.purchases p JOIN public.businesses b ON b.id = p.business_id
      WHERE p.id = _id AND p.deleted_at IS NULL;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('item_name', pi.item_name, 'category', pi.category,
      'quality', pi.quality, 'quantity', pi.quantity, 'unit_price', pi.unit_price,
      'subtotal', pi.subtotal) ORDER BY pi.created_at), '[]'::jsonb)
      INTO items FROM public.purchase_items pi WHERE pi.purchase_id = _id;
    result := jsonb_build_object(
      'type','purchase','id', biz.id,'date', biz.created_at,'customer_name', biz.supplier,
      'grand_total', biz.grand_total,'amount_paid', biz.amount_paid,'balance', biz.balance,
      'payment_status', biz.payment_status,'recorded_by', biz.recorded_by,
      'items', items);
  ELSIF _type = 'order' THEN
    SELECT o.*, b.name AS biz_name, b.logo_url, b.contact AS biz_contact, b.address AS biz_address,
           b.email AS biz_email, b.business_code, b.currency_symbol
      INTO biz
      FROM public.orders o JOIN public.businesses b ON b.id = o.business_id
      WHERE o.id = _id AND o.deleted_at IS NULL;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('item_name', oi.item_name, 'category', oi.category,
      'quality', oi.quality, 'quantity', oi.quantity, 'unit_price', oi.unit_price,
      'subtotal', oi.subtotal, 'price_type', oi.price_type) ORDER BY oi.created_at), '[]'::jsonb)
      INTO items FROM public.order_items oi WHERE oi.order_id = _id;
    result := jsonb_build_object(
      'type','order','id', biz.id,'date', biz.created_at,'customer_name', biz.customer_name,
      'grand_total', biz.grand_total,'amount_paid', biz.amount_paid,'balance', biz.balance,
      'payment_status', biz.payment_status,'code', biz.code,
      'items', items);
  ELSIF _type = 'service' THEN
    SELECT s.*, b.name AS biz_name, b.logo_url, b.contact AS biz_contact, b.address AS biz_address,
           b.email AS biz_email, b.business_code, b.currency_symbol
      INTO biz
      FROM public.services s JOIN public.businesses b ON b.id = s.business_id
      WHERE s.id = _id AND s.deleted_at IS NULL;
    IF NOT FOUND THEN RETURN NULL; END IF;
    items := jsonb_build_array(jsonb_build_object('item_name', biz.service_name,
      'category','Service','quality', biz.description,'quantity',1,
      'unit_price', biz.cost,'subtotal', biz.cost));
    result := jsonb_build_object(
      'type','service','id', biz.id,'date', biz.created_at,'customer_name', biz.customer_name,
      'grand_total', biz.cost,'amount_paid', biz.amount_paid,'balance', biz.balance,
      'payment_status', biz.payment_status,'recorded_by', biz.seller_name,
      'items', items);
  ELSIF _type = 'booking' THEN
    SELECT pb.*, b.name AS biz_name, b.logo_url, b.contact AS biz_contact, b.address AS biz_address,
           b.email AS biz_email, b.business_code, b.currency_symbol,
           a.name AS asset_name, a.category AS asset_category
      INTO biz
      FROM public.property_bookings pb
      JOIN public.businesses b ON b.id = pb.business_id
      LEFT JOIN public.property_assets a ON a.id = pb.asset_id
      WHERE pb.id = _id AND pb.deleted_at IS NULL;
    IF NOT FOUND THEN RETURN NULL; END IF;
    items := jsonb_build_array(jsonb_build_object('item_name', COALESCE(biz.asset_name,'Asset Rental'),
      'category', COALESCE(biz.asset_category,'rental'),'quality','','quantity',1,
      'unit_price', biz.total_price,'subtotal', biz.total_price));
    result := jsonb_build_object(
      'type','booking','id', biz.id,'date', biz.created_at,'customer_name', biz.renter_name,
      'grand_total', biz.total_price,'amount_paid', biz.amount_paid,
      'balance', GREATEST(biz.total_price - biz.amount_paid, 0),
      'payment_status', biz.payment_status,
      'items', items);
  ELSIF _type = 'archive' THEN
    SELECT r.*, b.name AS biz_name, b.logo_url, b.contact AS biz_contact, b.address AS biz_address,
           b.email AS biz_email, b.business_code, b.currency_symbol
      INTO biz
      FROM public.receipts r JOIN public.businesses b ON b.id = r.business_id
      WHERE r.id = _id;
    IF NOT FOUND THEN RETURN NULL; END IF;
    result := jsonb_build_object(
      'type','archive','id', biz.id,'date', biz.created_at,'customer_name', biz.buyer_name,
      'grand_total', biz.grand_total,'amount_paid', biz.grand_total,'balance', 0,
      'payment_status','paid','recorded_by', biz.seller_name,'code', biz.code,
      'items', biz.items);
  ELSE
    RETURN NULL;
  END IF;

  result := result || jsonb_build_object(
    'business', jsonb_build_object(
      'name', biz.biz_name,'logo_url', biz.logo_url,'contact', biz.biz_contact,
      'address', biz.biz_address,'email', biz.biz_email,'business_code', biz.business_code,
      'currency_symbol', biz.currency_symbol));
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_receipt(text, uuid) TO anon, authenticated;