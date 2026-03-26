import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

interface ConvenioUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function ConvenioUploadZone({ onUpload, isUploading, uploadProgress }: ConvenioUploadZoneProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validar tamaño de archivo (20MB máximo)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede superar los 20MB",
        variant: "destructive"
      });
      return;
    }

    // Validar tipo de archivo
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ];
    
    const isValidType = supportedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.pdf') ||
                       file.name.toLowerCase().endsWith('.doc') ||
                       file.name.toLowerCase().endsWith('.docx') ||
                       file.name.toLowerCase().endsWith('.txt') ||
                       file.name.toLowerCase().endsWith('.md');

    if (!isValidType) {
      toast({
        title: "Tipo de archivo no soportado",
        description: "Solo se permiten archivos PDF, Word, TXT y Markdown",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    await onUpload(file);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-accent">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragActive ? 'Suelta el archivo aquí' : 'Subir convenio colectivo'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Arrastra y suelta tu archivo o{' '}
              <span className="text-primary font-medium">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Soporta PDF, Word (.doc/.docx), TXT y Markdown (.md) • Máximo 20MB
            </p>
          </div>
        </div>
      </div>

      {/* Errores de archivo */}
      {fileRejections.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">
            {fileRejections[0].errors[0].message}
          </span>
        </div>
      )}

      {/* Archivo subido */}
      {uploadedFile && (
        <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(uploadedFile.size)}
            </p>
          </div>
          {!isUploading && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
      )}

      {/* Progreso de subida */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subiendo archivo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
}