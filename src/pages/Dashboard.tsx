import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Users, Clock, CheckCircle } from "lucide-react";
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
  cancelled: "Cancelled",
};

const statusStyle = (status: string) => {
  switch (status) {
    case "approved": return "text-foreground font-medium";
    case "revision_requested": return "text-foreground/70 italic";
    case "cancelled": return "text-destructive/60 line-through";
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

  const active = consultations.filter((c) => c.status !== "cancelled");
  const cancelled = consultations.filter((c) => c.status === "cancelled");

  const thisWeek = active.filter((c) => {
    if (!c.appointment_date) return false;
    const d = new Date(c.appointment_date);
    return d >= weekStart && d <= weekEnd;
  });

  const total = active.length;
  const approvedCount = active.filter((c) => c.status === "approved").length;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
  const awaitingApproval = active.filter((c) => c.status === "awaiting_approval").length;
  const upcoming = active.filter((c) => {
    if (!c.appointment_date) return false;
    return new Date(c.appointment_date) >= now;
  }).length;

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

  const hasFocusData = thisWeek.length > 0 || awaitingApproval > 0 || upcoming > 0 || weeklyRevenue > 0;

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

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">

        {/* Welcome Banner — first-time only */}
        {!loading && consultations.length === 0 && (
          <section className="border border-border rounded-sm p-8 md:p-10 text-center space-y-3">
            <h2 className="font-display text-lg font-semibold tracking-[0.08em] text-foreground">
              Welcome to AXIS HAIR™
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start by creating your first consultation. The system will guide you through the rest.
            </p>
            <Button
              onClick={() => navigate("/consultation/new")}
              className="mt-2 bg-accent text-accent-foreground hover:opacity-90 tracking-[0.12em] uppercase text-xs font-semibold rounded-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Consultation
            </Button>
          </section>
        )}
        {/* 1️⃣ Today's Focus */}
        <section className="bg-accent text-accent-foreground rounded-sm p-8 md:p-10">
          <div className="flex items-start justify-between mb-6">
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-accent-foreground/50">
              Today's Focus
            </h2>
            <span className="text-[10px] tracking-[0.2em] uppercase text-accent-foreground/30 font-medium">
              System Status: {awaitingApproval > 0 ? "Action Required" : "Stable"}
            </span>
          </div>
          {hasFocusData ? (
            <ul className="space-y-2">
              <li className="text-sm text-accent-foreground/80">
                You have <span className="font-semibold text-accent-foreground">{thisWeek.length}</span> consultation{thisWeek.length !== 1 ? "s" : ""} scheduled this week.
              </li>
              <li className="text-sm text-accent-foreground/80">
                {awaitingApproval > 0
                  ? <><span className="font-semibold text-accent-foreground">{awaitingApproval}</span> consultation{awaitingApproval !== 1 ? "s" : ""} require{awaitingApproval === 1 ? "s" : ""} your approval.</>
                  : "No consultations require approval."}
              </li>
              {awaitingApproval > 0 && (
                <li className="text-sm text-accent-foreground/50">
                  Review pending consultations to keep your schedule moving.
                </li>
              )}
              <li className="text-sm text-accent-foreground/80">
                You have <span className="font-semibold text-accent-foreground">{upcoming}</span> upcoming appointment{upcoming !== 1 ? "s" : ""}.
              </li>
              <li className="text-sm text-accent-foreground/80">
                Estimated revenue on schedule this week: <span className="font-semibold text-accent-foreground">{fmt(weeklyRevenue)}</span>.
              </li>
              {weeklyRevenue === 0 && (
                <li className="text-sm text-accent-foreground/50">
                  No approved appointments yet this week. Confirm consultations to activate revenue tracking.
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-accent-foreground/60 italic">
              You're clear for today. Time to grow.
            </p>
          )}
        </section>

        {/* 2️⃣ Quick Actions */}
        <section className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate("/consultation/new")}
            className="flex-1 justify-start gap-3 bg-accent text-accent-foreground hover:opacity-90 h-13 tracking-[0.12em] uppercase text-xs font-semibold rounded-sm"
          >
            <Plus className="h-4 w-4" /> New Consultation
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/clients")}
            className="flex-1 justify-start gap-3 h-13 tracking-[0.12em] uppercase text-xs border-border rounded-sm"
          >
            <Users className="h-4 w-4" /> View Clients
          </Button>
        </section>

        {/* 3️⃣ Metrics — secondary emphasis */}
        <section>
          <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground/50 mb-6">
            Performance Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 md:gap-8">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground/80">
                  {m.value}
                </p>
                <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mt-2">
                  {m.label}
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4️⃣ Client Activity */}
        <section>
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
            ) : active.length === 0 ? (
              <div className="px-8 py-16 text-center space-y-4">
                <h3 className="font-display text-lg font-semibold tracking-[0.05em] text-foreground">
                  You're Ready to Begin.
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Start your first consultation to see client previews, AI recommendations, and revenue tracking in action.
                </p>
                <Button
                  onClick={() => navigate("/consultation/new")}
                  className="mt-2 bg-accent text-accent-foreground hover:opacity-90 tracking-[0.12em] uppercase text-xs font-semibold rounded-sm"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create First Consultation
                </Button>
                <p className="text-xs text-muted-foreground/50 mt-4">
                  Most stylists begin with an existing client.
                </p>
              </div>
            ) : (
              active.map((c) => (
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

          {/* Cancelled — subtle */}
          {cancelled.length > 0 && (
            <div className="mt-8">
              <div className="h-px w-full bg-border/40 mb-6" />
              <h3 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground/40 mb-4">
                Cancelled Appointments ({cancelled.length})
              </h3>
              <div className="border border-border/40 rounded-sm overflow-hidden opacity-50">
                {cancelled.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-4 px-6 py-3 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => navigate(`/client-view/${c.id}`)}
                  >
                    <span className="text-sm text-muted-foreground">
                      {c.clients?.full_name ?? "Unknown"}
                    </span>
                    <span className={`text-sm ${statusStyle(c.status)}`}>
                      {statusLabel[c.status]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {c.appointment_date ? format(new Date(c.appointment_date), "MMM d, yyyy") : "—"}
                    </span>
                    <span className="text-sm text-muted-foreground">—</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
