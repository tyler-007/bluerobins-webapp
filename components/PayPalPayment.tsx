"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";

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
  const [test] = useQueryState("test_p", parseAsBoolean);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isValidAmount = amount > 0;

  console.log("--- PayPal Amount Debug ---");
  console.log("Amount received:", amount);
  console.log("Is amount valid?", isValidAmount);

  return (
    <PayPalScriptProvider
      options={{
        clientId: test
          ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_TEST!
          : process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
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
        disabled={isProcessing || !isValidAmount}
      />
    </PayPalScriptProvider>
  );
};
