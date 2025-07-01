"use client";
import Image from "next/image";
import logo from "../home/mascot.png";

// import ProjectCard from "@/app/components/ProjectCard";
import NewProjectCard from "@/app/components/NewProjectCard";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ProjectHubView(props: {
  projects: any;
  userId: string;
  isMentor: boolean;
  hideHeader?: boolean;
}) {
  const isMentor = props.isMentor;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Unique, sorted categories from all projects (deduplicate with Set, trim spaces)
  const categories = Array.from(
    new Set(
      props.projects.flatMap((p: any) =>
        Array.isArray(p.categories)
          ? p.categories.map((c: string) => c.trim())
          : []
      )
    )
  )
    .filter(Boolean)
    .sort();

  // Get all selected categories from the URL and trim them
  const selectedCategories = (
    searchParams.getAll
      ? searchParams.getAll("category")
      : Array.isArray(searchParams.category)
      ? searchParams.category
      : searchParams.category
      ? [searchParams.category]
      : []
  ).map((c) => c.trim());

  // Handle category checkbox change
  const handleCategoryChange = (category: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    let categories = params.getAll("category");
    if (checked) {
      if (!categories.includes(category)) categories.push(category);
    } else {
      categories = categories.filter((c) => c !== category);
    }
    params.delete("category");
    categories.forEach((cat) => params.append("category", cat));
    router.push(`?${params.toString()}`);
  };

  // Clear all selected categories
  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    router.push(`?${params.toString()}`);
  };

  // Dropdown trigger label
  let categoryLabel = "Filter by category";
  if (selectedCategories.length === 1) {
    categoryLabel = selectedCategories[0];
  } else if (selectedCategories.length > 1) {
    categoryLabel = `${selectedCategories.length} selected`;
  }

  console.log("PROJECTS:", props.projects);

  return (
    <>
      <div className="flex flex-col gap-4 w-full p-6">
        {!props.hideHeader && (
          <div className="flex flex-row gap-4 items-center">
            <Image src={logo} alt="logo" width={48} height={48} />
            <h1 className="text-2xl font-bold ">Project Hub</h1>
            {isMentor && (
              <Button
                loadOnClick
                variant="outline"
                onClick={() => router.push("/project-hub/create")}
              >
                Create New Project
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-row gap-8 items-start">
          <div className="flex flex-col gap-2 min-w-[220px]">
            <Label className="block text-base font-semibold mb-1">Category</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  type="button"
                >
                  {categoryLabel}
                  <span className="ml-2">▼</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {categories.map((category: any) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-blue-50 text-sm"
                      style={{ userSelect: "none" }}
                    >
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                        className="scale-90"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    className="mt-3 w-full text-blue-600 hover:underline"
                    onClick={handleClearAll}
                    type="button"
                  >
                    Clear All
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Sort by</Label>
            <Select onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Title (A-Z)</SelectItem>
                <SelectItem value="desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {(props.projects ?? []).map((project: any) => (
            <NewProjectCard
              key={project.id}
              package_id={project.id}
              userId={props.userId}
              isMentor={props.isMentor}
              projectDetails={project}
            />
          ))}
        </div>
      </div>
    </>
  );
}
