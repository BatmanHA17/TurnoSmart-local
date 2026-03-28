import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { ConvenioUploadZone } from "@/components/collective-agreement/ConvenioUploadZone";
import { ApprovalPanel } from "@/components/collective-agreement/ApprovalPanel";
import { Play, Square, Trash2, CheckCircle, MessageSquare, Send, ChevronDown, HelpCircle } from "lucide-react";

export default function CollectiveAgreementSettings() {
  const { org: currentOrg } = useCurrentOrganization();
  const { toast } = useToast();

  const [agreements, setAgreements] = useState([]);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [professionalGroups, setProfessionalGroups] = useState([]);
  const [salaryLevels, setSalaryLevels] = useState([]);
  const [selectedGroupsAgreement, setSelectedGroupsAgreement] = useState(null);
  const [activeTab, setActiveTab] = useState('agreements');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [lastAnswer, setLastAnswer] = useState('');
  const [qaHistory, setQaHistory] = useState([]);

  useEffect(() => {
    if (currentOrg?.org_id) {
      loadAgreements();
      loadQAHistory();
    }
  }, [currentOrg?.org_id]);

  const loadAgreements = async () => {
    if (!currentOrg?.org_id) return;
    try {
      const { data, error } = await supabase
        .from('collective_agreements')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAgreements(data || []);
    } catch (error) {
      console.error('Error loading agreements:', error);
      toast({ title: "Error", description: "No se pudieron cargar los convenios.", variant: "destructive" });
    }
  };

  const loadQAHistory = async () => {
    if (!currentOrg?.org_id) return;
    try {
      const { data, error } = await supabase
        .from('agreement_interactions')
        .select(`
          *,
          collective_agreements(name)
        `)
        .eq('org_id', currentOrg.org_id)
        .eq('kind', 'qa')
        .eq('status', 'succeeded')
        .not('response', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filtrar solo preguntas que tienen respuesta válida
      const validQA = (data || []).filter((interaction: any) => {
        const response = interaction.response as any;
        return response && 
          response.answer && 
          typeof response.answer === 'string' &&
          response.answer.trim() !== '' &&
          !response.answer.includes('No consta en el convenio aportado');
      });
      
      setQaHistory(validQA);
    } catch (error) {
      console.error('Error loading Q&A history:', error);
      toast({ title: "Error", description: "No se pudo cargar el historial de preguntas.", variant: "destructive" });
    }
  };

  const deleteQAInteraction = async (interactionId: string) => {
    try {
      const { error } = await supabase
        .from('agreement_interactions')
        .delete()
        .eq('id', interactionId);
      
      if (error) throw error;
      
      toast({ title: "Eliminado", description: "La pregunta ha sido eliminada correctamente." });
      loadQAHistory(); // Recargar la lista
    } catch (error) {
      console.error('Error deleting Q&A interaction:', error);
      toast({ title: "Error", description: "No se pudo eliminar la pregunta.", variant: "destructive" });
    }
  };

  const loadProfessionalGroups = async (agreementId: string) => {
    if (!currentOrg?.org_id) return;
    try {
      // Cargar categorías profesionales de la nueva tabla
      const { data: categories, error: categoriesError } = await supabase
        .from('professional_categories')
        .select('*')
        .eq('agreement_id', agreementId)
        .eq('org_id', currentOrg.org_id)
        .order('created_at', { ascending: true });
      
      if (categoriesError) throw categoriesError;

      // Separar categorías por tipo
      const grupos = categories?.filter(cat => cat.category_type === 'categoria') || [];
      const niveles = categories?.filter(cat => cat.category_type === 'nivel') || [];
      
      setProfessionalGroups(grupos);
      setSalaryLevels(niveles);
    } catch (error) {
      console.error('Error loading professional categories:', error);
      toast({ title: "Error", description: "No se pudieron cargar las categorías profesionales.", variant: "destructive" });
    }
  };

  const handleUpload = async (file) => {
    if (!currentOrg?.org_id) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Incluir org_id en la ruta del archivo para las políticas RLS
      const timestamp = Date.now().toString();
      // Limpiar el nombre del archivo para evitar caracteres problemáticos
      const cleanFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-zA-Z0-9.-]/g, '_'); // Reemplazar caracteres especiales con guiones bajos
      const fileName = `${currentOrg.org_id}/${timestamp}_${cleanFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('collective_agreements')
        .upload(fileName, file);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('collective_agreements')
        .getPublicUrl(fileName);

      const { data: agreementData, error: agreementError } = await supabase
        .from('collective_agreements')
        .insert({
          name: file.name.replace(/\.[^/.]+$/, ""),
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: urlData.publicUrl,
          status: 'uploaded',
          org_id: currentOrg.org_id,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          version: 1
        });
      if (agreementError) {
        console.error('Agreement insert error:', agreementError);
        throw agreementError;
      }

      setUploadProgress(100);
      toast({ title: "Subida exitosa", description: "El convenio colectivo ha sido subido." });
      loadAgreements();
    } catch (error) {
      console.error('handleUpload error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo subir el archivo.", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleStartProcessing = async (id) => {
    try {
      setIsProcessing(true);
      
      // Use supabase.functions.invoke for secure, portable edge function calls
      const { data: responseData, error: invokeError } = await supabase.functions.invoke('process-collective-agreement', {
        body: { agreement_id: id, mode: 'extract' }
      });

      if (invokeError) {
        console.error('Edge Function invocation error:', invokeError);
        throw new Error(invokeError.message || 'Failed to process agreement');
      }
      
      if (!responseData) {
        throw new Error('No response data received from edge function');
      }
      
      if (responseData?.success) {
        toast({ 
          title: "Procesamiento completado", 
          description: `Extraídos ${responseData.groups_extracted || 0} grupos y ${responseData.levels_extracted || 0} niveles.` 
        });
      } else {
        throw new Error(responseData?.error || 'Unexpected response from server');
      }
      
      await loadAgreements();
    } catch (error) {
      console.error('Error en handleStartProcessing:', error);
      toast({ 
        title: "Error", 
        description: `No se pudo procesar el convenio: ${error.message || error}`, 
        variant: "destructive" 
      });
      
      // Refresh to see updated status
      await loadAgreements();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAgreement = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este convenio? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('collective_agreements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      // Resetear datos cuando se elimina un convenio
      if (selectedAgreement?.id === id) {
        setSelectedAgreement(null);
        setQuestion('');
        setLastAnswer('');
      }
      if (selectedGroupsAgreement?.id === id) {
        setSelectedGroupsAgreement(null);
        setProfessionalGroups([]);
        setSalaryLevels([]);
      }
      
      toast({ title: "Convenio eliminado", description: "El convenio ha sido eliminado correctamente." });
      loadAgreements();
    } catch (error) {
      console.error('Error deleting agreement:', error);
      toast({ title: "Error", description: "No se pudo eliminar el convenio.", variant: "destructive" });
    }
  };

  const handleAsk = async (agreementId, userQuestion) => {
    if (!userQuestion.trim()) return;
    try {
      setIsAsking(true);
      const { data, error } = await supabase.functions.invoke('ask-collective-agreement', {
        body: { agreement_id: agreementId, question: userQuestion.trim() }
      });
      if (error) throw error;
      if (data?.success) {
        setLastAnswer(data.answer);
        toast({ title: "Respuesta recibida", description: "La IA ha respondido tu pregunta." });
        // Recargar historial Q&A después de hacer una pregunta con un pequeño delay
        setTimeout(() => {
          loadQAHistory();
        }, 1000);
        // Limpiar la pregunta actual
        setQuestion('');
      }
    } catch (error) {
      console.error('Error en handleAsk:', error);
      toast({ title: "Error", description: "No se pudo procesar la pregunta.", variant: "destructive" });
    } finally {
      setIsAsking(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      uploaded: { variant: "outline", label: "Subido" },
      processing: { variant: "default", label: "Procesando" },
      pending_review: { variant: "secondary", label: "Pendiente Revisión" },
      approved: { variant: "default", label: "Aprobado" },
      active: { variant: "default", label: "Activo" }
    };
    const config = variants[status] || variants.uploaded;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Convenios Colectivos</h1>
          <p className="text-muted-foreground">
            Gestiona convenios con extracción manual de grupos profesionales y Q&A con IA
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="agreements">Convenios</TabsTrigger>
          <TabsTrigger value="ai-interaction">Interacción IA</TabsTrigger>
          <TabsTrigger value="qa-history">Q&A</TabsTrigger>
          <TabsTrigger value="groups">Grupos Profesionales</TabsTrigger>
          <TabsTrigger value="active">Convenio Activo</TabsTrigger>
        </TabsList>

        <TabsContent value="agreements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Convenios</CardTitle>
              <CardDescription>Sube y procesa convenios manualmente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ConvenioUploadZone
                onUpload={handleUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              
              {agreements.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agreements.map((agreement) => (
                      <TableRow key={agreement.id}>
                        <TableCell>{agreement.name}</TableCell>
                        <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {agreement.status === 'uploaded' && (
                              <Button size="sm" onClick={() => handleStartProcessing(agreement.id)}>
                                <Play className="h-3 w-3" /> Procesar
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteAgreement(agreement.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-interaction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Preguntas y Respuestas con IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Seleccionar convenio</Label>
                <Select value={selectedAgreement?.id || ''} onValueChange={(value) => {
                  const agreement = agreements.find(a => a.id === value);
                  setSelectedAgreement(agreement || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un convenio para consultar" />
                  </SelectTrigger>
                  <SelectContent>
                    {agreements.map((agreement) => (
                      <SelectItem key={agreement.id} value={agreement.id}>
                        {agreement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAgreement && (
                <>
                  <div className="space-y-2">
                    <Label>Tu pregunta sobre el convenio</Label>
                    <Textarea
                      placeholder="Ej: ¿Cuáles son las categorías del Grupo II?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={() => handleAsk(selectedAgreement.id, question)}
                    disabled={isAsking || !question.trim()}
                    className="w-full"
                  >
                    {isAsking ? 'Consultando IA...' : 'Preguntar a IA'}
                  </Button>

                  {lastAnswer && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Respuesta de IA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{lastAnswer}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorías y Niveles del Personal</CardTitle>
              <CardDescription>Revisa las categorías profesionales extraídas del convenio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Seleccionar convenio</Label>
                <Select 
                  value={selectedGroupsAgreement?.id || ''} 
                  onValueChange={(value) => {
                    const agreement = agreements.find(a => a.id === value && (a.status === 'pending_review' || a.status === 'approved' || a.status === 'active'));
                    setSelectedGroupsAgreement(agreement || null);
                    if (agreement) {
                      loadProfessionalGroups(agreement.id);
                    } else {
                      setProfessionalGroups([]);
                      setSalaryLevels([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un convenio procesado" />
                  </SelectTrigger>
                  <SelectContent>
                    {agreements
                      .filter(a => a.status === 'pending_review' || a.status === 'approved' || a.status === 'active')
                      .map((agreement) => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          {agreement.name} - {getStatusBadge(agreement.status)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGroupsAgreement && (
                <div className="space-y-6">
                  {/* Resumen de extracción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{professionalGroups.length}</div>
                        <p className="text-sm text-muted-foreground">Categorías Profesionales</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{selectedGroupsAgreement.extraction_data?.confidence || 'N/A'}</div>
                        <p className="text-sm text-muted-foreground">Confianza IA</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Categorías Profesionales */}
                  {professionalGroups.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Categorías Profesionales Extraídas</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {professionalGroups.map((group) => (
                          <Card key={group.id}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{group.category_type}</Badge>
                                    <h4 className="font-medium">{group.category_name}</h4>
                                  </div>
                                  {group.description && (
                                    <p className="text-sm text-muted-foreground">{group.description}</p>
                                  )}
                                  {group.extracted_from && (
                                    <p className="text-xs text-muted-foreground">
                                      Extraído de: "{group.extracted_from}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Niveles del Personal */}
                  {salaryLevels.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Niveles del Personal</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {salaryLevels.map((level) => (
                          <div key={level.id} className="flex items-center gap-2 p-3 bg-muted rounded">
                            <Badge variant="secondary">{level.category_type}</Badge>
                            <div className="flex-1">
                              <span className="text-sm font-medium">{level.category_name}</span>
                              {level.description && (
                                <p className="text-xs text-muted-foreground">{level.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(professionalGroups.length === 0 && salaryLevels.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No se encontraron categorías profesionales extraídas para este convenio.
                        <br />
                        Asegúrate de que el convenio haya sido procesado correctamente.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!selectedGroupsAgreement && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Selecciona un convenio procesado para ver los grupos profesionales extraídos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="qa-history" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <HelpCircle className="h-5 w-5" />
                 Historial de Preguntas y Respuestas
               </CardTitle>
               <CardDescription>
                 Revisa todas las consultas realizadas a los convenios colectivos
               </CardDescription>
             </CardHeader>
             <CardContent>
               {qaHistory.length === 0 ? (
                 <div className="text-center py-8">
                   <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <p className="text-muted-foreground">
                     Aún no tienes preguntas con respuestas válidas.
                     <br />
                     Utiliza la pestaña "Interacción IA" para hacer consultas sobre el convenio.
                   </p>
                   <Button 
                     variant="outline" 
                     onClick={() => setActiveTab('ai-interaction')}
                     className="mt-4"
                   >
                     Ir a Interacción IA
                   </Button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {qaHistory.map((interaction) => (
                     <Collapsible key={interaction.id}>
                       <Card className="hover:shadow-md transition-shadow">
                         <CollapsibleTrigger asChild>
                           <CardHeader className="cursor-pointer hover:bg-muted/30 rounded-t-lg transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {interaction.collective_agreements?.name || 'Convenio'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(interaction.created_at).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-left line-clamp-2">
                                    {interaction.prompt}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteQAInteraction(interaction.id);
                                    }}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                </div>
                              </div>
                           </CardHeader>
                         </CollapsibleTrigger>
                         <CollapsibleContent>
                           <CardContent className="pt-0">
                             <div className="border-t pt-4">
                               <h4 className="text-sm font-medium text-muted-foreground mb-2">Respuesta:</h4>
                               <div className="bg-muted/30 rounded-lg p-4">
                                 <p className="text-sm whitespace-pre-wrap">
                                   {interaction.response?.answer || 'Sin respuesta disponible'}
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </CollapsibleContent>
                       </Card>
                     </Collapsible>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="active">
           <Card>
             <CardContent className="text-center py-8">
               <p className="text-muted-foreground">
                 El convenio activo aparecerá aquí una vez aprobado y activado.
               </p>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }