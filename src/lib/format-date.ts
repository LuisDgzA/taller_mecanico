const TZ = "America/Mexico_City";

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("es-MX", {
    timeZone: TZ,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDateLong(dateString: string) {
  return new Date(dateString).toLocaleString("es-MX", {
    timeZone: TZ,
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function nowFormatted() {
  return new Date().toLocaleString("es-MX", {
    timeZone: TZ,
    dateStyle: "long",
    timeStyle: "short",
  });
}
