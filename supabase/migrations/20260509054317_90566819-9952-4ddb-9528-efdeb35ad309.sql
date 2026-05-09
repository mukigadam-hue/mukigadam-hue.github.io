
-- RPCs to securely set/reset the settings password on businesses.settings_password.
-- Avoids relying on a non-existent business_secrets table.

CREATE OR REPLACE FUNCTION public.set_settings_password(_business_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner_or_admin(auth.uid(), _business_id) THEN
    RAISE EXCEPTION 'Only owner or admin can change the settings password';
  END IF;

  UPDATE public.businesses
     SET settings_password = NULLIF(_password, '')
   WHERE id = _business_id;

  RETURN true;
END;
$$;

-- Reset by knowing the business code (visible only to members in the app).
-- Allows recovery if the settings password is forgotten.
CREATE OR REPLACE FUNCTION public.reset_settings_password_with_code(
  _business_id uuid,
  _business_code text,
  _new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_code text;
BEGIN
  IF NOT public.is_business_member(auth.uid(), _business_id) THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  SELECT business_code INTO stored_code
    FROM public.businesses
   WHERE id = _business_id;

  IF stored_code IS NULL OR upper(trim(stored_code)) <> upper(trim(_business_code)) THEN
    RETURN false;
  END IF;

  UPDATE public.businesses
     SET settings_password = NULLIF(_new_password, '')
   WHERE id = _business_id;

  RETURN true;
END;
$$;
