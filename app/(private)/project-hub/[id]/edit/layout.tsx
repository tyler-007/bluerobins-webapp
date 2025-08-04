import Sidebar from "@/components/siderbar";
import { LayoutDataProvider } from "../../useLayoutData";
import { createClient } from "@/utils/supabase/server";
async function fetchLayoutData(id: string) {
  // Simulates an API returning global data
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", parseInt(id))
    .single();
  return data;
}
export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<any>;
}>) {
  const resolvedParams = await params;
  console.log("Layout params:", resolvedParams);
  console.log("Project ID from params:", resolvedParams.id, "Type:", typeof resolvedParams.id);
  const layoutData = await fetchLayoutData(resolvedParams.id);
  console.log("Layout Data", layoutData);
  return <LayoutDataProvider value={layoutData}>{children}</LayoutDataProvider>;
}
