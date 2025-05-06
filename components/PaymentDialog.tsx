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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] w-full">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
        </DialogHeader>
        {summary && <div className="mb-4">{summary}</div>}
        <PayPalPayment
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
