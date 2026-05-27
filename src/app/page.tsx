import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const user = await getOptionalUser();

  redirect(user ? "/dashboard" : "/login");
}
