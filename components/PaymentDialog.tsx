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
import { CouponItem } from "./CouponItem";

interface PaymentDialogProps {
  title: string;
  sessions: number;
  mentor: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onSuccess: (order: any) => void;
  onError: () => void;
  onCancel: () => void;
  summary?: React.ReactNode;
}

export const PaymentDialog = ({
  title,
  sessions,
  mentor,
  open,
  onOpenChange,
  amount,
  onSuccess,
  onError,
  onCancel,
  summary,
}: PaymentDialogProps) => {
  const [showThankYou, setShowThankYou] = useState(false);
  const [finalAmount, setFinalAmount] = useState(amount);

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

            <div className="flex flex-col gap-2">
              <span className="text-lg">
                You are about to pay
                <br />
                <b>${finalAmount}</b> for {title} <b>({sessions} sessions)</b>
                <br />
                with <b>{mentor}</b>
              </span>
            </div>
            <CouponItem
              finalAmount={finalAmount}
              amount={amount}
              updateFinalAmount={setFinalAmount}
            />
            <PayPalPayment
              amount={finalAmount}
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
              You will receive invites to the sessions in your registered email
              shortly.
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
