export function getRedirectTarget(formData: FormData, fallback: string) {
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  return redirectTo || fallback;
}

export function buildActionRedirect(
  basePath: string,
  options: { error?: string; success?: string },
) {
  const qIdx = basePath.indexOf("?");
  const path = qIdx === -1 ? basePath : basePath.slice(0, qIdx);
  const existing = qIdx === -1 ? "" : basePath.slice(qIdx + 1);
  const searchParams = new URLSearchParams(existing);

  if (options.error) {
    searchParams.set("error", options.error);
  }

  if (options.success) {
    searchParams.set("success", options.success);
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}
