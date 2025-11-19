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
} | null {
  try {
    console.log("🔍 [QR Debug] Parsing QR code:", qrCode.substring(0, 50) + "...");
    const decoded = atob(qrCode);
    console.log("🔍 [QR Debug] Decoded data:", decoded);
    const parsed = JSON.parse(decoded);
    console.log("🔍 [QR Debug] Parsed result:", parsed);
    return parsed;
  } catch (error) {
    console.error("❌ [QR Debug] Failed to parse QR code:", error);
    console.error("❌ [QR Debug] QR code value:", qrCode);
    return null;
  }
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
