import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { embeddingService } from './embedding-service';
import { weaviateService } from './weaviate-service';
import { ProjectData } from './types';

type ImportOptions = {
  csvPath: string;
  dryRun?: boolean;
  limit?: number;
  resumeFrom?: number; // row index (0-based for data rows, excluding header)
};

const FALLBACK_NAMES: string[] = [
  'Alex Carter','Jordan Lee','Taylor Morgan','Riley Brooks','Casey Bennett','Sam Patel','Jamie Kim','Avery Nguyen','Drew Parker','Morgan Diaz',
  'Harper Shah','Rowan Myers','Skyler Cooper','Quinn Foster','Elliot Rivera','Parker Gomez','Reese Sullivan','Emerson Clark','Cameron Hayes','Sawyer Torres',
  'Finley Ward','Logan Price','Charlie Ramirez','Dakota Hughes','Hayden Flores','Kendall Jenkins','Payton Howard','Remy Reed','Sloan Murphy','Tatum Perry',
  'Blake Ortiz','Jude Barrett','Noel Castillo','Robin Watts','Shiloh Fernandez','Arden Bishop','Asa Holland','Marin Lowe','Rene Franklin','Sage Stephens'
];

const INSTITUTIONS: string[] = ['Stanford','Harvard','Oxford','IIT'];

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // 32-bit
  }
  return Math.abs(hash);
}

function toArrayOrCsv(cell: unknown): string[] {
  if (cell == null) return [];
  if (Array.isArray(cell)) return cell.map(String);
  const str = String(cell).trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v));
  } catch {}
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function cleanJsonbField(fieldData: any): string {
  if (!fieldData) return '';
  if (typeof fieldData === 'string') return fieldData;
  if (Array.isArray(fieldData)) {
    const items: string[] = [];
    for (const item of fieldData) {
      if (typeof item === 'object' && item !== null) {
        if ('title' in item) items.push((item as any).title);
        else if ('description' in item) items.push((item as any).description);
        else if ('content' in item) items.push((item as any).content);
        else items.push(String(item));
      } else {
        items.push(String(item));
      }
    }
    return items.join(', ');
  }
  if (typeof fieldData === 'object' && fieldData !== null) {
    if ('title' in fieldData) return (fieldData as any).title;
    if ('description' in fieldData) return (fieldData as any).description;
    if ('content' in fieldData) return (fieldData as any).content;
    return JSON.stringify(fieldData);
  }
  return String(fieldData);
}

function createTextBlob(projectData: ProjectData): string {
  const parts: string[] = [];
  if (projectData.title) parts.push(`Title: ${projectData.title}`);
  if (projectData.description) parts.push(`Description: ${projectData.description}`);
  if (projectData.categories?.length) parts.push(`Categories: ${projectData.categories.join(', ')}`);
  if (projectData.mentor_name) parts.push(`Mentor Name: ${projectData.mentor_name}`);
  if (projectData.mentor_institution) parts.push(`Mentor Institution: ${projectData.mentor_institution}`);
  const agenda = cleanJsonbField(projectData.agenda);
  if (agenda) parts.push(`Agenda: ${agenda}`);
  const prerequisites = cleanJsonbField(projectData.prerequisites);
  if (prerequisites) parts.push(`Prerequisites: ${prerequisites}`);
  const tools = cleanJsonbField(projectData.tools);
  if (tools) parts.push(`Tools: ${tools}`);
  return parts.join('\n');
}

export async function importProjectsFromCsv(options: ImportOptions) {
  const { csvPath, dryRun = false, limit, resumeFrom = 0 } = options;

  const absPath = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`CSV not found at ${absPath}`);
  }

  const raw = fs.readFileSync(absPath, 'utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const start = Math.max(0, resumeFrom);
  const endExclusive = limit ? Math.min(rows.length, start + limit) : rows.length;

  const summary = {
    total_rows: rows.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    dry_run: dryRun,
    errors: [] as Array<{ index: number; id?: string; error: string }>,
    sample: [] as Array<{ project_id: string; mentor_name: string; mentor_institution: string }>,
  };

  for (let i = start; i < endExclusive; i += 1) {
    const row = rows[i];
    summary.processed += 1;
    try {
      const idRaw = row['project_id'] || row['id'];
      if (!idRaw) throw new Error('Missing project_id/id');
      const projectId = String(idRaw);

      // Deterministic mentor fields
      const h = stableHash(projectId);
      const mentor_name = FALLBACK_NAMES[h % FALLBACK_NAMES.length];
      const mentor_institution = INSTITUTIONS[h % INSTITUTIONS.length];

      const categories = toArrayOrCsv(row['categories']);

      const createdAt = normalizeToRFC3339(row['created_at']) || new Date().toISOString();

      const project: ProjectData = {
        project_id: projectId,
        mentor_user_id: row['mentor_user'] ? String(row['mentor_user']) : '',
        title: row['title'] || '',
        description: row['description'] || '',
        categories,
        mentor_name,
        mentor_institution,
        agenda: row['agenda'] ? safeParse(row['agenda']) : undefined,
        prerequisites: row['prerequisites'] ? safeParse(row['prerequisites']) : undefined,
        tools: row['tools'] ? safeParse(row['tools']) : undefined,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      };

      if (summary.sample.length < 5) {
        summary.sample.push({ project_id: project.project_id, mentor_name, mentor_institution });
      }

      if (dryRun) {
        summary.succeeded += 1;
        continue;
      }

      const text = createTextBlob(project);
      const vector = await embeddingService.generateEmbedding(text);
      const ok = await weaviateService.upsertProject(project, vector);
      if (!ok) throw new Error('Weaviate upsert failed');

      summary.succeeded += 1;
    } catch (err: any) {
      summary.failed += 1;
      summary.errors.push({ index: i, id: rows[i]?.['project_id'] || rows[i]?.['id'], error: String(err?.message || err) });
    }
  }

  return summary;
}

function safeParse(value: string): any {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeToRFC3339(input?: string): string | undefined {
  if (!input) return undefined;
  // If already valid ISO/RFC3339, let Date parse check
  const tryDate = new Date(input);
  if (!Number.isNaN(tryDate.getTime())) {
    return tryDate.toISOString();
  }
  // Common Postgres format like '2025-07-18 05:19:07.80372+00'
  // Replace space with 'T' to be ISO-like
  const replaced = input.replace(' ', 'T');
  const tryDate2 = new Date(replaced);
  if (!Number.isNaN(tryDate2.getTime())) {
    return tryDate2.toISOString();
  }
  // Fallback: now
  return new Date().toISOString();
}


