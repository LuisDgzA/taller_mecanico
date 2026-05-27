import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

export const getOptionalUser = cache(async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerComponentClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
});
