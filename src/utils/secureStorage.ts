
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SecureUploadOptions {
  bucket: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export const secureFileUpload = async (
  file: File, 
  options: SecureUploadOptions
): Promise<string | null> => {
  const { bucket, folder, maxSizeBytes = 10 * 1024 * 1024, allowedTypes } = options;

  // Validate file size
  if (file.size > maxSizeBytes) {
    toast.error(`File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`);
    return null;
  }

  // Validate file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    toast.error('File type not allowed');
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Must be authenticated to upload files');
      return null;
    }

    // Create secure path with user ID prefix for RLS
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder 
      ? `${user.id}/${folder}/${fileName}`
      : `${user.id}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload file');
      return null;
    }

    console.log('File uploaded successfully:', data.path);
    return data.path;
  } catch (error) {
    console.error('Upload error:', error);
    toast.error('Failed to upload file');
    return null;
  }
};

export const getSignedFileUrl = async (
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
};

export const deleteSecureFile = async (
  bucket: string, 
  path: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
