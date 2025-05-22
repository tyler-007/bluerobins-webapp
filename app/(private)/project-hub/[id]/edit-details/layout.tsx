import Sidebar from "@/components/siderbar";
import { LayoutDataProvider } from "../../useLayoutData";
import { createClient } from "@/utils/supabase/server";
async function fetchLayoutData(id: string) {
  // Simulates an API returning global data
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}
export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  const layoutData = await fetchLayoutData(params.id);
  console.log("Layout Data", layoutData);
  return <LayoutDataProvider value={layoutData}>{children}</LayoutDataProvider>;
}
