import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Image as ImageIcon, FileArchive } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EventPhotoGalleryProps {
  eventId: string;
  guestId?: string;
  isCreator?: boolean;
}

interface EventPhoto {
  id: string;
  photo_url: string;
  file_name: string;
  uploaded_at: string;
}

export const EventPhotoGallery = ({ eventId, guestId, isCreator = false }: EventPhotoGalleryProps) => {
  const [downloadingZip, setDownloadingZip] = useState(false);

  const { data: photos, isLoading, refetch } = useQuery({
    queryKey: ["event-photos", eventId, guestId],
    queryFn: async () => {
      let query = supabase
        .from("event_photos")
        .select("*")
        .eq("event_id", eventId);

      // Se for convidado específico, filtrar apenas suas fotos
      if (guestId && !isCreator) {
        query = query.eq("guest_id", guestId);
      }

      const { data, error } = await query.order("uploaded_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as EventPhoto[];
    },
  });

  const handleDownload = async (photoUrl: string, fileName: string) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download iniciado",
        description: "A foto está sendo baixada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar a foto.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    try {
      const fileName = photoUrl.split("/").pop();
      const filePath = photoUrl.split("event-photos/")[1];

      // Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("event-photos")
          .remove([filePath]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("event_photos")
        .delete()
        .eq("id", photoId);

      if (dbError) throw dbError;

      toast({
        title: "Foto excluída",
        description: "A foto foi removida com sucesso.",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a foto.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!photos || photos.length === 0) return;

    toast({
      title: "Baixando fotos",
      description: "Preparando download de todas as fotos...",
    });

    for (const photo of photos) {
      await handleDownload(photo.photo_url, photo.file_name);
      // Pequeno delay entre downloads para não sobrecarregar
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handleDownloadZip = async () => {
    if (!photos || photos.length === 0) return;

    setDownloadingZip(true);

    try {
      toast({
        title: "Preparando ZIP",
        description: `Baixando ${photos.length} foto(s)...`,
      });

      const zip = new JSZip();
      const folder = zip.folder("fotos-evento");

      // Baixar todas as fotos e adicionar ao ZIP
      const downloadPromises = photos.map(async (photo, index) => {
        try {
          const response = await fetch(photo.photo_url);
          const blob = await response.blob();

          // Usar um nome de arquivo sequencial se houver duplicatas
          const fileName = `foto_${index + 1}_${photo.file_name}`;
          folder?.file(fileName, blob);
        } catch (error) {
          console.error(`Erro ao baixar foto ${photo.file_name}:`, error);
        }
      });

      await Promise.all(downloadPromises);

      // Gerar o arquivo ZIP
      toast({
        title: "Gerando arquivo ZIP",
        description: "Isso pode levar alguns segundos...",
      });

      const content = await zip.generateAsync({ type: "blob" });

      // Fazer download do ZIP
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fotos-evento-${eventId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download concluído!",
        description: `${photos.length} foto(s) baixadas em ZIP.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar ZIP",
        description: error.message || "Não foi possível criar o arquivo ZIP.",
        variant: "destructive",
      });
    } finally {
      setDownloadingZip(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando fotos...</p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Nenhuma foto ainda</p>
        <p className="text-sm text-muted-foreground">
          {guestId && !isCreator
            ? "Você ainda não enviou nenhuma foto. Use o uploader acima para compartilhar suas fotos."
            : "As fotos enviadas pelos convidados aparecerão aqui"}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {guestId && !isCreator && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-center">
            🔒 <strong>Galeria Privada:</strong> Você está visualizando apenas suas fotos
          </p>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {photos.length} foto(s) {guestId && !isCreator ? "enviadas por você" : "do evento"}
        </p>
        {photos.length > 0 && (
          <div className="flex gap-2">
            {isCreator && (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadZip}
                disabled={downloadingZip}
              >
                <FileArchive className="h-4 w-4 mr-2" />
                {downloadingZip ? "Gerando ZIP..." : "Baixar ZIP"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Todas
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="relative group overflow-hidden">
            <img
              src={photo.photo_url}
              alt={photo.file_name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => handleDownload(photo.photo_url, photo.file_name)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {(isCreator || (guestId && !isCreator)) && (
                <AlertDialog key={`delete-${photo.id}`}>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A foto será permanentemente removida.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(photo.id, photo.photo_url)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
