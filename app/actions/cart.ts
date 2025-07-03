"use server";

import { createClient } from "@/utils/supabase/server";
import { getEvenlyDistributedSessionDates } from "@/lib/utils";

// Add a project to the student's cart
export async function addToCart({ studentId, projectId, mentorId }: { studentId: string; projectId: string; mentorId: string }) {
  const supabase = await createClient();

  // Get or create active cart for student
  let { data: cart, error: cartError } = await supabase
    .from("student_carts")
    .select("*")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (cartError) {
    return { success: false, error: cartError.message };
  }

  if (!cart) {
    const { data: newCart, error: newCartError } = await supabase
      .from("student_carts")
      .insert({ student_id: studentId, status: "active" })
      .select()
      .single();
    if (newCartError) {
      return { success: false, error: newCartError.message };
    }
    cart = newCart;
  }

  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from("student_cart_items")
    .select("id")
    .eq("cart_id", cart.id)
    .eq("project_id", projectId)
    .maybeSingle();

  if (existingItem) {
    return { success: false, error: "Project already in cart." };
  }

  // Add item to cart
  const { error: itemError } = await supabase
    .from("student_cart_items")
    .insert({ cart_id: cart.id, project_id: projectId, mentor_id: mentorId });

  if (itemError) {
    return { success: false, error: itemError.message };
  }

  return { success: true };
}

// Remove a project from the student's cart
export async function removeFromCart({ studentId, projectId }: { studentId: string; projectId: string }) {
  const supabase = await createClient();
  // Get active cart
  const { data: cart } = await supabase
    .from("student_carts")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (!cart) {
    return { success: false, error: "No active cart found." };
  }
  // Remove item
  const { error } = await supabase
    .from("student_cart_items")
    .delete()
    .eq("cart_id", cart.id)
    .eq("project_id", projectId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Get the current cart for a student
export async function getCart(studentId: string) {
  const supabase = await createClient();
  const { data: cart, error: cartError } = await supabase
    .from("student_carts")
    .select("*, student_cart_items(*, projects(*), mentor_profiles(*))")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (cartError) {
    return { success: false, error: cartError.message };
  }
  return { success: true, cart };
}

// Mark a cart as paid
export async function markCartPaid(cartId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_carts")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", cartId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Parent pays and books all projects in a child's cart
export async function parentPayAndBookCart({ childId, parentId, paymentDetails }: { childId: string; parentId: string; paymentDetails: any }) {
  const supabase = await createClient();
  // Get the child's active cart
  const { data: cart, error: cartError } = await supabase
    .from("student_carts")
    .select("*, student_cart_items(*, projects(*), mentor_profiles(*))")
    .eq("student_id", childId)
    .eq("status", "active")
    .maybeSingle();
  if (cartError || !cart) {
    return { success: false, error: cartError?.message || "No active cart found." };
  }
  // Book each project in the cart for the child
  for (const item of cart.student_cart_items) {
    const { projects, mentor_profiles } = item;
    // Calculate session dates
    const sessionDates = getEvenlyDistributedSessionDates(projects?.start_date, projects?.end_date, projects?.sessions_count || 1);
    for (let i = 0; i < sessionDates.length; i++) {
      const start_time = sessionDates[i];
      const end_time = new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString();
      // Create a booking for each session
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
      if (bookingError) {
        return { success: false, error: bookingError.message };
      }
    }
  }
  // Mark the cart as paid
  const { error: paidError } = await supabase
    .from("student_carts")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", cart.id);
  if (paidError) {
    return { success: false, error: paidError.message };
  }
  return { success: true };
} 