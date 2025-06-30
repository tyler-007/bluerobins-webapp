"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingInput } from "@/components/RatingInput";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { saveReview } from "@/app/actions/bookings";

interface RatingDialogProps {
  bookingId: string;
  studentId: string;
  mentorId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function RatingDialog({
  bookingId,
  studentId,
  mentorId,
  onOpenChange,
  open,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a rating.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const result = await saveReview({
      bookingId,
      studentId,
      mentorId,
      rating,
      feedback,
    });
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your session</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <div>
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Feedback (optional)
            </label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 