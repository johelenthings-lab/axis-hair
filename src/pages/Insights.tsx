import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";

const Insights = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalClients, setTotalClients] = useState(0);
    const [totalConsultations, setTotalConsultations] = useState(0);
    const [completedThisMonth, setCompletedThisMonth] = useState(0);

    useEffect(() => {
        checkAccessAndFetchData();
    }, []);

    const checkAccessAndFetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/login");
                return;
            }

            // Check tier
            const { data: profile } = await supabase
                .from("profiles")
                .select("subscription_status")
                .eq("user_id", user.id)
                .single();

            if (!profile || profile.subscription_status === "canceled") {
                setLoading(false);
                setIsAuthorized(false);
                return;
            }

            setIsAuthorized(true);

            // Fetch analytics data
            const { data: consultations } = await supabase
                .from("consultations")
                .select("id, status, estimated_price, appointment_date, client_id")
                .neq("status", "cancelled");

            if (consultations) {
                const uniqueClients = new Set(consultations.map(c => c.client_id));
                setTotalClients(uniqueClients.size);
                setTotalConsultations(consultations.length);

                const rev = consultations
                    .filter(c => c.status === "approved" && c.estimated_price)
                    .reduce((sum, c) => sum + (c.estimated_price || 0), 0);
                setTotalRevenue(rev);

                const now = new Date();
                const startOfCurrentMonth = startOfMonth(now);
                const endOfCurrentMonth = endOfMonth(now);

                const thisMonth = consultations.filter(c => {
                    if (!c.appointment_date || c.status !== "approved") return false;
                    const date = new Date(c.appointment_date);
                    return date >= startOfCurrentMonth && date <= endOfCurrentMonth;
                }).length;

                setCompletedThisMonth(thisMonth);
            }

        } catch (error) {
            console.error("Error fetching insights:", error);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v: number) => t("price_format", { val: v.toLocaleString() });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-sm text-muted-foreground animate-pulse">Loading Analytics...</p>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-6">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
                    <BarChart3 className="w-8 h-8 text-accent" />
                </div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                    {t("ins_upgrade_title")}
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm">
                    {t("ins_upgrade_body")}
                </p>
                <div className="flex flex-col sm:flex-row w-full max-w-sm gap-3 pt-4">
                    <Button
                        className="w-full bg-accent text-accent-foreground tracking-[0.12em] uppercase text-xs font-semibold"
                        onClick={() => navigate("/subscription")}
                    >
                        {t("ins_upgrade_btn")}
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full tracking-[0.12em] uppercase text-xs"
                        onClick={() => navigate("/dashboard")}
                    >
                        {t("dash_back_to_dash") || t("back_to_dash")}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-12">
            {/* Top Bar */}
            <header className="border-b border-border px-6 md:px-12 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-foreground/70 hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
                        AXIS HAIR™
                    </span>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase text-foreground mb-2">
                        {t("ins_title")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("ins_sub")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-muted/30 border border-border p-6 rounded-sm space-y-4">
                        <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-sm">
                            <TrendingUp className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-[13px] tracking-[0.12em] uppercase text-muted-foreground mb-1">{t("ins_total_rev")}</p>
                            <h2 className="font-display text-3xl font-bold">{fmt(totalRevenue)}</h2>
                        </div>
                    </div>

                    <div className="bg-muted/30 border border-border p-6 rounded-sm space-y-4">
                        <div className="w-10 h-10 bg-foreground/5 flex items-center justify-center rounded-sm">
                            <Users className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                            <p className="text-[13px] tracking-[0.12em] uppercase text-muted-foreground mb-1">{t("ins_total_clients")}</p>
                            <h2 className="font-display text-3xl font-bold">{totalClients}</h2>
                        </div>
                    </div>

                    <div className="bg-muted/30 border border-border p-6 rounded-sm space-y-4">
                        <div className="w-10 h-10 bg-foreground/5 flex items-center justify-center rounded-sm">
                            <BarChart3 className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                            <p className="text-[13px] tracking-[0.12em] uppercase text-muted-foreground mb-1">{t("ins_total_cons")}</p>
                            <h2 className="font-display text-3xl font-bold">{totalConsultations}</h2>
                        </div>
                    </div>

                    <div className="bg-muted/30 border border-border p-6 rounded-sm space-y-4">
                        <div className="w-10 h-10 bg-foreground/5 flex items-center justify-center rounded-sm">
                            <Clock className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                            <p className="text-[13px] tracking-[0.12em] uppercase text-muted-foreground mb-1">{t("ins_this_month")}</p>
                            <h2 className="font-display text-3xl font-bold">{completedThisMonth}</h2>
                        </div>
                    </div>
                </div>

                <div className="border border-border p-12 text-center rounded-sm bg-muted/10">
                    <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-display text-sm tracking-[0.1em] uppercase text-foreground mb-2">More Analytics Coming Soon</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        We are actively building deeper insights such as most requested styles, retention rates, and demographic breakdowns.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Insights;
