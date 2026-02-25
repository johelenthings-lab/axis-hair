import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Clock, CheckCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface ConsultationRow {
  id: string;
  status: string;
  estimated_price: number | null;
  appointment_date: string | null;
  clients: { full_name: string } | null;
}

const statusLabel: Record<string, string> = {
  photo_uploaded: "Photo Uploaded",
  preview_generated: "Preview Generated",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  revision_requested: "Revision Requested",
};

const statusStyle = (status: string) => {
  switch (status) {
    case "approved": return "text-foreground font-medium";
    case "revision_requested": return "text-foreground/70 italic";
    default: return "text-muted-foreground";
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("consultations")
      .select("id, status, estimated_price, appointment_date, clients(full_name)")
      .order("created_at", { ascending: false });
    setConsultations((data as ConsultationRow[] | null) ?? []);
    setLoading(false);
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeek = consultations.filter((c) => {
    if (!c.appointment_date) return false;
    const d = new Date(c.appointment_date);
    return d >= weekStart && d <= weekEnd;
  });

  const total = consultations.length;
  const approvedCount = consultations.filter((c) => c.status === "approved").length;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  const approvedWithPrice = consultations.filter(
    (c) => c.status === "approved" && c.estimated_price != null && c.appointment_date != null
  );

  const revenueIn = (start: Date, end: Date) =>
    approvedWithPrice
      .filter((c) => { const d = new Date(c.appointment_date!); return d >= start && d <= end; })
      .reduce((sum, c) => sum + (c.estimated_price ?? 0), 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  const weeklyRevenue = revenueIn(weekStart, weekEnd);
  const monthlyRevenue = revenueIn(monthStart, monthEnd);
  const yearlyRevenue = revenueIn(yearStart, yearEnd);
  const lifetimeRevenue = approvedWithPrice.reduce((sum, c) => sum + (c.estimated_price ?? 0), 0);

  const fmt = (v: number) => `$${v.toLocaleString()}`;

  const metrics = [
    { label: "This Week's Consultations", value: String(thisWeek.length), sub: `${total} total` },
    { label: "Client Approval Rate", value: `${approvalRate}%`, sub: total > 0 ? `${approvedCount} of ${total}` : "No data yet" },
    { label: "Est. Revenue This Week", value: fmt(weeklyRevenue), sub: "Approved consultations" },
    { label: "Est. Revenue This Month", value: fmt(monthlyRevenue), sub: format(monthStart, "MMMM yyyy") },
    { label: "Est. Revenue This Year", value: fmt(yearlyRevenue), sub: String(now.getFullYear()) },
    { label: "Total Lifetime Revenue", value: fmt(lifetimeRevenue), sub: `${approvedWithPrice.length} approved` },
  ];


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b border-border px-6 md:px-12 py-4 flex items-center justify-between">
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground hidden md:inline">
            Dashboard
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <section className="bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <h2 className="font-display text-xs tracking-[0.25em] uppercase text-accent-foreground/50 mb-8">
            Performance Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 md:gap-10">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                  {m.value}
                </p>
                <p className="text-xs tracking-[0.12em] uppercase text-accent-foreground/60 mt-2">
                  {m.label}
                </p>
                <p className="text-xs text-accent-foreground/40 mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid lg:grid-cols-3 gap-10">
        {/* Client Activity */}
        <div className="lg:col-span-2">
          <h3 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6">
            Client Activity
          </h3>
          <div className="border border-border rounded-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-3 border-b border-border bg-muted/30">
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Client</span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Status</span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Appointment</span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Service</span>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-center">
                <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
              </div>
            ) : consultations.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <span className="text-sm text-muted-foreground">No consultations yet. Create your first one.</span>
              </div>
            ) : (
              consultations.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/client-view/${c.id}`)}
                >
                  <span className="text-sm font-medium text-foreground">
                    {c.clients?.full_name ?? "Unknown"}
                  </span>
                  <span className={`text-sm ${statusStyle(c.status)}`}>
                    {statusLabel[c.status] ?? c.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {c.appointment_date ? format(new Date(c.appointment_date), "MMM d, yyyy") : "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/consultation/new")}
              className="w-full justify-start gap-3 bg-accent text-accent-foreground hover:opacity-90 h-12 tracking-[0.12em] uppercase text-xs font-semibold"
            >
              <Plus className="h-4 w-4" /> New Consultation
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 tracking-[0.12em] uppercase text-xs border-border"
            >
              <Clock className="h-4 w-4" /> View Client History
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 tracking-[0.12em] uppercase text-xs border-border"
            >
              <CheckCircle className="h-4 w-4" /> Pending Approvals
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
