export const renderMentorBioText = (mentor_bio: string[]): string => {
    if (!mentor_bio?.length) return "(no bio provided)";
    const lines = mentor_bio.map((x) => String(x).trim()).filter(Boolean);
    return lines.map((ln) => `- ${ln}`).join("\n");
  };
  
  export const toolsToStr = (tools: any): string => {
    if (Array.isArray(tools)) return tools.join(", ");
    return String(tools ?? "");
  };