
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch initial profile data
  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      // Map the data to our Profile interface, providing defaults for missing fields
      const profileData: Profile = {
        id: user.id,
        full_name: data?.full_name || null,
        email: data?.email || user.email || null,
        phone: null, // Default to null since column doesn't exist yet
        profile_image_url: null, // Default to null since column doesn't exist yet
      };

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      // Filter out columns that don't exist in the current schema
      const validUpdates = {
        full_name: updates.full_name,
        email: updates.email,
        // Skip phone and profile_image_url for now since columns don't exist
      };

      // Remove undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(validUpdates).filter(([_, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('profiles')
        .update(filteredUpdates)
        .eq('id', user.id)
        .select('id, full_name, email')
        .single();

      if (error) throw error;

      // Update local state with the returned data
      if (data) {
        const updatedProfile: Profile = {
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          phone: profile?.phone || null, // Keep existing phone value
          profile_image_url: profile?.profile_image_url || null, // Keep existing image URL
        };
        setProfile(updatedProfile);
      }

      toast.success('Profile updated successfully!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      return { error };
    }
  };

  // Upload profile image
  const uploadProfileImage = async (file: File) => {
    if (!user?.id) return { error: 'Not authenticated' };

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const error = 'Please upload a valid image file (JPG, PNG, or WebP)';
      toast.error(error);
      return { error };
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      const error = 'File size must be less than 5MB';
      toast.error(error);
      return { error };
    }

    setUploading(true);

    try {
      // Delete old image if it exists
      if (profile?.profile_image_url) {
        const oldPath = profile.profile_image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-images')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // For now, we'll just update the local state since the column doesn't exist yet
      // Later when the profile_image_url column is added, this will update the database
      if (profile) {
        setProfile({ ...profile, profile_image_url: publicUrl });
      }

      toast.success('Profile image uploaded successfully!');
      return { data: { url: publicUrl }, error: null };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
      return { error };
    } finally {
      setUploading(false);
    }
  };

  // Set up real-time listener
  useEffect(() => {
    if (!user?.id) return;

    fetchProfile();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        console.log('Profile updated in real-time:', payload);
        const newData = payload.new as any;
        const updatedProfile: Profile = {
          id: newData.id,
          full_name: newData.full_name,
          email: newData.email,
          phone: profile?.phone || null, // Keep existing phone value
          profile_image_url: profile?.profile_image_url || null, // Keep existing image URL
        };
        setProfile(updatedProfile);
        toast.success('Profile updated!');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    profile,
    loading,
    uploading,
    updateProfile,
    uploadProfileImage,
    refetch: fetchProfile,
  };
}
