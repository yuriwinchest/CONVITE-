import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode, Share2 } from "lucide-react";
import { generateQRCodeData, generateQRCodeImage } from "@/lib/qrCodeGenerator";
import { toast } from "@/hooks/use-toast";
import { Guest } from "@/hooks/useGuests";

interface GuestQRCodeDialogProps {
  guest: Guest | null;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestQRCodeDialog({ guest, eventName, open, onOpenChange }: GuestQRCodeDialogProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!guest) return;
      
      try {
        setIsLoading(true);
        
        // Gerar dados do QR Code com informações do convidado
        const qrData = generateQRCodeData(guest.id, guest.event_id);
        const image = await generateQRCodeImage(qrData);
        setQrCodeImage(image);
      } catch (error) {
        console.error("Erro ao gerar QR Code:", error);
        toast({
          title: "Erro ao gerar QR Code",
          description: "Não foi possível gerar o QR Code do convidado.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open && guest) {
      generateQRCode();
    }
  }, [guest, open]);

  const handleDownload = () => {
    if (!qrCodeImage || !guest) return;

    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = `qrcode-${guest.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code baixado!",
      description: "O QR Code foi salvo em seus downloads.",
    });
  };

  const handlePrint = () => {
    if (!qrCodeImage || !guest) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível abrir a janela de impressão.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${guest.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            .event-name {
              font-size: 24px;
              margin-bottom: 8px;
              color: #666;
            }
            h1 {
              font-size: 32px;
              margin-bottom: 16px;
              color: #1a1a1a;
            }
            .table-info {
              font-size: 20px;
              color: #666;
              margin-bottom: 24px;
            }
            p {
              font-size: 16px;
              color: #999;
              margin-bottom: 32px;
            }
            img {
              max-width: 350px;
              height: auto;
              border: 4px solid #e5e5e5;
              border-radius: 8px;
              padding: 20px;
              background: white;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="event-name">${eventName}</div>
            <h1>${guest.name}</h1>
            ${guest.table_number ? `<div class="table-info">Mesa ${guest.table_number}</div>` : ''}
            <p>Escaneie este QR Code para fazer check-in no evento</p>
            <img src="${qrCodeImage}" alt="QR Code do Convidado" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleShare = async () => {
    if (!qrCodeImage || !guest) return;

    try {
      // Converter base64 para blob
      const response = await fetch(qrCodeImage);
      const blob = await response.blob();
      const file = new File([blob], `qrcode-${guest.name}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QR Code - ${guest.name}`,
          text: `QR Code de check-in para ${eventName}`,
          files: [file],
        });
        
        toast({
          title: "Compartilhado!",
          description: "QR Code compartilhado com sucesso.",
        });
      } else {
        // Fallback: copiar para área de transferência
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              
              toast({
                title: "Copiado!",
                description: "QR Code copiado para área de transferência.",
              });
            }
          });
        };
        
        img.src = qrCodeImage;
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      toast({
        title: "Erro ao compartilhar",
        description: "Use o botão de download para salvar o QR Code.",
        variant: "destructive",
      });
    }
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code do Convidado
          </DialogTitle>
          <DialogDescription>
            QR Code pessoal para check-in de {guest.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="border-4 border-border rounded-lg p-4 bg-white">
                  <img
                    src={qrCodeImage}
                    alt={`QR Code de ${guest.name}`}
                    className="w-64 h-64"
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="font-semibold text-lg">{guest.name}</p>
                  {guest.table_number && (
                    <p className="text-sm text-muted-foreground">
                      Mesa {guest.table_number}
                    </p>
                  )}
                  {guest.email && (
                    <p className="text-xs text-muted-foreground">
                      {guest.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <p className="font-semibold mb-1">💡 Como usar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Envie este QR Code para o convidado</li>
                  <li>No check-in, escaneie o QR Code com o scanner do evento</li>
                  <li>O check-in será feito automaticamente</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownload} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              <Button onClick={handlePrint} variant="outline" className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
