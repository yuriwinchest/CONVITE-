import QRCode from "qrcode";

export function generateQRCodeData(guestId: string, eventId: string): string {
  // Create a unique identifier combining guest and event
  const qrData = JSON.stringify({
    guestId,
    eventId,
    timestamp: Date.now(),
  });

  return btoa(qrData); // Base64 encode for security
}

export function parseQRCodeData(qrCode: string): {
  guestId: string;
  eventId: string;
  timestamp: number;
  isLegacyFormat?: boolean;
} | null {
  console.log("🔍 [parseQRCodeData] Attempting to parse QR code:", qrCode.substring(0, 50) + "...");

  // Tentativa 1: Formato novo (JSON Base64)
  try {
    const decoded = atob(qrCode);
    console.log("✅ [parseQRCodeData] Successfully decoded as Base64:", decoded);
    const parsed = JSON.parse(decoded);

    if (parsed.guestId && parsed.eventId) {
      console.log("✅ [parseQRCodeData] New format detected with guestId and eventId");
      return parsed;
    }
  } catch (e) {
    console.log("⚠️ [parseQRCodeData] Not a Base64 JSON format, trying legacy format...");
  }

  // Tentativa 2: UUID direto (formato antigo)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(qrCode.trim())) {
    console.log("✅ [parseQRCodeData] Legacy UUID format detected:", qrCode.trim());
    return {
      guestId: qrCode.trim(),
      eventId: "", // Will be filled by context or database lookup
      timestamp: Date.now(),
      isLegacyFormat: true,
    } as any;
  }

  console.error("❌ [parseQRCodeData] QR code format not recognized");
  return null;
}

export async function generateQRCodeImage(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

export function generateUniqueQRCode(): string {
  return crypto.randomUUID();
}
