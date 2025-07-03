import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getEvenlyDistributedSessionDates } from "@/lib/utils";

// Add to cart
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentId, projectId, mentorId, action } = body;
  const supabase = await createClient();

  if (action === "add") {
    // Get or create active cart for student
    let { data: cart, error: cartError } = await supabase
      .from("student_carts")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (cartError) return NextResponse.json({ success: false, error: cartError.message }, { status: 500 });
    if (!cart) {
      const { data: newCart, error: newCartError } = await supabase
        .from("student_carts")
        .insert({ student_id: studentId, status: "active" })
        .select()
        .single();
      if (newCartError) return NextResponse.json({ success: false, error: newCartError.message }, { status: 500 });
      cart = newCart;
    }
    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from("student_cart_items")
      .select("id")
      .eq("cart_id", cart.id)
      .eq("project_id", projectId)
      .maybeSingle();
    if (existingItem) return NextResponse.json({ success: false, error: "Project already in cart." }, { status: 400 });
    // Add item to cart
    const { error: itemError } = await supabase
      .from("student_cart_items")
      .insert({ cart_id: cart.id, project_id: projectId, mentor_id: mentorId });
    if (itemError) return NextResponse.json({ success: false, error: itemError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "remove") {
    // Remove from cart
    // Get active cart
    const { data: cart } = await supabase
      .from("student_carts")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (!cart) return NextResponse.json({ success: false, error: "No active cart found." }, { status: 404 });
    // Remove item
    const { error } = await supabase
      .from("student_cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("project_id", projectId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
}

// Get cart
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ success: false, error: "Missing studentId" }, { status: 400 });
  const supabase = await createClient();
  const { data: cart, error: cartError } = await supabase
    .from("student_carts")
    .select("*, student_cart_items(*, projects(*), mentor_profiles(*))")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (cartError) return NextResponse.json({ success: false, error: cartError.message }, { status: 500 });
  return NextResponse.json({ success: true, cart });
}

// Mark cart as paid
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { cartId } = body;
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_carts")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", cartId);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// Parent pays and books all projects in a child's cart
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { childId, parentId, paymentDetails } = body;
  const supabase = await createClient();
  // Get the child's active cart
  const { data: cart, error: cartError } = await supabase
    .from("student_carts")
    .select("*, student_cart_items(*, projects(*), mentor_profiles(*))")
    .eq("student_id", childId)
    .eq("status", "active")
    .maybeSingle();
  if (cartError || !cart) return NextResponse.json({ success: false, error: cartError?.message || "No active cart found." }, { status: 404 });
  // Book each project in the cart for the child
  for (const item of cart.student_cart_items) {
    const { projects, mentor_profiles } = item;
    const sessionDates = getEvenlyDistributedSessionDates(projects?.start_date, projects?.end_date, projects?.sessions_count || 1);
    for (let i = 0; i < sessionDates.length; i++) {
      const start_time = sessionDates[i];
      const end_time = new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString();
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          by: childId,
          for: item.mentor_id,
          start_time,
          end_time,
          payment_id: paymentDetails?.id || null,
          payment_status: "confirmed",
          payment_details: paymentDetails,
          project_id: projects?.id,
          title: projects?.title,
          description: projects?.description,
          status: "scheduled",
        });
      if (bookingError) return NextResponse.json({ success: false, error: bookingError.message }, { status: 500 });
    }
  }
  // Mark the cart as paid
  const { error: paidError } = await supabase
    .from("student_carts")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", cart.id);
  if (paidError) return NextResponse.json({ success: false, error: paidError.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 