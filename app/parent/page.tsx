"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface ParentProfile {
  id: string;
}

export default function ParentDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);

      // Fetch parent profile
      const { data: parentProfile } = await supabase
        .from("parent_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!parentProfile) {
        setParentProfile(null);
        setLoading(false);
        return;
      }
      setParentProfile(parentProfile);

      // Fetch children
      const res = await fetch(`/api/parent-links/children?parent_id=${parentProfile.id}`);
      const data = await res.json();
      setChildren(data.children || []);
      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!parentProfile) {
    return (
      <div className="p-4 bg-yellow-100 rounded border text-yellow-800">
        No parent profile found. Please complete your parent onboarding.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
      </div>
      <h2 className="text-2xl font-bold mb-4">Your Children</h2>
      {children.length > 0 ? (
        <ul className="mb-6">
          {children.map((child: any) => (
            <li key={child.id} className="mb-2">
              <Link href={`/parent/child/${child.id}`} className="text-blue-600 underline">
                {child.name} ({child.grade}, {child.institution_name})
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-600 mb-6">No children linked to your account.</div>
      )}
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Raw API Response (debug):</h3>
        <pre className="p-4 bg-gray-100 rounded border overflow-auto">{JSON.stringify(children, null, 2)}</pre>
      </div>
    </div>
  );
} 