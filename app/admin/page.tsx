"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect, useRouter } from "next/navigation";
import { createClient as clientClient } from "@/utils/supabase/client";

export default function AdminDashboard() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const router = useRouter();
  const supabase = clientClient();

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent-links/pending");
      const data = await res.json();
      if (data.success) {
        setPending(data.pending);
      } else {
        setError(data.message || "Failed to fetch pending requests");
      }
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (parent_id: string, student_id: string) => {
    setActionStatus(null);
    try {
      const res = await fetch("/api/parent-links/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id, student_id }),
      });
      const data = await res.json();
      if (data.success) {
        setActionStatus("Approved successfully");
        fetchPending();
      } else {
        setActionStatus(data.message || "Failed to approve");
      }
    } catch (e: any) {
      setActionStatus(e.message || "Unknown error");
    }
  };

  const handleReject = (parent_id: string, student_id: string) => {
    setActionStatus("Reject not implemented yet");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
      </div>
      <h2 className="text-2xl font-bold mb-4">Pending Parent-Child Link Requests</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : pending.length === 0 ? (
        <div className="text-gray-600">No pending requests.</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Parent</th>
              <th className="border px-4 py-2">Student</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((req) => (
              <tr key={req.id}>
                <td className="border px-4 py-2">
                  {req.parent?.name} <br />
                  <span className="text-xs text-gray-500">{req.parent?.email}</span>
                </td>
                <td className="border px-4 py-2">
                  {req.student?.parent_name} <br />
                  <span className="text-xs text-gray-500">{req.student?.grade}, {req.student?.institution_name}</span>
                </td>
                <td className="border px-4 py-2 flex gap-2">
                  <button
                    className="text-green-600 hover:underline"
                    title="Approve"
                    onClick={() => handleApprove(req.parent_id, req.student_id)}
                  >
                    ✔️
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    title="Reject"
                    onClick={() => handleReject(req.parent_id, req.student_id)}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {actionStatus && <div className="mt-4 text-blue-600">{actionStatus}</div>}
    </div>
  );
} 