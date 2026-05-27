export function getRedirectTarget(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export function buildActionRedirect(
  basePath: string,
  options: { error?: string; success?: string },
) {
  const searchParams = new URLSearchParams();

  if (options.error) {
    searchParams.set("error", options.error);
  }

  if (options.success) {
    searchParams.set("success", options.success);
  }

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}
