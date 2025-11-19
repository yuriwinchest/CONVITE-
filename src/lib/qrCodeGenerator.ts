import QRCode from "qrcode";

export function generateQRCodeData(guestId: string, eventId: string): string {
  // Create a unique identifier combining guest and event
  const qrData = JSON.stringify({
    guestId,
    eventId,
    timestamp: Date.now(),
  });
  
  console.log("🔧 [QR Debug] Generating QR code data:", { guestId, eventId });
  console.log("🔧 [QR Debug] JSON stringified:", qrData);
  
  const encoded = btoa(qrData);
  console.log("🔧 [QR Debug] Base64 encoded:", encoded.substring(0, 50) + "...");
  
  return encoded; // Base64 encode for security
}

export function parseQRCodeData(qrCode: string): {
  guestId: string;
  eventId: string;
  timestamp: number;
  isLegacyFormat?: boolean;
} | null {
  console.log("🔍 [QR Debug] Parsing QR code:", qrCode.substring(0, 50) + "...");
  
  // Tentativa 1: Formato novo (JSON Base64)
  try {
    const decoded = atob(qrCode);
    console.log("🔍 [QR Debug] Decoded as Base64:", decoded);
    const parsed = JSON.parse(decoded);
    if (parsed.guestId && parsed.eventId) {
      console.log("✅ [QR Debug] Formato novo (Base64 JSON) detectado");
      return parsed;
    }
  } catch (e) {
    console.log("⚠️ [QR Debug] Não é formato novo Base64");
  }
  
  // Tentativa 2: UUID direto (formato antigo)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(qrCode.trim())) {
    console.log("✅ [QR Debug] Formato antigo (UUID direto) detectado:", qrCode.trim());
    return {
      guestId: qrCode.trim(),
      eventId: "", // Será preenchido pelo contexto
      timestamp: Date.now(),
      isLegacyFormat: true,
    };
  }
  
  console.error("❌ [QR Debug] Formato de QR não reconhecido");
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
