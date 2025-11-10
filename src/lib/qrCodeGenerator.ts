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
} | null {
  try {
    const decoded = atob(qrCode);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Invalid QR code data:", error);
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
