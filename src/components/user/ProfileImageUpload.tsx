
import React, { useRef, useState } from 'react';
import { Upload, User, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ProfileImageUploadProps {
  currentImageUrl: string | null;
  onImageUpload: (file: File) => Promise<{ error?: string }>;
  uploading: boolean;
}

export function ProfileImageUpload({ currentImageUrl, onImageUpload, uploading }: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    await onImageUpload(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* Profile Image Display */}
        <motion.div
          className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Upload overlay */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity ${
              dragOver ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            } cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </div>
        </motion.div>

        {/* Camera button */}
        <Button
          size="sm"
          className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-gray-400">
          PNG, JPG, WebP up to 5MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
