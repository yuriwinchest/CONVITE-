import { useState, useRef } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseCSV, downloadCSVTemplate, ParsedGuest } from "@/lib/csvParser";

interface CSVUploaderProps {
  onGuestsParsed: (guests: ParsedGuest[]) => void;
}

export function CSVUploader({ onGuestsParsed }: CSVUploaderProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);

    const result = await parseCSV(file);
    
    if (result.errors.length > 0) {
      setErrors(result.errors);
    }

    if (result.guests.length > 0) {
      onGuestsParsed(result.guests);
    }

    setIsProcessing(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-upload"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? "Processando..." : "Carregar CSV"}
        </Button>
        <Button
          variant="ghost"
          onClick={downloadCSVTemplate}
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar Modelo
        </Button>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">Erros encontrados:</div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground">
        Formato esperado: <code className="bg-muted px-1 py-0.5 rounded">nome,mesa</code>
        <br />
        Uma linha por convidado. O número da mesa é opcional.
      </div>
    </div>
  );
}
