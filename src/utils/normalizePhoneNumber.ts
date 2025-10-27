export function normalizePhoneNumber(phone: string): string {
  // Remove any non-digit characters (like spaces, +, etc.)
  const cleaned = phone.replace(/[^\d]/g, "");

  // Handle formats
  if (cleaned.startsWith("0") && (cleaned.length === 10)) {
    return `254${cleaned.substring(1)}`; // e.g., 07xxxxxxxx -> 2547xxxxxxxx
  }

  if (cleaned.startsWith("1") && cleaned.length === 10) {
    return `254${cleaned}`; // e.g., 01xxxxxxxx -> 2541xxxxxxxx
  }

  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned; // already valid
  }

  throw new Error("Invalid phone number format");
}