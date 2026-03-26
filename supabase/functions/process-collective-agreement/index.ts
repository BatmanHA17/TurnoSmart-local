import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type RequestBody = { agreement_id: string; mode?: 'extract' };

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let agreementId = '';
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return jsonResponse({ error: 'Missing required environment variables' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Invalid JSON in request body:', e);
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { agreement_id, mode = 'extract' } = body;

    if (!agreement_id) {
      console.error('Missing agreement_id parameter');
      return jsonResponse({ error: 'Missing agreement_id parameter' }, 400);
    }

    console.log(`Procesando convenio ${agreement_id} en modo ${mode}`);

    // Verificar estado del convenio
    const { data: agreement, error: agreementError } = await supabase
      .from('collective_agreements')
      .select('id, name, org_id, status, file_url, file_type, raw_text')
      .eq('id', agreement_id)
      .single();

    if (agreementError || !agreement) {
      console.error('Agreement not found:', agreementError);
      return jsonResponse({ error: `Agreement not found: ${agreementError?.message || 'Unknown error'}` }, 404);
    }

    console.log('Agreement data:', {
      id: agreement.id,
      status: agreement.status,
      file_url: agreement.file_url,
      file_type: agreement.file_type,
      has_raw_text: !!agreement.raw_text
    });


    // Verificar que puede ser procesado
    const validStates = ['uploaded', 'processing_failed', 'processing_cancelled'];
    if (!validStates.includes(agreement.status)) {
      console.log(`Invalid status for processing: ${agreement.status}`);
      return jsonResponse({ 
        error: `Invalid status for processing: ${agreement.status}. Must be one of: ${validStates.join(', ')}` 
      }, 409);
    }

    // Cambiar estado a processing
    const { error: statusError } = await supabase
      .from('collective_agreements')
      .update({ status: 'processing' })
      .eq('id', agreement_id);
    
    if (statusError) {
      console.error('Error updating status to processing:', statusError);
      return jsonResponse({ error: 'Error updating status to processing' }, 500);
    }
    
    console.log(`Estado cambiado a 'processing' para convenio ${agreement_id}`);

    // Obtener usuario autenticado
    const { data: authUser } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (!authUser.user) {
      return jsonResponse({ error: 'User not authenticated' }, 401);
    }

    // Crear registro de interacción
    const { data: interaction, error: interactionError } = await supabase
      .from('agreement_interactions')
      .insert({
        agreement_id: agreement_id,
        org_id: agreement.org_id,
        kind: 'extract',
        prompt: 'Extracción automática de grupos profesionales y niveles salariales',
        status: 'running',
        created_by: authUser.user.id
      })
      .select()
      .single();

    if (interactionError) {
      console.error('Error creating interaction:', interactionError);
      return jsonResponse({ error: 'Error creating interaction record' }, 500);
    }

    try {
      // FASE 1: Verificar cancelación
      const { data: currentAgreement } = await supabase
        .from('collective_agreements')
        .select('status')
        .eq('id', agreement_id)
        .single();

      if (currentAgreement?.status === 'processing_cancelled') {
        await supabase
          .from('agreement_interactions')
          .update({ status: 'cancelled', finished_at: new Date().toISOString() })
          .eq('id', interaction.id);
        
        return jsonResponse({ 
          success: false, 
          error: 'Processing cancelled by user' 
        }, 200);
      }

      // FASE 2: Obtener y procesar texto del documento
      let rawText = agreement.raw_text;

      if (!rawText) {
        console.log('Descargando archivo...');
        
        let arrayBuffer: ArrayBuffer | null = null;
        
        try {
          // Use public URL since the file is stored in a public bucket
          if (agreement.file_url) {
            console.log('Downloading from public URL:', agreement.file_url);
            
            // First, let's test if the URL is accessible
            const headResponse = await fetch(agreement.file_url, { method: 'HEAD' });
            console.log('HEAD response status:', headResponse.status, headResponse.statusText);
            console.log('HEAD response headers:', Object.fromEntries(headResponse.headers.entries()));
            
            if (!headResponse.ok) {
              console.error('HEAD request failed:', headResponse.status, headResponse.statusText);
              throw new Error(`File not accessible: ${headResponse.status} ${headResponse.statusText}`);
            }
            
            const fileResponse = await fetch(agreement.file_url, { 
              method: 'GET',
              headers: {
                'User-Agent': 'Supabase-Edge-Function/1.0'
              }
            });
            
            console.log('GET response status:', fileResponse.status, fileResponse.statusText);
            console.log('GET response headers:', Object.fromEntries(fileResponse.headers.entries()));
            
            if (!fileResponse.ok) {
              console.error('GET request failed:', fileResponse.status, fileResponse.statusText);
              const errorText = await fileResponse.text().catch(() => 'Could not read error text');
              console.error('Error response body:', errorText);
              throw new Error(`Error downloading file: ${fileResponse.status} ${fileResponse.statusText} - ${errorText}`);
            }

            arrayBuffer = await fileResponse.arrayBuffer();
          } else {
            throw new Error('No file URL available');
          }
          
          if (!arrayBuffer) {
            throw new Error('Empty file buffer received');
          }
          
          console.log('File downloaded successfully, size:', arrayBuffer.byteLength);
        } catch (downloadError) {
          console.error('Download error details:', downloadError);
          throw new Error(`File download failed: ${downloadError.message}`);
        }
        
        // Parse file content based on type
        try {
          rawText = await parseFileContent(arrayBuffer, agreement.file_type);
          
          // Update agreement with extracted text
          await supabase
            .from('collective_agreements')
            .update({ raw_text: rawText })
            .eq('id', agreement_id);
            
          console.log('Text extracted and saved, length:', rawText.length);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          throw new Error(`Error parsing file content: ${parseError.message}`);
        }
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }

      // FASE 3: Crear chunks de texto
      console.log('Creando chunks de texto...');
      
      // Limpiar chunks previos
      await supabase
        .from('agreement_text_chunks')
        .delete()
        .eq('agreement_id', agreement_id);

      // Crear nuevos chunks
      const chunkSize = 7000;
      const chunks = [];
      
      for (let i = 0; i < rawText.length; i += chunkSize) {
        const chunk = rawText.slice(i, i + chunkSize);
        chunks.push({
          agreement_id: agreement_id,
          org_id: agreement.org_id,
          idx: Math.floor(i / chunkSize),
          content: chunk
        });
      }

      const { error: chunksError } = await supabase
        .from('agreement_text_chunks')
        .insert(chunks);

      if (chunksError) {
        console.error('Error saving chunks:', chunksError);
        throw new Error('Error saving text chunks');
      }

      // FASE 4: Verificar cancelación antes de extracción
      const { data: currentAgreement2 } = await supabase
        .from('collective_agreements')
        .select('status')
        .eq('id', agreement_id)
        .single();

      if (currentAgreement2?.status === 'processing_cancelled') {
        await supabase
          .from('agreement_interactions')
          .update({ status: 'cancelled', finished_at: new Date().toISOString() })
          .eq('id', interaction.id);
        
        return jsonResponse({ 
          success: false, 
          error: 'Processing cancelled by user' 
        }, 200);
      }

      // FASE 5: Extracción mejorada con búsqueda específica por ANEXO II y normalización
      console.log('Aplicando extractor mejorado con búsqueda por ANEXO II...');
      
      const extractedGroups = [];
      const extractedLevels = [];
      
      // Logging detallado para depuración
      console.log(`Longitud del texto extraído: ${rawText.length} caracteres`);
      console.log(`Primeros 500 caracteres: ${rawText.substring(0, 500)}`);
      console.log(`Últimos 500 caracteres: ${rawText.substring(rawText.length - 500)}`);
      
      // Buscar "ANEXO" específicamente
      const anexoMatches = rawText.match(/anexo/gi);
      console.log(`Apariciones de "anexo": ${anexoMatches ? anexoMatches.length : 0}`);
      
      // Buscar "NIVEL" específicamente
      const nivelMatches = rawText.match(/nivel/gi);
      console.log(`Apariciones de "nivel": ${nivelMatches ? nivelMatches.length : 0}`);
      
      // Buscar "CATEGORIA" específicamente
      const categoriaMatches = rawText.match(/categoria|categoría/gi);
      console.log(`Apariciones de "categoria": ${categoriaMatches ? categoriaMatches.length : 0}`);
      
      // Normalizar texto para búsqueda más efectiva
      const normalizedText = rawText
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/\s+/g, ' ') // Normalizar espacios
        .toLowerCase();
      
      console.log(`Texto normalizado, longitud: ${normalizedText.length}`);
      
      // BÚSQUEDA ESPECÍFICA POR ANEXO II
      console.log('Buscando ANEXO II...');
      const anexoIIPattern = /anexo\s+ii[^a-z]*(?:categoria|nivel|personal|clasificacion)[^]*?(?=anexo\s+iii|anexo\s+iv|artículo|capítulo|$)/gi;
      const anexoIIMatches = rawText.match(anexoIIPattern);
      
      if (anexoIIMatches && anexoIIMatches.length > 0) {
        console.log(`Encontrado ANEXO II, ${anexoIIMatches.length} sección(es)`);
        console.log(`Primera sección ANEXO II (primeros 1000 chars): ${anexoIIMatches[0].substring(0, 1000)}`);
        
        anexoIIMatches.forEach((anexoSection, index) => {
          console.log(`Procesando ANEXO II sección ${index + 1}`);
          
          // Buscar niveles específicos en formato "- NIVEL ..."
          const nivelPattern = /^\s*[-•]\s*nivel\s+([iv]+|[0-9]+)[:\.]?\s*(.+?)$/gim;
          let nivelMatch;
          
          while ((nivelMatch = nivelPattern.exec(anexoSection)) !== null) {
            const nivelNum = nivelMatch[1].trim();
            const descripcion = nivelMatch[2].trim();
            
            if (descripcion.length > 3) {
              const nivelCompleto = `Nivel ${nivelNum}: ${descripcion}`;
              extractedLevels.push(nivelCompleto);
              console.log('Nivel extraído:', nivelCompleto);
            }
          }
          
          // Buscar categorías profesionales específicas
          const categoriaPattern = /(?:^|\n)\s*[-•]?\s*([a-záéíóúñü\s]+(?:jefe|director|camarero|cocinero|recepcionista|gobernanta|administrativo|ayudante|especialista|mayor|segundo|auxiliar|técnico|subalterno)[a-záéíóúñü\s]*)/gim;
          let categoriaMatch;
          
          while ((categoriaMatch = categoriaPattern.exec(anexoSection)) !== null) {
            const categoria = categoriaMatch[1].trim();
            
            if (categoria.length > 5 && categoria.length < 80) {
              extractedGroups.push(categoria);
              console.log('Categoría extraída de ANEXO II:', categoria);
            }
          }
        });
      } else {
        console.log('No se encontró ANEXO II, usando extracción general...');
        
        // Buscar ANEXO II con pattern más flexible
        const anexoFlexiblePattern = /anexo\s+(?:2|ii|dos)[^]*?(?=anexo|artículo|capítulo|$)/gi;
        const anexoFlexibleMatches = rawText.match(anexoFlexiblePattern);
        
        if (anexoFlexibleMatches && anexoFlexibleMatches.length > 0) {
          console.log(`Encontrado ANEXO II con búsqueda flexible, ${anexoFlexibleMatches.length} sección(es)`);
          console.log(`Primera sección flexible (primeros 1000 chars): ${anexoFlexibleMatches[0].substring(0, 1000)}`);
        }
      }
      
      // EXTRACCIÓN GENERAL MEJORADA Y MÁS AGRESIVA
      console.log('Aplicando extracción general mejorada...');
      
      // Buscar palabras clave de hostelería más agresivamente
      const keywordPatterns = [
        'director', 'subdirector', 'jefe', 'segundo jefe', 'gobernanta',
        'cocinero', 'maitre', 'sumiller', 'camarero', 'recepcionista',
        'conserje', 'ayudante', 'pinche', 'limpiadora', 'vigilante',
        'nivel', 'categoria', 'clasificacion', 'grupo profesional'
      ];
      
      keywordPatterns.forEach(keyword => {
        const keywordRegex = new RegExp(keyword, 'gi');
        const matches = rawText.match(keywordRegex);
        if (matches && matches.length > 0) {
          console.log(`Encontradas ${matches.length} apariciones de "${keyword}"`);
        }
      });
      
      // Extracción línea por línea más agresiva
      const lines = rawText.split('\n');
      console.log(`Procesando ${lines.length} líneas de texto`);
      
      let foundCategories = 0;
      let foundLevels = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        
        if (line.length < 5) continue; // Saltar líneas muy cortas
        
        // Buscar categorías profesionales
        const categoryKeywords = ['director', 'jefe', 'cocinero', 'camarero', 'recepcionista', 'gobernanta', 'ayudante', 'pinche', 'limpiadora', 'vigilante', 'conserje', 'maitre', 'sumiller'];
        
        for (const keyword of categoryKeywords) {
          if (line.includes(keyword)) {
            const categoria = lines[i].trim();
            if (categoria.length > 5 && categoria.length < 100) {
              extractedGroups.push(categoria);
              foundCategories++;
              console.log(`Categoría encontrada en línea ${i}: ${categoria}`);
              break; // Solo una categoría por línea
            }
          }
        }
        
        // Buscar niveles
        if (line.includes('nivel') && (line.includes('i') || line.includes('ii') || line.includes('iii') || line.includes('iv') || /\d/.test(line))) {
          const nivel = lines[i].trim();
          if (nivel.length > 3 && nivel.length < 150) {
            extractedLevels.push(nivel);
            foundLevels++;
            console.log(`Nivel encontrado en línea ${i}: ${nivel}`);
          }
        }
        
        // Limitar para evitar demasiado procesamiento
        if (foundCategories >= 50 || foundLevels >= 20) break;
      }
      
      console.log(`Extracción línea por línea completada: ${foundCategories} categorías, ${foundLevels} niveles`);
      
      // Eliminar duplicados
      const uniqueCategories = [...new Set(extractedGroups)];
      const uniqueLevels = [...new Set(extractedLevels)];
      
      // Actualizar arrays finales
      extractedGroups.length = 0;
      extractedLevels.length = 0;
      extractedGroups.push(...uniqueCategories);
      extractedLevels.push(...uniqueLevels);
      
      console.log(`Extracción completada: ${extractedGroups.length} categorías, ${extractedLevels.length} niveles`);
      extractedGroups.forEach(cat => console.log('- Categoría:', cat));
      extractedLevels.forEach(nivel => console.log('- Nivel:', nivel));
      
      // Calcular confianza basada en la cantidad de extracciones
      let confidence = 0.3; // Confianza base
      if (extractedGroups.length > 15) confidence = 0.9;
      else if (extractedGroups.length > 10) confidence = 0.8;
      else if (extractedGroups.length > 5) confidence = 0.7;
      else if (extractedGroups.length > 0) confidence = 0.6;
      
      // Guardar categorías extraídas en la nueva tabla
      if (extractedGroups.length > 0 || extractedLevels.length > 0) {
        try {
          console.log('Guardando categorías en la base de datos...');
          const categoriesToInsert = [];
          
          // Agregar categorías profesionales
          extractedGroups.forEach(categoria => {
            categoriesToInsert.push({
              name: categoria,
              type: 'categoria',
              description: `Categoría profesional extraída del convenio`,
              extracted_from: categoria
            });
          });
          
          // Agregar niveles profesionales
          extractedLevels.forEach(nivel => {
            categoriesToInsert.push({
              name: nivel,
              type: 'nivel', 
              description: `Nivel profesional extraído del convenio`,
              extracted_from: nivel
            });
          });
          
          console.log('Categorías a insertar:', categoriesToInsert.length);
          
          // Insertar cada categoría individualmente para evitar errores de transacción
          for (const categoria of categoriesToInsert) {
            const { error: insertError } = await supabase
              .from('professional_categories')
              .insert({
                agreement_id: agreement_id,
                org_id: agreement.org_id,
                category_name: categoria.name,
                category_type: categoria.type,
                description: categoria.description,
                extracted_from: categoria.extracted_from,
                created_by: authUser.user.id
              });
              
            if (insertError) {
              console.error('Error insertando categoría:', categoria.name, insertError);
            } else {
              console.log('Categoría insertada exitosamente:', categoria.name);
            }
          }
          
        } catch (insertError) {
          console.error('Error general insertando categorías:', insertError);
        }
      }
      
      console.log(`Procesamiento completado - ${extractedGroups.length} grupos, ${extractedLevels.length} niveles`);

      // FASE 6: Guardar metadata de extracción
      const { error: extractionError } = await supabase
        .from('agreement_extractions')
        .insert({
          agreement_id: agreement_id,
          org_id: agreement.org_id,
          extraction_type: 'automatic',
          groups_extracted: extractedGroups.length,
          levels_extracted: extractedLevels.length,
          confidence_score: confidence,
          processed_by: authUser.user.id,
          ai_model_used: openAIApiKey ? 'gpt-4o-mini + deterministic' : 'deterministic_only',
          processing_time_ms: Date.now() - new Date(interaction.created_at).getTime()
        });

      if (extractionError) {
        console.error('Error guardando metadata:', extractionError);
      }

      // FASE 7: Actualizar estado del convenio
      const { error: updateError } = await supabase
        .from('collective_agreements')
        .update({
          status: 'pending_review',
          extraction_data: {
            groups_count: extractedGroups.length,
            levels_count: extractedLevels.length,
            confidence: confidence,
            processed_at: new Date().toISOString()
          }
        })
        .eq('id', agreement_id);

      if (updateError) {
        console.error('Error updating agreement status:', updateError);
        throw new Error('Error updating agreement status');
      }

      // Actualizar interacción
      await supabase
        .from('agreement_interactions')
        .update({
          response: {
            groups_extracted: extractedGroups.length,
            levels_extracted: extractedLevels.length,
            confidence: confidence
          },
          status: 'completed',
          finished_at: new Date().toISOString()
        })
        .eq('id', interaction.id);

      return jsonResponse({
        success: true,
        groups_extracted: extractedGroups.length,
        levels_extracted: extractedLevels.length,
        confidence: confidence
      }, 200);

    } catch (error) {
      console.error('Error en procesamiento:', error);
      
      // Rollback estado en caso de error
      await supabase
        .from('collective_agreements')
        .update({ status: 'processing_failed' })
        .eq('id', agreement_id);

      // Actualizar interacción con error
      await supabase
        .from('agreement_interactions')
        .update({
          status: 'failed',
          error: error.message,
          finished_at: new Date().toISOString()
        })
        .eq('id', interaction.id);

      return jsonResponse({
        success: false,
        error: error.message
      }, 500);
    }

  } catch (error) {
    console.error('Error general en función:', error);
    
    // Rollback si tenemos el ID del convenio
    if (agreementId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
        await supabase
          .from('collective_agreements')
          .update({ status: 'processing_failed' })
          .eq('id', agreementId);
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }

    return jsonResponse({
      success: false,
      error: error.message || 'Internal server error'
    }, 500);
  }
});

