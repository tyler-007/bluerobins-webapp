import { NextRequest, NextResponse } from 'next/server';
import { importProjectsFromCsv } from '@/lib/search/csv-importer';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const qsDryRun = url.searchParams.get('dry_run');
    const qsLimit = url.searchParams.get('limit');
    const qsResumeFrom = url.searchParams.get('resume_from');

    const body = (await request.json().catch(() => ({}))) as Partial<{
      filePath: string;
      dry_run: boolean;
      limit: number;
      resume_from: number;
    }>;

    const resolveBoolean = (raw: unknown, defaultVal: boolean): boolean => {
      if (raw === undefined || raw === null || raw === '') return defaultVal;
      const str = String(raw).toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(str)) return true;
      if (['0', 'false', 'no', 'off'].includes(str)) return false;
      return defaultVal;
    };

    const dryRun = resolveBoolean(qsDryRun ?? body.dry_run, true);
    const limit = Number(qsLimit ?? body.limit ?? NaN);
    const resumeFrom = Number(qsResumeFrom ?? body.resume_from ?? NaN);

    const csvPath = body.filePath || '/Users/aayushjain/codes/projects/company assignements/Big Vision/BV_bluerobin/v4/web-app 2/projects_rows_Aug11.csv';

    const summary = await importProjectsFromCsv({
      csvPath,
      dryRun,
      limit: Number.isFinite(limit) ? limit : undefined,
      resumeFrom: Number.isFinite(resumeFrom) ? resumeFrom : 0,
    });

    return NextResponse.json({ status: 'ok', ...summary });
  } catch (error) {
    console.error('❌ CSV import error:', error);
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'weaviate-import-csv',
    timestamp: new Date().toISOString(),
    usage: 'POST ?dry_run=1&limit=10&resume_from=0 with optional JSON { filePath }',
  });
}


