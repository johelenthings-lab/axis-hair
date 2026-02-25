import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Clock, CheckCircle } from "lucide-react";

const metrics = [
  { label: "This Week's Consultations", value: "24", sub: "+3 from last week" },
  { label: "Client Approval Rate", value: "91%", sub: "Above average" },
  { label: "Rebooking Rate", value: "78%", sub: "Steady" },
  { label: "Est. Revenue This Week", value: "$4,280", sub: "+12% growth" },
];

const clients = [
  { name: "Maya Johnson", status: "Approved", date: "Feb 26, 2026", service: "Precision Cut + Color" },
  { name: "Liam Chen", status: "Preview Generated", date: "Feb 27, 2026", service: "Texture Consultation" },
  { name: "Ava Williams", status: "Photo Uploaded", date: "Feb 27, 2026", service: "Full Transformation" },
  { name: "James Park", status: "Revision Requested", date: "Feb 28, 2026", service: "Shape & Style" },
  { name: "Sophia Davis", status: "Approved", date: "Mar 1, 2026", service: "Cut + Finish" },
];

const statusStyle = (status: string) => {
  switch (status) {
    case "Approved": return "text-foreground font-medium";
    case "Preview Generated": return "text-muted-foreground";
    case "Photo Uploaded": return "text-muted-foreground";
    case "Revision Requested": return "text-foreground/70 italic";
    default: return "text-muted-foreground";
  }
};

const Dashboard = () => {
  const navigate = useNavigate();

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
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
            {clients.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/client-view/${i + 1}`)}
              >
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <span className={`text-sm ${statusStyle(c.status)}`}>{c.status}</span>
                <span className="text-sm text-muted-foreground">{c.date}</span>
                <span className="text-sm text-muted-foreground">{c.service}</span>
              </div>
            ))}
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
