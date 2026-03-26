import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key no configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agreement_id, question } = await req.json();

    if (!agreement_id || !question) {
      throw new Error('Faltan parámetros requeridos: agreement_id y question');
    }

    console.log(`Procesando pregunta para convenio ${agreement_id}: ${question}`);

    // Obtener información del convenio y usuario
    const { data: authUser } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (!authUser.user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar acceso al convenio
    const { data: agreement, error: agreementError } = await supabase
      .from('collective_agreements')
      .select('id, name, org_id, file_url, raw_text')
      .eq('id', agreement_id)
      .single();

    if (agreementError || !agreement) {
      throw new Error('Convenio no encontrado o sin acceso');
    }

    // Verificar membresía
    const { data: membership } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', authUser.user.id)
      .eq('org_id', agreement.org_id)
      .single();

    if (!membership) {
      throw new Error('Sin acceso a esta organización');
    }

    // Crear registro de interacción
    const { data: interaction, error: interactionError } = await supabase
      .from('agreement_interactions')
      .insert({
        agreement_id,
        org_id: agreement.org_id,
        kind: 'qa',
        prompt: question,
        status: 'running',
        created_by: authUser.user.id
      })
      .select()
      .single();

    if (interactionError) {
      throw new Error('Error creando registro de interacción');
    }

    try {
      // Verificar si ya hay chunks de texto
      let { data: chunks } = await supabase
        .from('agreement_text_chunks')
        .select('content')
        .eq('agreement_id', agreement_id)
        .order('idx');

      // Si no hay chunks, crearlos desde el texto del convenio
      if (!chunks || chunks.length === 0) {
        console.log('Creando chunks de texto...');
        
        let rawText = agreement.raw_text;
        
        // Si no hay texto crudo, intentar descargar el archivo
        if (!rawText && agreement.file_url) {
          console.log('Descargando archivo para procesar texto...');
          
          const fileResponse = await fetch(agreement.file_url);
          if (!fileResponse.ok) {
            throw new Error('Error descargando archivo del convenio');
          }
          
          const fileBlob = await fileResponse.blob();
          const arrayBuffer = await fileBlob.arrayBuffer();
          
          // Procesamiento básico según tipo de archivo
          if (agreement.file_url.includes('.txt') || agreement.file_url.includes('.md')) {
            rawText = new TextDecoder().decode(arrayBuffer);
          } else {
            // Para PDF/DOCX sería necesario un parser más complejo
            // Por ahora usamos texto plano como fallback
            rawText = new TextDecoder().decode(arrayBuffer);
          }
        }

        if (!rawText) {
          throw new Error('No se pudo obtener el texto del convenio');
        }

        // Crear chunks de 6-8k caracteres
        const chunkSize = 7000;
        const chunks_to_insert = [];
        
        for (let i = 0; i < rawText.length; i += chunkSize) {
          const chunk = rawText.slice(i, i + chunkSize);
          chunks_to_insert.push({
            agreement_id,
            org_id: agreement.org_id,
            idx: Math.floor(i / chunkSize),
            content: chunk
          });
        }

        // Insertar chunks
        const { error: chunksError } = await supabase
          .from('agreement_text_chunks')
          .insert(chunks_to_insert);

        if (chunksError) {
          console.error('Error insertando chunks:', chunksError);
          throw new Error('Error procesando texto del convenio');
        }

        chunks = chunks_to_insert.map(c => ({ content: c.content }));
      }

      // Buscar chunks más relevantes (búsqueda léxica simple)
      const questionWords = question.toLowerCase().split(/\s+/)
        .filter(word => word.length > 3);

      const relevantChunks = chunks
        .map((chunk, index) => {
          const content = chunk.content.toLowerCase();
          const score = questionWords.reduce((acc, word) => {
            const matches = (content.match(new RegExp(word, 'g')) || []).length;
            return acc + matches;
          }, 0);
          return { ...chunk, score, index };
        })
        .filter(chunk => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Top 5 chunks más relevantes

      if (relevantChunks.length === 0) {
        // Si no hay chunks relevantes, usar los primeros 3
        relevantChunks.push(...chunks.slice(0, 3).map((chunk, index) => ({ 
          ...chunk, 
          score: 0, 
          index 
        })));
      }

      // Preparar contexto para OpenAI
      const context = relevantChunks
        .map(chunk => chunk.content)
        .join('\n---\n');

      // Llamar a OpenAI
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Responde solo con información contenida en el convenio colectivo proporcionado. Si la información no consta en el texto, responde: "No consta en el convenio aportado". Si hay referencia explícita a un artículo, epígrafe o sección, cítalo en tu respuesta. Mantén las respuestas claras y concisas.'
            },
            {
              role: 'user',
              content: `Pregunta: ${question}\n\nContexto del convenio:\n${context}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }),
      });

      if (!openAIResponse.ok) {
        const errorText = await openAIResponse.text();
        console.error('Error OpenAI:', errorText);
        
        let errorMessage = 'Error en la respuesta de OpenAI';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.code === 'insufficient_quota') {
            errorMessage = 'Cuota de OpenAI excedida. Por favor, revisa tu plan de facturación.';
          } else if (errorData.error?.code === 'rate_limit_exceeded') {
            errorMessage = 'Límite de velocidad excedido. Intenta de nuevo en unos minutos.';
          } else if (errorData.error?.message) {
            errorMessage = `Error de OpenAI: ${errorData.error.message}`;
          }
        } catch (parseError) {
          console.error('Error parsing OpenAI error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const openAIData = await openAIResponse.json();
      const aiResponse = openAIData.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      // Actualizar interacción con la respuesta
      const { error: updateError } = await supabase
        .from('agreement_interactions')
        .update({
          response: { answer: aiResponse, chunks_used: relevantChunks.length },
          status: 'succeeded',
          finished_at: new Date().toISOString()
        })
        .eq('id', interaction.id);

      if (updateError) {
        console.error('Error actualizando interacción:', updateError);
      }

      return new Response(JSON.stringify({
        success: true,
        answer: aiResponse,
        interaction_id: interaction.id,
        chunks_used: relevantChunks.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Actualizar interacción con error
      await supabase
        .from('agreement_interactions')
        .update({
          status: 'failed',
          error: error.message,
          finished_at: new Date().toISOString()
        })
        .eq('id', interaction.id);

      throw error;
    }

  } catch (error) {
    console.error('Error in ask-collective-agreement:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});