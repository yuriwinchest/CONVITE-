import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode } from "lucide-react";
import { generateQRCodeImage } from "@/lib/qrCodeGenerator";
import { toast } from "@/hooks/use-toast";

interface EventQRCodeProps {
  eventId: string;
  eventName: string;
}

export function EventQRCode({ eventId, eventName }: EventQRCodeProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        const eventUrl = `${window.location.origin}/confirm/${eventId}`;
        const image = await generateQRCodeImage(eventUrl);
        setQrCodeImage(image);
      } catch (error) {
        console.error("Erro ao gerar QR Code:", error);
        toast({
          title: "Erro ao gerar QR Code",
          description: "Não foi possível gerar o QR Code do evento.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [eventId]);

  const handleDownload = () => {
    if (!qrCodeImage) return;

    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = `qrcode-${eventName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code baixado!",
      description: "O QR Code foi salvo em seus downloads.",
    });
  };

  const handlePrint = () => {
    if (!qrCodeImage) return;

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
          <title>QR Code - ${eventName}</title>
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
            h1 {
              font-size: 32px;
              margin-bottom: 16px;
              color: #1a1a1a;
            }
            p {
              font-size: 18px;
              color: #666;
              margin-bottom: 32px;
            }
            img {
              max-width: 400px;
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
            <h1>${eventName}</h1>
            <p>Escaneie este QR Code para confirmar sua presença</p>
            <img src="${qrCodeImage}" alt="QR Code do Evento" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar a imagem carregar antes de imprimir
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code do Evento
        </CardTitle>
        <CardDescription>
          Compartilhe este QR Code com seus convidados para que eles possam confirmar presença facilmente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="border-4 border-border rounded-lg p-4 bg-white">
                <img
                  src={qrCodeImage}
                  alt="QR Code do Evento"
                  className="w-64 h-64"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Os convidados devem:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Clicar em "Sou Convidado" no site</li>
                <li>Escanear este QR Code com a câmera do celular</li>
                <li>Digitar o nome para confirmar presença</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Baixar QR Code
              </Button>
              <Button onClick={handlePrint} variant="outline" className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>

            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-semibold mb-1">💡 Dica:</p>
              <p>
                Imprima este QR Code e coloque na entrada do evento ou inclua em convites físicos
                para facilitar o check-in dos convidados.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
