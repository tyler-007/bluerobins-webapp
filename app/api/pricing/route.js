import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("pricing_config")
      .select("*")
      .order("type_of_project, number_of_sessions");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const { type_of_project, number_of_sessions, selling_price } = body;

    if (!type_of_project || !number_of_sessions || !selling_price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pricing_config")
      .upsert(
        {
          type_of_project,
          number_of_sessions: parseInt(number_of_sessions),
          selling_price: parseFloat(selling_price),
        },
        { onConflict: "type_of_project,number_of_sessions" }
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("pricing_config")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 