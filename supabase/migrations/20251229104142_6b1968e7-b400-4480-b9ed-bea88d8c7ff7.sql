-- Update is_household_member with NULL validation
CREATE OR REPLACE FUNCTION public.is_household_member(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false if either parameter is NULL
  IF _user_id IS NULL OR _household_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND household_id = _household_id
  );
END;
$$;

-- Update get_user_household with NULL validation
CREATE OR REPLACE FUNCTION public.get_user_household(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return NULL if parameter is NULL
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN (SELECT household_id FROM public.profiles WHERE id = _user_id);
END;
$$;

-- Update has_role with NULL validation
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false if either parameter is NULL
  IF _user_id IS NULL OR _role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;