import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request) {
  const supabase = await createAdminClient();
  const req = await request.json();
  const { coupon_code, amount } = req;

  const { data: coupon, error: couponError } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", coupon_code)
    .single();

  if (!coupon) {
    return NextResponse.json({
      status: false,
      message: "Invalid coupon code",
    });
  }

  let finalAmount = amount;

  if (coupon.type === "percentage") {
    finalAmount = Math.ceil(amount * ((100 - coupon.value) / 100));
  }

  return NextResponse.json({
    status: true,
    amount: finalAmount,
    data: coupon.code,
  });
}
