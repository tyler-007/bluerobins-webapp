import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { buildDesignBrief, generateIdeas } from "../";
import { logSection } from "../utils/log";

async function main() {
  const brief = buildDesignBrief(
    "AI, ML, Deep learning, healthcare, biomedical, creative projects, new startup ideas",
    "HighSchool, Undergraduate",
    8,
    "Paper Presentation, College application, Research, Masters",
    [
      "Experimental Science Project",
      "AI/Kaggle Dataset Project",
      "Prompt Engineering / AI Creativity",
      "Survey-Based Research",
    ],
    8,
    "<$500"
  );

  const mentor_bio = [
    "Senior UX/AI mentor with 10+ years across healthcare, mobility, and edtech."
  ];

  const results = await generateIdeas(brief, mentor_bio);

  logSection(">>> FINAL IDEAS (RETURN VALUE) <<<");
  results.forEach((r, i) => {
    console.log(`[${i + 1}] ${r.ProjectTitle} (${r.ProjectType})`);
    // console.log(`SuitableFor: ${r.SuitableFor} | Duration: ${r.ProjectDuration} weeks | Time: ${r.StudentTimeCommitment} hr/week`);
    console.log(`Difficulty: ${r.DifficultyLevel} | Cost: ${brief.CostForResources} | EarlyWow: ${r.EarlyWow}`);
    console.log("Description:\n" + r.ProjectDescription);
    console.log("Equipment:", r.EquipmentNeededAndCost.join(", "));
    console.log("-".repeat(80));
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});