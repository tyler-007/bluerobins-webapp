"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";

interface PricingInfoDialogProps {
  triggerText?: string;
  title?: string;
  description?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;
  buttonProps?: React.ComponentProps<typeof Button>;
  sessionCount?: number;
}

export const PricingInfoDialog = ({
  triggerText = "View Pricing Info",
  title = "Pricing Information",
  description = "Learn more about our pricing, packages, and what you get.",
  content,
  footer,
  buttonProps,
  sessionCount = 8,
}: PricingInfoDialogProps) => {
  const [open, setOpen] = useState(false);

  const price = sessionCount === 12 ? 1530 : 1080;
  const commission1 = sessionCount === 12 ? 0.23 * 1530 : 0.23 * 1080;
  const mentor1 = price - commission1;
  const commission2 = price / 2;
  const mentor2 = price / 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" {...buttonProps}>
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-900 text-center">
              <span className="font-semibold text-lg">
                {sessionCount}-Session Package
              </span>
              <div className="text-2xl font-bold mt-1">
                ${price}{" "}
                <span className="text-base font-normal">per student</span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-semibold mb-2">Fee Structure</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  <span className="font-medium">1st student:</span> 23% platform
                  fees
                </li>
                <li>
                  <span className="font-medium">2nd student onwards:</span> 50%
                  platform fees
                </li>
              </ul>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-semibold mb-2">Mentor Earnings Examples</div>
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="p-1">Student</th>
                    <th className="p-1">Platform Fees</th>
                    <th className="p-1">Mentor Receives</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white rounded">
                    <td className="p-1">1st</td>
                    <td className="p-1">23% (${commission1.toFixed(2)})</td>
                    <td className="p-1 font-semibold">${mentor1.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-white rounded">
                    <td className="p-1">2nd+</td>
                    <td className="p-1">50% (${commission2.toFixed(2)})</td>
                    <td className="p-1 font-semibold">${mentor2.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Mentor earnings are calculated after platform fee is deducted from
              the student payment.
            </div>
          </div>
        </div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

export default PricingInfoDialog;
