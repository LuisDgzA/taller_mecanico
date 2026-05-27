import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

import { getOptionalUser } from "./auth";

export type StaffProfile = {
  id: number;
  auth_id: string | null;
  nombre: string;
  correo: string;
  telefono: string | null;
  status: number;
};

export const getCurrentStaffProfile = cache(async (): Promise<StaffProfile | null> => {
  const user = await getOptionalUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from("usuarios")
    .select("id, auth_id, nombre, correo, telefono, status")
    .eq("auth_id", user.id)
    .eq("status", 1)
    .maybeSingle<StaffProfile>();

  return data ?? null;
});

export async function requireCurrentStaffProfile() {
  const staff = await getCurrentStaffProfile();

  if (!staff) {
    redirect("/login");
  }

  return staff;
}
