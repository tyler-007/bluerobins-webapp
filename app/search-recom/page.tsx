"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type RecommendationItem = { project_id: string; title: string; distance?: number };
type QueryItem = { project_id: string; title: string; distances?: Record<string, number> } & Record<string, any>;

function ResultCard({ id, title, distance }: { id: string; title: string; distance?: number }) {
  return (
    <div className="rounded-xl border p-4 bg-white aspect-square w-56 sm:w-64 shrink-0 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="text-xs text-gray-500 truncate">ID: {id}</div>
        <div className="font-medium line-clamp-3 leading-snug">{title || "Untitled"}</div>
      </div>
      {typeof distance === "number" && (
        <div className="text-xs text-gray-600">distance: {distance.toFixed(4)}</div>
      )}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="aspect-square w-56 sm:w-64 rounded-xl bg-gray-100 animate-pulse shrink-0" />
  );
}

export default function SearchLabPage() {
  const [goalsStudentId, setGoalsStudentId] = useState("");
  const [goalsTopK, setGoalsTopK] = useState<number>(10);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsResult, setGoalsResult] = useState<JsonValue | null>(null);

  const [interestsStudentId, setInterestsStudentId] = useState("");
  const [interestsTopK, setInterestsTopK] = useState<number>(10);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [interestsResult, setInterestsResult] = useState<JsonValue | null>(null);

  const [queryText, setQueryText] = useState("");
  const [queryAlpha, setQueryAlpha] = useState<number>(0.5);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<JsonValue | null>(null);

  // Derived lists
  const goalsList = useMemo<RecommendationItem[]>(() => {
    const recs = (goalsResult as any)?.recommendations as RecommendationItem[] | undefined;
    return Array.isArray(recs) ? recs : [];
  }, [goalsResult]);

  const interestsList = useMemo<RecommendationItem[]>(() => {
    const recs = (interestsResult as any)?.recommendations as RecommendationItem[] | undefined;
    return Array.isArray(recs) ? recs : [];
  }, [interestsResult]);

  const queryList = useMemo<QueryItem[]>(() => {
    const res = (queryResult as any)?.results as QueryItem[] | undefined;
    return Array.isArray(res) ? res : [];
  }, [queryResult]);

  async function callGoals() {
    setGoalsLoading(true);
    setGoalsResult(null);
    try {
      const res = await fetch("/api/recommend/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: goalsStudentId.trim(), top_k: goalsTopK }),
      });
      const data = await res.json();
      setGoalsResult(data);
    } catch (e: any) {
      setGoalsResult({ error: e?.message || "Request failed" });
    } finally {
      setGoalsLoading(false);
    }
  }

  async function callInterests() {
    setInterestsLoading(true);
    setInterestsResult(null);
    try {
      const res = await fetch("/api/recommend/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: interestsStudentId.trim(), top_k: interestsTopK }),
      });
      const data = await res.json();
      setInterestsResult(data);
    } catch (e: any) {
      setInterestsResult({ error: e?.message || "Request failed" });
    } finally {
      setInterestsLoading(false);
    }
  }

  async function callQuery() {
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, search_type: "hybrid", alpha: queryAlpha }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (e: any) {
      setQueryResult({ error: e?.message || "Request failed" });
    } finally {
      setQueryLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-10">
      <h1 className="text-3xl font-bold">Search & Recommendation testing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="aspect-square">
          <CardHeader>
            <CardTitle>Goals Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goals-student-id">Student ID</Label>
              <Input
                id="goals-student-id"
                placeholder="825da8e8-fa34-4a4e-ab28-fb3aece196bd"
                value={goalsStudentId}
                onChange={(e) => setGoalsStudentId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals-topk">Top K</Label>
              <Input
                id="goals-topk"
                type="number"
                min={1}
                max={50}
                value={goalsTopK}
                onChange={(e) => setGoalsTopK(parseInt(e.target.value || "10", 10))}
              />
            </div>
            <Button onClick={callGoals} loading={goalsLoading}>
              Run Goals Recommendation
            </Button>
            <div className="mt-4 space-y-2">
              {goalsLoading ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                  <LoadingBlock />
                  <LoadingBlock />
                  <LoadingBlock />
                </div>
              ) : goalsList.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                  {goalsList.map((item, idx) => (
                    <div key={`${item.project_id}-${idx}`} className="snap-start">
                      <ResultCard id={item.project_id} title={item.title} distance={item.distance} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No results yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="aspect-square">
          <CardHeader>
            <CardTitle>Interests Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interests-student-id">Student ID</Label>
              <Input
                id="interests-student-id"
                placeholder="c7a7478f-600a-4f64-879a-bec37204a611"
                value={interestsStudentId}
                onChange={(e) => setInterestsStudentId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests-topk">Top K</Label>
              <Input
                id="interests-topk"
                type="number"
                min={1}
                max={50}
                value={interestsTopK}
                onChange={(e) => setInterestsTopK(parseInt(e.target.value || "10", 10))}
              />
            </div>
            <Button onClick={callInterests} loading={interestsLoading}>
              Run Interests Recommendation
            </Button>
            <div className="mt-4 space-y-2">
              {interestsLoading ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                  <LoadingBlock />
                  <LoadingBlock />
                  <LoadingBlock />
                </div>
              ) : interestsList.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                  {interestsList.map((item, idx) => (
                    <div key={`${item.project_id}-${idx}`} className="snap-start">
                      <ResultCard id={item.project_id} title={item.title} distance={item.distance} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No results yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Query Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query-text">Query</Label>
              <Input
                id="query-text"
                placeholder="biotech"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alpha-range">Alpha: {queryAlpha.toFixed(2)}</Label>
              <input
                id="alpha-range"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={queryAlpha}
                onChange={(e) => setQueryAlpha(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">Search type is fixed to "hybrid".</div>
            </div>
            <Button onClick={callQuery} loading={queryLoading}>
              Run Query
            </Button>
            <div className="mt-4 space-y-2">
              {queryLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <LoadingBlock />
                  <LoadingBlock />
                  <LoadingBlock />
                  <LoadingBlock />
                </div>
              ) : queryList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {queryList.map((item, idx) => {
                    const distance = item?.distances?.hybrid ?? item?.distances?.distance ?? item?.distances?.vector_distance;
                    return (
                      <ResultCard key={`${item.project_id}-${idx}`} id={item.project_id} title={item.title} distance={typeof distance === "number" ? distance : undefined} />
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No results yet.</div>
              )}
            </div>
          </CardContent>
      </Card>
    </div>
  );
}


