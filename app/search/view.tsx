import { Search, GraduationCap, Filter, BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import MentorItem from "@/components/MentorItem";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export default async function SearchPage(props: { mentors: any[] }) {
  const filteredGraduates = props.mentors.filter(
    (mentor) => mentor.type === "graduate"
  );

  // console.log("GF", props.mentors, filteredGraduates);
  const filteredProfessors = props.mentors.filter(
    (mentor) => mentor.type === "professor"
  );

  return (
    <div className="flex flex-col gap-4 w-full ">
      <Input placeholder="Search" />
      <Tabs defaultValue="graduates" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#E5DEFF]/40 dark:bg-[#312A52]/60 p-1 rounded-lg">
          <TabsTrigger
            value="graduates"
            className="flex items-center gap-2 data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=inactive]:text-black data-[state=inactive]:font-medium"
          >
            <GraduationCap className="h-4 w-4" />
            College Graduates
          </TabsTrigger>
          <TabsTrigger
            value="professors"
            className="flex items-center gap-2 data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=inactive]:text-black data-[state=inactive]:font-medium"
          >
            <BookOpen className="h-4 w-4" />
            Professors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graduates">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold">College Graduates</h2>
            <Separator className="flex-1 ml-4 " />
          </div>

          {filteredGraduates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGraduates.map((mentor) => (
                <MentorItem
                  key={mentor.id}
                  mentor={mentor}
                  className="w-full"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass bg-white/10 rounded-xl p-8">
              <div className="w-24 h-24 rounded-full bg-[#9b87f5]/30 flex items-center justify-center mx-auto mb-6">
                <Filter className="h-12 w-12 text-[#9b87f5]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 ">No mentors found</h2>
              <p className=" font-medium max-w-md mx-auto">
                Try adjusting your search filters or try a different search
                term.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="professors">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold ">University Professors</h2>
            <Separator className="flex-1 ml-4 " />
          </div>

          {filteredProfessors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessors.map((mentor) => (
                <MentorItem
                  key={mentor.id}
                  mentor={mentor}
                  className="w-full"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass bg-white/10 rounded-xl p-8">
              <div className="w-24 h-24 rounded-full bg-[#9b87f5]/30 flex items-center justify-center mx-auto mb-6">
                <Filter className="h-12 w-12 text-[#9b87f5]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 ">No professors found</h2>
              <p className=" font-medium max-w-md mx-auto">
                Try adjusting your search filters or try a different search
                term.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
