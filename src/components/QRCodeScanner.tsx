import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CameraOff, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRCodeScannerProps {
  onScan: (qrCode: string) => Promise<void>;
  isProcessing: boolean;
  mode?: "checkin" | "event-access";
}

export function QRCodeScanner({ onScan, isProcessing, mode = "checkin" }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader";

  const startScanning = async () => {
    if (isTransitioning || isScanning) return;
    
    setIsTransitioning(true);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerDivId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Prevent duplicate scans
          if (decodedText === lastScanned) return;
          
          setLastScanned(decodedText);
          setScanResult(null);

          try {
            await onScan(decodedText);
            setScanResult({ success: true, message: "Check-in realizado com sucesso!" });
          } catch (error: any) {
            setScanResult({ success: false, message: error.message || "Erro ao realizar check-in" });
          }

          // Clear result after 3 seconds
          setTimeout(() => {
            setScanResult(null);
            setLastScanned(null);
          }, 3000);
        },
        (errorMessage) => {
          // Ignore errors from scanning (they happen frequently)
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error("Error starting scanner:", error);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    } finally {
      setIsTransitioning(false);
    }
  };

  const stopScanning = async () => {
    if (isTransitioning || !scannerRef.current || !isScanning) return;
    
    setIsTransitioning(true);
    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (error) {
      console.error("Error stopping scanner:", error);
    } finally {
      setIsTransitioning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning && !isTransitioning) {
        setIsTransitioning(true);
        scannerRef.current.stop().catch(console.error).finally(() => {
          setIsTransitioning(false);
        });
      }
    };
  }, [isScanning, isTransitioning]);

  const title = mode === "event-access" 
    ? "Escanear QR Code do Evento" 
    : "Scanner de QR Code";
  
  const description = mode === "event-access"
    ? "Escaneie o QR Code fornecido pelo organizador do evento"
    : "Posicione o QR code do convidado dentro da área de leitura";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          id={scannerDivId}
          className={`w-full ${isScanning ? "block" : "hidden"}`}
          style={{ minHeight: "300px" }}
        />

        {!isScanning && (
          <div className="flex items-center justify-center py-12 bg-muted rounded-lg">
            <div className="text-center space-y-4">
              <CameraOff className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Clique no botão abaixo para iniciar o scanner
              </p>
            </div>
          </div>
        )}

        {scanResult && (
          <Alert variant={scanResult.success ? "default" : "destructive"}>
            {scanResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{scanResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button 
              onClick={startScanning} 
              className="w-full" 
              disabled={isProcessing || isTransitioning}
            >
              <Camera className="mr-2 h-4 w-4" />
              {isTransitioning ? "Iniciando..." : "Iniciar Scanner"}
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="w-full"
              disabled={isProcessing || isTransitioning}
            >
              <CameraOff className="mr-2 h-4 w-4" />
              {isTransitioning ? "Parando..." : "Parar Scanner"}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {description}
        </div>
      </CardContent>
    </Card>
  );
}
