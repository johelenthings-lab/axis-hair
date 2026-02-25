import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { format } from "date-fns";

interface ClientWithStats {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  totalConsultations: number;
  approvedRevenue: number;
  lastAppointment: string | null;
  status: "Active" | "Cancelled" | "Pending";
}

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data: clientsData } = await supabase
      .from("clients")
      .select("id, full_name, email, phone");

    if (!clientsData) {
      setLoading(false);
      return;
    }

    const { data: consultationsData } = await supabase
      .from("consultations")
      .select("client_id, status, estimated_price, appointment_date");

    const consultations = consultationsData ?? [];

    const enriched: ClientWithStats[] = clientsData.map((client) => {
      const clientConsultations = consultations.filter((c) => c.client_id === client.id);
      const approved = clientConsultations.filter((c) => c.status === "approved");
      const approvedRevenue = approved.reduce((sum, c) => sum + (c.estimated_price ?? 0), 0);

      const allDates = clientConsultations
        .filter((c) => c.appointment_date)
        .map((c) => new Date(c.appointment_date!).getTime());
      const lastAppointment = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : null;

      const statuses = clientConsultations.map((c) => c.status);
      let status: ClientWithStats["status"] = "Pending";
      if (statuses.every((s) => s === "cancelled")) {
        status = "Cancelled";
      } else if (statuses.some((s) => s === "approved" || s === "awaiting_approval" || s === "preview_generated")) {
        status = "Active";
      }

      return {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        totalConsultations: clientConsultations.length,
        approvedRevenue,
        lastAppointment,
        status,
      };
    });

    // Sort by most recent appointment
    enriched.sort((a, b) => {
      if (!a.lastAppointment && !b.lastAppointment) return 0;
      if (!a.lastAppointment) return 1;
      if (!b.lastAppointment) return -1;
      return new Date(b.lastAppointment).getTime() - new Date(a.lastAppointment).getTime();
    });

    setClients(enriched);
    setLoading(false);
  };

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const statusStyle = (status: string) => {
    switch (status) {
      case "Active": return "text-foreground font-medium";
      case "Cancelled": return "text-destructive/60";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 md:px-12 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 space-y-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase text-foreground mb-2">
            Client Management
          </h1>
          <p className="text-sm text-muted-foreground">
            View client history and performance at a glance.
          </p>
        </div>

        {/* Search + New */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name..."
              className="pl-10 bg-background border-border"
            />
          </div>
          <Button
            onClick={() => navigate("/consultation/new")}
            className="bg-accent text-accent-foreground hover:opacity-90 tracking-[0.12em] uppercase text-xs font-semibold rounded-sm h-10 px-6"
          >
            <Plus className="h-4 w-4 mr-2" /> New Consultation
          </Button>
        </div>

        {/* Table */}
        <div className="border border-border rounded-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-3 border-b border-border bg-muted/30">
            <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Client</span>
            <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Last Appointment</span>
            <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Approved Revenue</span>
            <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Consultations</span>
            <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Status</span>
            <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Action</span>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center">
              <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? "No clients match your search." : "No clients yet. Create your first consultation to get started."}
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-1 md:gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{c.full_name}</span>
                <span className="text-sm text-muted-foreground">
                  {c.lastAppointment ? format(new Date(c.lastAppointment), "MMM d, yyyy") : "—"}
                </span>
                <span className="text-sm text-foreground">
                  ${c.approvedRevenue.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">{c.totalConsultations}</span>
                <span className={`text-sm ${statusStyle(c.status)}`}>{c.status}</span>
                <span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground px-0"
                  >
                    View
                  </Button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
