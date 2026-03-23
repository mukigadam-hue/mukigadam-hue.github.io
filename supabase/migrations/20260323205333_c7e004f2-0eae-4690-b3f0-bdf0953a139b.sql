-- Auto-grant premium to CEO accounts when their profile is created
CREATE OR REPLACE FUNCTION public.auto_grant_ceo_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email IN ('ndamson8@gmail.com', 'mukigadam@gmail.com') THEN
    NEW.is_premium := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_grant_ceo_premium_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_ceo_premium();