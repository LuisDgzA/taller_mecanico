type CloudflareImagesUploadResponse = {
  success: boolean;
  result?: {
    variants?: string[];
  };
};

export async function uploadCloudflareImage(file: File): Promise<string> {
  const accountId = process.env.ACCOUNT_IDENTIFIER;
  const apiToken = process.env.KEY_CLOUDFLARE;

  if (!accountId || !apiToken) {
    throw new Error("Falta la configuración de Cloudflare Images.");
  }

  const formData = new FormData();
  formData.set("file", file, file.name);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}` },
      body: formData,
    },
  );
  const payload = (await response.json()) as CloudflareImagesUploadResponse;

  if (!response.ok || !payload.success) {
    throw new Error("Cloudflare Images rechazó la carga.");
  }

  const variants = payload.result?.variants ?? [];
  const imageUrl = variants.find((url) => url.endsWith("/original"))
    ?? variants.find((url) => url.endsWith("/public"))
    ?? variants[0];

  if (!imageUrl) {
    throw new Error("Cloudflare Images no devolvió una URL para la imagen.");
  }

  return imageUrl;
}