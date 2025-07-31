import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { CircleX } from "lucide-react";

export const CouponItem = ({
  finalAmount,
  amount,
  updateFinalAmount,
}: {
  finalAmount: number;
  amount: number;
  updateFinalAmount: (amount: number) => void;
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [errorText, setErrorText] = useState("");
  const [codeApplied, setCodeApplied] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onApplyCode = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/validate_coupon", {
      method: "POST",
      body: JSON.stringify({ coupon_code: couponCode, amount }),
    });
    const data = await res.json();
    setIsLoading(false);
    if (!data.status) {
      setErrorText(data.message);
      return;
    }
    setCodeApplied(data.data);
    updateFinalAmount(data.amount);
  }, [couponCode, amount]);

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "font-semibold",
          codeApplied && "text-green-500",
          !codeApplied && "text-blue-500"
        )}
      >
        {codeApplied ? "Coupon Applied" : "Coupon Code"}
      </span>
      {!codeApplied ? (
        <div className="flex gap-2 items-center">
          <Input
            value={couponCode}
            onChange={(e) => {
              setErrorText("");
              setCouponCode(e.target.value);
            }}
            type="text"
            autoFocus={false}
            placeholder="Enter coupon code"
          />
          <Button
            loading={isLoading}
            variant="outline"
            className={cn("text-blue-500 text-sm")}
            size="sm"
            onClick={onApplyCode}
          >
            Apply
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <span className="text-sm">{codeApplied}</span>

          <button
            onClick={() => {
              setCodeApplied("");
              updateFinalAmount(amount);
            }}
          >
            <span className="text-xs text-blue-500">Remove</span>
          </button>
        </div>
      )}
      {errorText && <div className="text-sm text-red-500">{errorText}</div>}
      {finalAmount !== amount && codeApplied && (
        <div className="text-sm text-gray-500">
          You will be charged ${finalAmount} instead of ${amount}
        </div>
      )}
    </div>
  );
};
