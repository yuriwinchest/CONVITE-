import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EventPhotosUploaderProps {
  eventId: string;
  guestId?: string;
  onUploadComplete?: () => void;
}

interface PhotoPreview {
  id: string;
  file: File;
  preview: string;
}

interface VerifyCheckinResult {
  success: boolean;
  error?: string;
  guest?: {
    id: string;
    name: string;
    checked_in_at: string | null;
    has_checked_in: boolean;
  };
}

export const EventPhotosUploader = ({
  eventId,
  guestId,
  onUploadComplete,
}: EventPhotosUploaderProps) => {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [existingPhotosCount, setExistingPhotosCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_PHOTOS_PER_GUEST = 30;
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // Buscar quantidade de fotos já enviadas pelo convidado
  useEffect(() => {
    if (guestId) {
      supabase
        .from("event_photos")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("guest_id", guestId)
        .then(({ count }) => setExistingPhotosCount(count || 0));
    }
  }, [eventId, guestId]);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: `${file.name} excede o limite de 10MB`,
        variant: "destructive",
      });
      return false;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: `${file.name} não é um formato suportado (JPG, PNG, WEBP)`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = MAX_PHOTOS_PER_GUEST - existingPhotosCount - photos.length;

    if (remainingSlots <= 0) {
      toast({
        title: "Limite atingido",
        description: `Você já atingiu o limite de ${MAX_PHOTOS_PER_GUEST} fotos.`,
        variant: "destructive",
      });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newPhotos: PhotoPreview[] = [];

    if (files.length > remainingSlots) {
      toast({
        title: "Limite de fotos",
        description: `Você pode enviar apenas mais ${remainingSlots} foto(s).`,
      });
    }

    filesToProcess.forEach((file) => {
      if (validateFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPhotos.push({
            id: crypto.randomUUID(),
            file,
            preview: e.target?.result as string,
          });

          if (newPhotos.length === filesToProcess.length) {
            setPhotos((prev) => [...prev, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) return;

    try {
      if (!guestId) {
        toast({
          title: "Check-in necessário",
          description: "Você precisa fazer check-in no evento antes de enviar fotos.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      const uploadPromises = photos.map(async (photo, index) => {
        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('eventId', eventId);
        formData.append('guestId', guestId);

        console.log('📤 Enviando foto:', {
          eventId,
          guestId,
          fileName: photo.file.name,
          fileSize: photo.file.size,
          fileType: photo.file.type
        });

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-event-photo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Erro no upload:', error);
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        console.log('✅ Foto enviada com sucesso:', result);
        setUploadProgress(((index + 1) / photos.length) * 100);
        return result;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Fotos enviadas!",
        description: `${photos.length} foto(s) enviada(s) com sucesso.`,
      });

      setPhotos([]);
      setExistingPhotosCount((prev) => prev + photos.length);

      // Pequeno delay para garantir que o estado local atualize antes de invalidar queries do pai
      setTimeout(() => {
        onUploadComplete?.();
      }, 100);
    } catch (error: unknown) {
      console.error("Upload error details:", error);

      let errorMessage = "Não foi possível enviar as fotos.";
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao enviar fotos",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const remainingSlots = MAX_PHOTOS_PER_GUEST - existingPhotosCount - photos.length;

  return (
    <div className="space-y-4">
      {guestId && (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Você pode enviar até <strong>{MAX_PHOTOS_PER_GUEST}</strong> fotos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {existingPhotosCount} enviada(s) • {remainingSlots} disponível(is)
          </p>
        </div>
      )}
      <Card
        className={`border-2 border-dashed transition-colors ${isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            Arraste suas fotos aqui
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou clique no botão abaixo para selecionar
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || remainingSlots <= 0}
          >
            Selecionar Fotos
          </Button>
          <input
            id="photo-file-input"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Selecionar fotos para upload"
            title="Selecionar fotos para upload"
          />
          <p className="text-xs text-muted-foreground mt-4">
            Formatos aceitos: JPG, PNG, WEBP (máx. 10MB por foto)
          </p>
        </div>
      </Card>

      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="relative group overflow-hidden">
                <img
                  src={photo.preview}
                  alt={photo.file.name}
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photo.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Enviando fotos... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={uploadPhotos}
              disabled={uploading}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Enviar {photos.length} Foto(s)
            </Button>
            <Button
              variant="outline"
              onClick={() => setPhotos([])}
              disabled={uploading}
            >
              Limpar Tudo
            </Button>
          </div>
        </>
      )}
      {/* Acessibilidade: fornecer label para o input de arquivo */}
      <Label htmlFor="photo-file-input" className="sr-only">Selecionar Fotos</Label>
    </div>
  );
};
