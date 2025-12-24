import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting por guest_id
const uploadRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const UPLOAD_RATE_LIMIT_MAX = 10; // máximo 10 uploads por guest em 10 minutos
const UPLOAD_RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutos

function checkUploadRateLimit(guestId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = uploadRateLimitMap.get(guestId);
  
  if (!entry || now > entry.resetAt) {
    uploadRateLimitMap.set(guestId, { count: 1, resetAt: now + UPLOAD_RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: UPLOAD_RATE_LIMIT_MAX - 1 };
  }
  
  if (entry.count >= UPLOAD_RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: UPLOAD_RATE_LIMIT_MAX - entry.count };
}

// Validação de UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const eventIdFromForm = formData.get('eventId') as string | null;
    const guestId = formData.get('guestId') as string | null;

    console.log('Upload request received:', {
      eventIdFromForm,
      guestId: guestId?.substring(0, 8) + '***',
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    });

    // Validações básicas
    if (!file || !eventIdFromForm || !guestId) {
      console.error('Missing required fields', { hasFile: !!file, eventIdFromForm, guestId: !!guestId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validar formato UUID
    if (!isValidUUID(eventIdFromForm) || !isValidUUID(guestId)) {
      console.error('Invalid UUID format', { eventIdFromForm, guestId });
      return new Response(
        JSON.stringify({ error: 'Invalid ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verificar rate limit por guest
    const rateCheck = checkUploadRateLimit(guestId);
    if (!rateCheck.allowed) {
      console.error('Upload rate limit exceeded for guest:', guestId);
      return new Response(
        JSON.stringify({ error: 'Too many uploads. Please wait before uploading more photos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '600' } },
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return new Response(
        JSON.stringify({ error: 'File too large (max 10MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validar nome do arquivo (prevenir path traversal)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
    if (safeFileName.includes('..') || safeFileName.startsWith('/')) {
      console.error('Invalid file name:', file.name);
      return new Response(
        JSON.stringify({ error: 'Invalid file name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ===== Validação do convidado =====
    console.log('Validating guest for photo upload...', { eventIdFromForm, guestId });

    // Primeiro, tentar validar por (guest_id + event_id) como antes
    const {
      data: guestExact,
      error: guestExactError,
    } = await supabase
      .from('guests')
      .select('id, event_id')
      .eq('id', guestId)
      .eq('event_id', eventIdFromForm)
      .maybeSingle();

    let guest: { id: string; event_id: string } | null = null;

    if (guestExactError) {
      console.warn('Guest exact validation error (id + event):', guestExactError);
    }

    if (!guestExact) {
      // Fallback: tentar localizar apenas pelo guest_id e usar o event_id real do banco
      console.warn('Guest not found with provided eventId, trying by guestId only...', {
        eventIdFromForm,
        guestId,
      });

      const {
        data: guestById,
        error: guestByIdError,
      } = await supabase
        .from('guests')
        .select('id, event_id')
        .eq('id', guestId)
        .maybeSingle();

      if (guestByIdError || !guestById) {
        console.error('Guest validation failed (fallback by id):', guestByIdError);
        return new Response(
          JSON.stringify({ error: 'Guest not found or does not belong to this event' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      guest = guestById as { id: string; event_id: string };
    } else {
      guest = guestExact as { id: string; event_id: string };
    }

    const finalEventId = guest.event_id;

    console.log('Guest validated successfully for upload:', {
      guestId: guest.id,
      finalEventId,
      eventIdFromForm,
    });

    // ===== Limite de fotos por convidado =====
    const { count, error: countError } = await supabase
      .from('event_photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', finalEventId)
      .eq('guest_id', guest.id);

    if (countError) {
      console.error('Error counting existing photos:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate photo limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if ((count || 0) >= 30) {
      console.error('Photo limit reached for guest:', { guestId: guest.id, count });
      return new Response(
        JSON.stringify({ error: 'Photo limit reached (max 30 photos per guest)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ===== Upload do arquivo para Storage =====
    const fileExt = file.name.split('.').pop();
    const fileName = `${finalEventId}/${crypto.randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();

    console.log('Uploading file to storage...', { fileName, contentType: file.type });

    const { error: uploadError } = await supabase.storage
      .from('event-photos')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('event-photos')
      .getPublicUrl(fileName);

    console.log('File uploaded to storage, registering in database...', {
      photoUrl: urlData.publicUrl,
    });

    // Registrar no banco de dados via função guest_upload_photo (bypass RLS e mantém regras centralizadas)
    const { data: photoId, error: dbError } = await supabase
      .rpc('guest_upload_photo', {
        p_event_id: finalEventId,
        p_guest_id: guest.id,
        p_photo_url: urlData.publicUrl,
        p_file_name: file.name,
        p_file_size: file.size,
      });

    if (dbError) {
      console.error('Database insert error (guest_upload_photo):', dbError);
      throw dbError;
    }

    console.log('Photo uploaded and registered successfully:', { photoId, url: urlData.publicUrl });

    return new Response(
      JSON.stringify({
        success: true,
        photoId,
        url: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