// Helper function to parse file content based on type
async function parseFileContent(arrayBuffer: ArrayBuffer, fileType?: string): Promise<string> {
  try {
    if (!fileType) {
      // Try to decode as text
      return new TextDecoder('utf-8').decode(arrayBuffer);
    }
    
    const lowerType = fileType.toLowerCase();
    
    if (lowerType.includes('text') || lowerType.includes('plain')) {
      return new TextDecoder('utf-8').decode(arrayBuffer);
    }
    
    if (lowerType.includes('markdown') || lowerType.includes('md')) {
      return new TextDecoder('utf-8').decode(arrayBuffer);
    }
    
    // Para PDFs, usar un enfoque básico de extracción de texto
    if (lowerType.includes('pdf')) {
      console.log('Procesando PDF - extracción básica...');
      
      try {
        // Convertir ArrayBuffer a Uint8Array para procesamiento
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Buscar strings de texto en el PDF
        let extractedText = '';
        const decoder = new TextDecoder('utf-8', { fatal: false });
        
        // Buscar patrones de texto en el PDF
        // Los PDFs almacenan texto en streams, intentamos extraer lo que podamos
        const pdfContent = decoder.decode(uint8Array);
        
        // Buscar texto entre marcadores típicos de PDF
        const textPatterns = [
          /BT\s+(.*?)\s+ET/gs, // Text objects
          /\((.*?)\)/g,        // Parentheses strings
          /\/([A-Za-z0-9\s]+)/g // Font names and text
        ];
        
        for (const pattern of textPatterns) {
          const matches = pdfContent.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Limpiar y extraer texto legible
              const cleaned = match
                .replace(/[^\x20-\x7E\xA0-\xFF\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              
              if (cleaned.length > 3 && /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(cleaned)) {
                extractedText += cleaned + ' ';
              }
            }
          }
        }
        
        // Si no encontramos texto con patrones, intentar extracción directa
        if (extractedText.length < 100) {
          const directText = pdfContent
            .replace(/[^\x20-\x7E\xA0-\xFF\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Buscar palabras reconocibles
          const words = directText.split(' ')
            .filter(word => word.length > 2 && /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(word));
          
          if (words.length > 10) {
            extractedText = words.join(' ');
          }
        }
        
        console.log(`Texto extraído del PDF: ${extractedText.length} caracteres`);
        console.log(`Muestra del texto extraído (primeros 500 chars): ${extractedText.substring(0, 500)}`);
        
        if (extractedText.length === 0) {
          throw new Error('El PDF no contiene texto extraíble con el método básico');
        }
        
        return extractedText.trim();
      } catch (pdfError) {
        console.error('Error extrayendo texto del PDF:', pdfError);
        throw new Error(`Error extrayendo texto del PDF: ${pdfError.message}`);
      }
    }
    
    // For other file types, attempt basic text extraction
    const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
    
    // Basic cleanup for binary files
    return text.replace(/[^\x20-\x7E\xA0-\xFF\s]/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.error('Error en parseFileContent:', e);
    throw new Error(`Failed to parse file content: ${e.message}`);
  }
}