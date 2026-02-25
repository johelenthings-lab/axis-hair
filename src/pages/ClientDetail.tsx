import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { format } from "date-fns";

interface ClientData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface ConsultationRow {
  id: string;
  status: string;
  estimated_price: number | null;
  appointment_date: string | null;
  service_type: string;
  created_at: string;
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

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    const [{ data: clientData }, { data: consultData }] = await Promise.all([
      supabase.from("clients").select("id, full_name, email, phone").eq("id", clientId!).single(),
      supabase
        .from("consultations")
        .select("id, status, estimated_price, appointment_date, service_type, created_at")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false }),
    ]);

    setClient(clientData as ClientData | null);
    setConsultations((consultData as ConsultationRow[] | null) ?? []);
    setLoading(false);
  };

  const lifetimeRevenue = consultations
    .filter((c) => c.status === "approved" && c.estimated_price != null)
    .reduce((sum, c) => sum + (c.estimated_price ?? 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Client not found.</p>
          <Button variant="outline" onClick={() => navigate("/clients")} className="text-xs tracking-[0.1em] uppercase">
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 md:px-12 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 space-y-10">
        {/* Client Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase text-foreground mb-1">
              {client.full_name}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>{client.phone}</span>}
              {!client.email && !client.phone && <span>No contact info on file</span>}
            </div>
          </div>
          <Button
            onClick={() => navigate("/consultation/new")}
            className="bg-accent text-accent-foreground hover:opacity-90 tracking-[0.12em] uppercase text-xs font-semibold rounded-sm h-10 px-6"
          >
            <Plus className="h-4 w-4 mr-2" /> New Consultation for This Client
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-foreground/80">
              ${lifetimeRevenue.toLocaleString()}
            </p>
            <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mt-1">
              Lifetime Revenue
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-foreground/80">
              {consultations.length}
            </p>
            <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mt-1">
              Total Consultations
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-foreground/80">
              {consultations.filter((c) => c.status === "approved").length}
            </p>
            <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mt-1">
              Approved
            </p>
          </div>
        </div>

        {/* Consultation History */}
        <section>
          <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6">
            Consultation History
          </h2>
          <div className="border border-border rounded-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 border-b border-border bg-muted/30">
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Date Created</span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Appointment</span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Service</span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Status</span>
              <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Price</span>
            </div>

            {consultations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">No consultations yet for this client.</p>
              </div>
            ) : (
              consultations.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-5 gap-1 md:gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/client-view/${c.id}`)}
                >
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(c.created_at), "MMM d, yyyy")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {c.appointment_date ? format(new Date(c.appointment_date), "MMM d, yyyy") : "—"}
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {c.service_type === "full_preview" ? "Full Consultation" : "Quick Maintenance"}
                  </span>
                  <span className={`text-sm ${statusStyle(c.status)}`}>
                    {statusLabel[c.status] ?? c.status}
                  </span>
                  <span className="text-sm text-foreground">
                    {c.estimated_price != null ? `$${c.estimated_price.toLocaleString()}` : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ClientDetail;
