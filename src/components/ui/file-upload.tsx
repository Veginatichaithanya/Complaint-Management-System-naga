
import React, { useRef, useState } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from './button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUpload: (url: string | null) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({ onFileUpload, accept = "image/*", maxSize = 5 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `complaints/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('complaint-attachments')
        .getPublicUrl(filePath);

      setUploadedFile({ name: file.name, url: publicUrl });
      onFileUpload(publicUrl);
      toast.success('File uploaded successfully!');

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      onFileUpload(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!uploadedFile ? (
        <div
          onClick={handleUploadClick}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {uploading ? 'Uploading...' : 'Click to upload an image'}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to {maxSize}MB
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-3">
            <FileImage className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">File uploaded successfully</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
