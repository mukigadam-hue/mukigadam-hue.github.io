
-- Drop the old overloaded versions that cause ambiguity
DROP FUNCTION IF EXISTS public.search_businesses(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_businesses(text, integer, integer, text);
