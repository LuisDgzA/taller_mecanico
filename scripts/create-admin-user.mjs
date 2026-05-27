import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile() {
  const envPath = path.resolve(".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((entry) => {
      const [rawKey, ...rest] = entry.split("=");
      return [rawKey.replace(/^--/, ""), rest.join("=")];
    }),
  );

  return {
    email: args.email,
    password: args.password,
    nombre: args.nombre,
    telefono: args.telefono ?? null,
  };
}

async function main() {
  loadEnvFile();

  const { email, password, nombre, telefono } = parseArgs();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  if (!email || !password || !nombre) {
    throw new Error(
      "Usage: npm run create:admin -- --email=admin@correo.com --password=TuPassword123 --nombre=\"Administrador General\" [--telefono=5550000000]",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }

  let authId = createdUser?.user?.id ?? null;

  if (!authId) {
    const { data: usersPage, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    authId =
      usersPage.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
        ?.id ?? null;
  }

  if (!authId) {
    throw new Error("Could not resolve auth user id after create/list step.");
  }

  const { error: profileError } = await supabase.from("usuarios").upsert(
    {
      auth_id: authId,
      nombre,
      correo: email,
      telefono,
      status: 1,
    },
    { onConflict: "correo" },
  );

  if (profileError) {
    throw profileError;
  }

  console.log(`Admin user ready: ${email}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
