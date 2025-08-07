
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useDeleteComplaint } from '@/hooks/useDeleteComplaint';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteComplaintButtonProps {
  complaintId: string;
  complaintTitle: string;
  onDeleted?: () => void;
}

export function DeleteComplaintButton({ 
  complaintId, 
  complaintTitle, 
  onDeleted 
}: DeleteComplaintButtonProps) {
  const { deleteComplaint, deleting } = useDeleteComplaint();

  const handleDelete = async () => {
    console.log('🔄 Delete button clicked for complaint:', complaintId);
    
    const success = await deleteComplaint(complaintId);
    if (success && onDeleted) {
      console.log('✅ Complaint deleted, refreshing data...');
      setTimeout(() => {
        onDeleted();
      }, 1000); // Give time for database to update
    }
  };

  const isDeleting = deleting === complaintId;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Complaint Permanently</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to permanently delete this complaint?
            </p>
            <p className="font-semibold text-foreground">
              "{complaintTitle}"
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All related data including notifications, 
              messages, and feedback will be permanently removed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Permanently'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
