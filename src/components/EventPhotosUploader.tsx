import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export const EventPhotosUploader = ({
  eventId,
  guestId,
  onUploadComplete,
}: EventPhotosUploaderProps) => {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

    const newPhotos: PhotoPreview[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPhotos.push({
            id: crypto.randomUUID(),
            file,
            preview: e.target?.result as string,
          });

          if (newPhotos.length === files.length) {
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

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = photos.map(async (photo, index) => {
        const fileExt = photo.file.name.split(".").pop();
        const fileName = `${eventId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("event-photos")
          .upload(fileName, photo.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("event-photos")
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from("event_photos")
          .insert({
            event_id: eventId,
            guest_id: guestId || null,
            photo_url: urlData.publicUrl,
            file_name: photo.file.name,
            file_size: photo.file.size,
          });

        if (dbError) throw dbError;

        setUploadProgress(((index + 1) / photos.length) * 100);
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Fotos enviadas!",
        description: `${photos.length} foto(s) enviada(s) com sucesso.`,
      });

      setPhotos([]);
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar fotos",
        description: error.message || "Não foi possível enviar as fotos.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
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
            disabled={uploading}
          >
            Selecionar Fotos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
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
    </div>
  );
};
