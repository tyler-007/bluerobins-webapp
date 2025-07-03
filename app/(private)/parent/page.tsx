"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ParentOnboarding from "./ParentOnboarding";
import ChildrenSelection from "./ChildrenSelection";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StarDisplay } from "./components/StarDisplay";
import { getCart, markCartPaid, parentPayAndBookCart } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/PaymentDialog";
import { toast } from "@/components/ui/use-toast";

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [childrenLinks, setChildrenLinks] = useState<any[]>([]);
  const [childrenProfiles, setChildrenProfiles] = useState<any[]>([]);
  const [notesByChild, setNotesByChild] = useState<any>({});
  const [progressByChild, setProgressByChild] = useState<any>({});
  const [reviewsByChild, setReviewsByChild] = useState<any>({});
  const [pendingLinks, setPendingLinks] = useState<any[]>([]);
  const [cartsByChild, setCartsByChild] = useState<any>({});
  const [showPaymentDialogFor, setShowPaymentDialogFor] = useState<string | null>(null);
  const [payingCartId, setPayingCartId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [userNamesById, setUserNamesById] = useState<any>({});
  const [profileNamesById, setProfileNamesById] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndLinks = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/");
        return;
      }
      setUser(userData.user);
      // Fetch parent profile
      const { data: parentProfile } = await supabase
        .from("parent_profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .single();
      setProfile(parentProfile);
      // Fetch children links (approved and pending)
      let approvedLinks: any[] = [];
      let pending: any[] = [];
      if (parentProfile) {
        const { data: links } = await supabase
          .from("parent_student_links")
          .select("*")
          .eq("parent_id", parentProfile.id);
        approvedLinks = (links || []).filter((l) => l.approved === true);
        pending = (links || []).filter((l) => l.approved === false);
        setChildrenLinks(approvedLinks);
        setPendingLinks(pending);
      }
      setLoading(false);
    };
    fetchUserAndLinks();
  }, [router]);

  useEffect(() => {
    const fetchProfilesAndNotes = async () => {
      if (childrenLinks.length > 0) {
        const supabase = createClient();
        const studentIds = childrenLinks.map((l) => l.student_id);
        const { data: students } = await supabase
          .from("student_profiles")
          .select("id, grade, institution_name, parent_name")
          .in("id", studentIds);
        setChildrenProfiles(students || []);
        // Fetch names from profiles table
        if (students && students.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', students.map((s: any) => s.id));
          const nameMap: Record<string, string> = {};
          (profiles || []).forEach((p: any) => {
            nameMap[p.id] = p.name || "(No Name)";
          });
          setProfileNamesById(nameMap);
        } else {
          setProfileNamesById({});
        }
        // Fetch user names from auth.users
        if (students && students.length > 0) {
          const { data: users } = await supabase
            .from('auth.users')
            .select('id, user_metadata')
            .in('id', students.map((s: any) => s.id));
          const userMap: Record<string, string> = {};
          (users || []).forEach((u: any) => {
            userMap[u.id] = u.user_metadata?.full_name || "(No Name)";
          });
          setUserNamesById(userMap);
        } else {
          setUserNamesById({});
        }
        // Fetch notes and progress for each child
        const notesObj: any = {};
        const progressObj: any = {};
        const reviewsObj: any = {};
        const cartsObj: any = {};
        for (const student of students || []) {
          // Fetch notes
          const { data: notes } = await supabase
            .from("project_notes")
            .select("*")
            .eq("student_id", student.id)
            .in("visibility", ["shared", "mentor_only"]);
          // Group notes by week
          const grouped = (notes || []).reduce((acc: any, note: any) => {
            acc[note.week_number] = acc[note.week_number] || [];
            acc[note.week_number].push(note);
            return acc;
          }, {});
          notesObj[student.id] = grouped;

          // Fetch bookings for progress
          const { data: bookings } = await supabase
            .from("bookings")
            .select("project_id, status, projects(title)")
            .eq("by", student.id);
          
          const progressByProject = (bookings || []).reduce((acc: any, booking: any) => {
            if (!booking.project_id) return acc;
            acc[booking.project_id] = acc[booking.project_id] || { completed: 0, total: 0, title: booking.projects.title };
            acc[booking.project_id].total++;
            if (booking.status === 'completed') {
              acc[booking.project_id].completed++;
            }
            return acc;
          }, {});

          progressObj[student.id] = progressByProject;

          // Fetch reviews
          const { data: reviews } = await supabase
            .from("reviews")
            .select("*, bookings(title)")
            .eq("student_id", student.id);
          
          reviewsObj[student.id] = reviews || [];

          // Fetch cart for this child
          const cartRes = await getCart(student.id);
          if (cartRes.success) {
            cartsObj[student.id] = cartRes.cart;
          } else {
            cartsObj[student.id] = null;
          }
        }
        setNotesByChild(notesObj);
        setProgressByChild(progressObj);
        setReviewsByChild(reviewsObj);
        setCartsByChild(cartsObj);
      } else {
        setChildrenProfiles([]);
        setNotesByChild({});
        setProgressByChild({});
        setReviewsByChild({});
        setCartsByChild({});
      }
    };
    fetchProfilesAndNotes();
  }, [childrenLinks]);

  if (loading) return <div className="p-8">Loading...</div>;

  // If no parent profile, show onboarding
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ParentOnboarding userId={user.id} email={user.email} />
      </div>
    );
  }

  // If no links at all, show children selection
  if ((!childrenLinks || childrenLinks.length === 0) && (!pendingLinks || pendingLinks.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ChildrenSelection parentId={profile.id} />
      </div>
    );
  }

  // If pending links, show pending message
  if (pendingLinks && pendingLinks.length > 0 && (!childrenLinks || childrenLinks.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <h2 className="text-2xl font-bold mb-6">Pending Approval</h2>
        <div className="flex flex-col gap-4 w-full max-w-xl">
          {pendingLinks.map((link) => (
            <div key={link.student_id} className="bg-white rounded-lg p-4 border shadow">
              <span>Request pending for student ID: {link.student_id}</span>
            </div>
          ))}
        </div>
        <div className="text-gray-500 mt-8">Your request is pending admin approval.</div>
      </div>
    );
  }

  // Show approved children and their notes (full-width, no sidebar)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <h2 className="text-2xl font-bold mb-6">Your Children & Weekly Logs</h2>
      <div className="flex flex-col gap-8 w-full max-w-2xl">
        {childrenProfiles.map((child) => (
          <Card key={child.id} className="w-full">
            <CardHeader>
              <CardTitle>{profileNamesById[child.id] || "(No Name)"}</CardTitle>
              <CardDescription>
                Grade: {child.grade} | Institution: {child.institution_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Cart</h4>
                {cartsByChild[child.id] && cartsByChild[child.id].student_cart_items?.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-2 mb-2">
                      {cartsByChild[child.id].student_cart_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-1">
                          <span>{item.projects?.title || "Project"} <span className="text-xs text-gray-500">(Mentor: {item.mentor_profiles?.name || "-"})</span></span>
                          <span className="text-sm">${item.projects?.selling_price || "-"}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total:</span>
                      <span>${cartsByChild[child.id].student_cart_items.reduce((sum: number, item: any) => sum + (Number(item.projects?.selling_price) || 0), 0)}</span>
                    </div>
                    {cartsByChild[child.id].status === "paid" ? (
                      <div className="text-green-600 font-bold mt-2">Paid</div>
                    ) : (
                      <Button
                        className="mt-2"
                        loading={payingCartId === cartsByChild[child.id].id}
                        disabled={payingCartId === cartsByChild[child.id].id}
                        onClick={() => setShowPaymentDialogFor(child.id)}
                      >
                        Pay for Cart
                      </Button>
                    )}
                    <PaymentDialog
                      open={showPaymentDialogFor === child.id}
                      onOpenChange={(open) => setShowPaymentDialogFor(open ? child.id : null)}
                      amount={cartsByChild[child.id].student_cart_items.reduce((sum: number, item: any) => sum + (Number(item.projects?.selling_price) || 0), 0)}
                      onSuccess={async (order) => {
                        setPaying(true);
                        setPayingCartId(cartsByChild[child.id].id);
                        const res = await parentPayAndBookCart({ childId: child.id, parentId: profile.id, paymentDetails: order });
                        if (res.success) {
                          toast({ title: "Payment successful!", description: "Cart has been paid and sessions booked.", variant: "default" });
                          // Refetch cart for this child
                          const cartRes = await getCart(child.id);
                          setCartsByChild((prev: any) => ({ ...prev, [child.id]: cartRes.success ? cartRes.cart : null }));
                          setShowPaymentDialogFor(null);
                        } else {
                          toast({ title: "Error", description: res.error || "Could not complete payment.", variant: "destructive" });
                        }
                        setPaying(false);
                        setPayingCartId(null);
                      }}
                      onError={() => setShowPaymentDialogFor(null)}
                      onCancel={() => setShowPaymentDialogFor(null)}
                      summary={<div>Pay <b>${cartsByChild[child.id].student_cart_items.reduce((sum: number, item: any) => sum + (Number(item.projects?.selling_price) || 0), 0)}</b> for all projects in {profileNamesById[child.id] || "this child"}'s cart.</div>}
                    />
                  </>
                ) : (
                  <div className="text-gray-400">No items in cart.</div>
                )}
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Progress</h4>
                {progressByChild[child.id] && Object.keys(progressByChild[child.id]).length > 0 ? (
                  Object.values(progressByChild[child.id]).map((progress: any, index: number) => (
                    <div key={index} className="mb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{progress.title}</span>
                        <span className="text-sm text-gray-600">{progress.completed} / {progress.total} sessions completed</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(progress.completed / progress.total) * 100}%` }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">No projects started yet.</div>
                )}
              </div>
              <h4 className="font-semibold mb-2 mt-6">Weekly Logs</h4>
              {notesByChild[child.id] && Object.keys(notesByChild[child.id]).length > 0 ? (
                Object.entries(notesByChild[child.id]).map(([week, notes]: any) => (
                  <div key={week} className="mb-4">
                    <div className="font-semibold mb-1">Week {week}</div>
                    {notes.map((note: any) => (
                      <div key={note.id} className="mb-2 pl-2 border-l-2 border-blue-200">
                        <div className="text-sm font-medium">
                          {note.author_type === "student" ? "👨‍🎓 Student note" : "👩‍🏫 Mentor feedback"}
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap text-sm">{note.note_text}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(note.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No notes yet.</div>
              )}
              <h4 className="font-semibold mb-2 mt-6">Session Feedback</h4>
              {reviewsByChild[child.id] && reviewsByChild[child.id].length > 0 ? (
                reviewsByChild[child.id].map((review: any) => (
                  <div key={review.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{review.bookings.title || 'Session Review'}</span>
                      <StarDisplay rating={review.rating} />
                    </div>
                    {review.feedback && (
                      <p className="text-gray-700 text-sm">{review.feedback}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No feedback submitted yet.</div>
              )}
            </CardContent>
          </Card>
        ))}
        {childrenProfiles.length === 0 && <div className="text-gray-500">No approved children yet.</div>}
      </div>
    </div>
  );
} 