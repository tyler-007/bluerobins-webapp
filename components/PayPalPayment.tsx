"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PayPalPaymentProps {
  amount: number;
  onSuccess: (order: any) => void;
  onError: () => void;
  onCancel?: () => void;
}

export const PayPalPayment = ({
  amount,
  onSuccess,
  onError,
  onCancel,
}: PayPalPaymentProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: "USD",
      }}
    >
      <PayPalButtons
        style={{
          layout: "vertical",
          shape: "rect",
        }}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: "USD",
                  value: amount.toString(),
                },
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          try {
            setIsProcessing(true);
            if (actions.order) {
              const order = await actions.order.capture();
              toast({
                description: "Payment successful!",
              });
              onSuccess(order);
            }
          } catch (error) {
            console.error("Payment capture error:", error);
            toast({
              description: "Failed to capture payment. Please try again.",
              variant: "destructive",
            });
            onError();
          } finally {
            setIsProcessing(false);
          }
        }}
        onError={(err) => {
          console.error("PayPal Error:", err);
          toast({
            description: "Payment failed. Please try again.",
            variant: "destructive",
          });
          onError();
        }}
        onCancel={() => {
          toast({
            description: "Payment cancelled",
          });
          onCancel?.();
        }}
        disabled={isProcessing}
      />
    </PayPalScriptProvider>
  );
};
