
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Image, Loader2 } from 'lucide-react';
import { getSignedFileUrl } from '@/utils/secureStorage';
import { toast } from 'sonner';

interface SecureAttachmentViewerProps {
  attachmentPath: string | null;
  fileName?: string;
  compact?: boolean;
}

export function SecureAttachmentViewer({ 
  attachmentPath, 
  fileName, 
  compact = false 
}: SecureAttachmentViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'document' | 'unknown'>('unknown');

  useEffect(() => {
    if (attachmentPath) {
      // Determine file type from extension
      const extension = attachmentPath.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        setFileType('image');
      } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
        setFileType('document');
      }
    }
  }, [attachmentPath]);

  const handleView = async () => {
    if (!attachmentPath) return;

    setLoading(true);
    try {
      const url = await getSignedFileUrl('complaint-attachments', attachmentPath);
      if (url) {
        setSignedUrl(url);
        window.open(url, '_blank');
      } else {
        toast.error('Unable to access file');
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error('Error accessing file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!attachmentPath) return;

    setLoading(true);
    try {
      const url = await getSignedFileUrl('complaint-attachments', attachmentPath, 300); // 5 min expiry
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || attachmentPath.split('/').pop() || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else {
        toast.error('Unable to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error downloading file');
    } finally {
      setLoading(false);
    }
  };

  if (!attachmentPath) {
    return null;
  }

  const displayName = fileName || attachmentPath.split('/').pop() || 'Attachment';
  const FileIcon = fileType === 'image' ? Image : FileText;

  if (compact) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-muted rounded">
        <FileIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm truncate flex-1">{displayName}</span>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileIcon className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {fileType === 'image' ? 'Image file' : 'Document'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
