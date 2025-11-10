import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import { generateQRCodeImage } from "@/lib/qrCodeGenerator";

interface GuestQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  qrCode: string;
}

export function GuestQRCode({ open, onOpenChange, guestName, qrCode }: GuestQRCodeProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open && qrCode) {
      generateQRImage();
    }
  }, [open, qrCode]);

  const generateQRImage = async () => {
    setIsGenerating(true);
    try {
      const imageUrl = await generateQRCodeImage(qrCode);
      setQrCodeImage(imageUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = `qrcode-${guestName.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code - {guestName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center p-6 bg-white rounded-lg">
            {isGenerating ? (
              <div className="w-[300px] h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : qrCodeImage ? (
              <img src={qrCodeImage} alt={`QR Code para ${guestName}`} className="w-[300px] h-[300px]" />
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center text-muted-foreground">
                Erro ao gerar QR Code
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground text-center">
            Este QR code é único para {guestName}. Use-o para fazer check-in no evento.
          </div>

          <Button onClick={handleDownload} className="w-full" disabled={isGenerating || !qrCodeImage}>
            <Download className="mr-2 h-4 w-4" />
            Baixar QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
