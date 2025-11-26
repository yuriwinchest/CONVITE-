import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const guestId = formData.get('guestId') as string;

    console.log('Upload request:', { eventId, guestId, fileName: file?.name });

    // Validações básicas
    if (!file || !eventId || !guestId) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return new Response(
        JSON.stringify({ error: 'File too large (max 10MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validar que o convidado existe e pertence ao evento
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, event_id')
      .eq('id', guestId)
      .eq('event_id', eventId)
      .single();

    if (guestError || !guest) {
      console.error('Guest validation failed:', guestError);
      return new Response(
        JSON.stringify({ error: 'Guest not found or does not belong to this event' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Contar fotos existentes do convidado
    const { count } = await supabase
      .from('event_photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('guest_id', guestId);

    if ((count || 0) >= 30) {
      console.error('Photo limit reached:', count);
      return new Response(
        JSON.stringify({ error: 'Photo limit reached (max 30 photos per guest)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload do arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}/${crypto.randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();

    console.log('Uploading to storage:', fileName);

    const { error: uploadError } = await supabase.storage
      .from('event-photos')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('event-photos')
      .getPublicUrl(fileName);

    console.log('File uploaded, registering in database');

    // Registrar no banco de dados
    const { data: photoId, error: dbError } = await supabase
      .rpc('guest_upload_photo', {
        p_event_id: eventId,
        p_guest_id: guestId,
        p_photo_url: urlData.publicUrl,
        p_file_name: file.name,
        p_file_size: file.size,
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }

    console.log('Photo uploaded successfully:', photoId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        photoId,
        url: urlData.publicUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
