"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PayPalPayment } from "@/components/PayPalPayment";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onSuccess: (order: any) => void;
  onError: () => void;
  onCancel: () => void;
  summary?: React.ReactNode;
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  amount,
  onSuccess,
  onError,
  onCancel,
  summary,
}: PaymentDialogProps) => {
  const [showThankYou, setShowThankYou] = useState(false);

  const _onSuccess = (order: any) => {
    setShowThankYou(true);
    onSuccess(order);
  };

  const _onCancel = () => {
    setShowThankYou(false);
    onOpenChange(false);
  };

  const _onOpenChange = (open: boolean) => {
    setShowThankYou(false);
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={_onOpenChange}>
      <DialogContent className="max-w-[400px] w-full">
        {!showThankYou && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
            </DialogHeader>
            {summary && <div className="mb-4">{summary}</div>}
            <PayPalPayment
              amount={amount}
              onSuccess={_onSuccess}
              onError={onError}
              onCancel={onCancel}
            />
            <DialogFooter>
              <Button variant="outline" onClick={_onCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
        {showThankYou && (
          <>
            <DialogHeader>
              <DialogTitle>Thank you for enrolling!</DialogTitle>
            </DialogHeader>
            <span className="text-[#000000CF] text-lg">
              You have successfully enrolled in the project. You can now start
              learning with your mentor.
            </span>
            <span className="text-[#000000CF] text-lg">
              A confirmation email with all the session details has been sent to
              your registered email.
            </span>
            <Button variant="outline" onClick={_onCancel}>
              Continue to Dashboard
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
