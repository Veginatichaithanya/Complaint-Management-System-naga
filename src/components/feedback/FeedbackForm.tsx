
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';

interface FeedbackFormProps {
  complaintId: string;
  complaintTitle: string;
  ticketNumber?: string;
  onSubmitted?: () => void;
}

export function FeedbackForm({ 
  complaintId, 
  complaintTitle, 
  ticketNumber,
  onSubmitted 
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comments, setComments] = useState('');
  const { submitFeedback, submitting } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please provide a rating before submitting');
      return;
    }

    try {
      await submitFeedback({
        complaint_id: complaintId,
        rating,
        comments: comments.trim() || undefined
      });
      
      // Reset form
      setRating(0);
      setComments('');
      
      // Call callback if provided
      onSubmitted?.();
      
      toast.success('✅ Thank you for your feedback!', {
        description: 'Your feedback helps us improve our service quality'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
              Service Feedback
            </CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              IBM Quality Assurance
            </Badge>
          </div>
          <div className="bg-white/70 rounded-lg p-4 mt-4">
            <p className="text-gray-700 font-medium mb-1">Resolved Complaint:</p>
            <p className="text-gray-900 font-semibold">{complaintTitle}</p>
            {ticketNumber && (
              <p className="text-sm text-gray-600 mt-1">
                Ticket: <span className="font-mono">{ticketNumber}</span>
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  How satisfied are you with the resolution?
                </label>
                <div className="flex items-center justify-center space-x-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      className="p-2 rounded-full transition-all duration-200 hover:bg-yellow-100"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Star
                        className={`w-10 h-10 transition-colors duration-200 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                {(hoveredRating > 0 || rating > 0) && (
                  <motion.p 
                    className="text-center text-lg font-medium text-gray-700 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {ratingLabels[(hoveredRating || rating) as keyof typeof ratingLabels]}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900">
                Additional Comments <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Please share any specific feedback about the resolution process, communication, or suggestions for improvement..."
                rows={4}
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                maxLength={1000}
              />
              <div className="text-right text-sm text-gray-500">
                {comments.length}/1000 characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-4">
              <Button
                type="submit"
                disabled={rating === 0 || submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quality Assurance Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800 font-medium">
                Your feedback is confidential and helps us maintain IBM's service excellence standards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
