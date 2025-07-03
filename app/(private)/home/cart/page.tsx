"use client";

import { useEffect, useState } from "react";
import { getCart, removeFromCart, markCartPaid } from "@/app/actions/cart";
import { useUser } from "@/app/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PaymentDialog } from "@/components/PaymentDialog";

export default function Cart() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    const res = await getCart(user.id);
    if (res.success) {
      setCart(res.cart);
    } else {
      setCart(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = async (projectId: string) => {
    if (!user) return;
    setRemoving(projectId);
    const res = await removeFromCart({ studentId: user.id, projectId });
    if (res.success) {
      toast({ title: "Removed", description: "Project removed from cart.", variant: "default" });
      fetchCart();
    } else {
      toast({ title: "Error", description: res.error || "Could not remove.", variant: "destructive" });
    }
    setRemoving(null);
  };

  // Calculate total price
  const total = cart?.student_cart_items?.reduce(
    (sum: number, item: any) => sum + (Number(item.projects?.selling_price) || 0),
    0
  );

  const handlePaymentSuccess = async (order: any) => {
    if (!cart) return;
    setPaying(true);
    const res = await markCartPaid(cart.id);
    if (res.success) {
      toast({ title: "Payment successful!", description: "Your cart has been paid.", variant: "default" });
      fetchCart();
      setShowPaymentDialog(false);
    } else {
      toast({ title: "Error", description: res.error || "Could not mark as paid.", variant: "destructive" });
    }
    setPaying(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Cart</h1>
      {loading ? (
        <div>Loading...</div>
      ) : !cart || !cart.student_cart_items?.length ? (
        <div className="text-gray-500">Your cart is empty.</div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {cart.student_cart_items.map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between bg-white shadow-sm">
                <div>
                  <div className="font-semibold text-lg">{item.projects?.title || "Project"}</div>
                  <div className="text-sm text-gray-600">Mentor: {item.mentor_profiles?.name || "-"}</div>
                  <div className="text-sm text-gray-600">Price: ${item.projects?.selling_price || "-"}</div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(item.project_id)}
                  disabled={removing === item.project_id}
                >
                  {removing === item.project_id ? "Removing..." : "Remove"}
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 mt-8">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>${total}</span>
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => setShowPaymentDialog(true)}
              disabled={paying}
            >
              Pay Now
            </Button>
            <Button
              className="w-full mt-2"
              variant="outline"
              onClick={() => toast({ title: "Reminder sent! (not implemented)", description: "A reminder will be sent to your parent.", variant: "default" })}
            >
              Ask Parent to Pay
            </Button>
          </div>
          <PaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            amount={total}
            onSuccess={handlePaymentSuccess}
            onError={() => setShowPaymentDialog(false)}
            onCancel={() => setShowPaymentDialog(false)}
            summary={<div>Pay <b>${total}</b> for all projects in your cart.</div>}
          />
        </>
      )}
    </div>
  );
} 