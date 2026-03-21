import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { PRICING } from "@/config/pricingConfig";

const Subscription = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("trialing");

    useEffect(() => {
        const fetchStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("subscription_status")
                .eq("user_id", user.id)
                .single();

            if (data) {
                setStatus(data.subscription_status || "trialing");
            }
        };
        fetchStatus();
    }, []);

    const handleSubscribe = async (priceId: string) => {
        try {
            setLoadingPlan(priceId);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const { data, error } = await supabase.functions.invoke("create-checkout-session", {
                body: {
                    priceId: priceId,
                    returnUrl: `${window.location.origin}/dashboard`
                }
            });

            if (error) {
                console.error("Serverside Error:", error);
                throw new Error(error.message || "Edge function execution failed");
            }

            // Edge function returns 200 even on failure — check the body for errors
            if (data?.error) {
                throw new Error(data.error);
            }

            const { url } = data;
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No checkout URL returned. Please try again.");
            }
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Checkout Error",
                description: error.message || "Failed to start checkout. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleManageBilling = async (planKey: string) => {
        try {
            setLoadingPlan(planKey);
            const { data, error } = await supabase.functions.invoke("create-portal-session", {
                body: { returnUrl: window.location.href }
            });
            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.error);
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Could not open billing portal. Please try again.");
            }
        } catch (error: any) {
            toast({
                title: "Billing Error",
                description: error.message || "Could not open billing portal.",
                variant: "destructive"
            });
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <Button
                variant="ghost"
                className="absolute top-6 left-6 md:top-10 md:left-10 text-foreground/70 hover:text-foreground"
                onClick={() => navigate("/dashboard")}
            >
                <ArrowLeft className="h-4 w-4 mr-2" /> {t("settings_back")}
            </Button>

            <div className="max-w-4xl w-full space-y-8 text-center pt-8">
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                    <Crown className="w-7 h-7 text-accent" />
                </div>

                <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.1em] uppercase text-foreground">
                    {t("sub_select_title")}
                </h1>

                <p className="text-foreground/70 text-sm leading-relaxed px-4 max-w-xl mx-auto">
                    {t("sub_select_sub")}
                </p>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    {/* Boutique Tier */}
                    <div className="bg-background border-2 border-border rounded-sm p-8 text-left space-y-6 flex flex-col relative w-full">
                        <div>
                            <h3 className="font-display font-semibold tracking-[0.15em] uppercase text-lg mb-1">{t("pricing_boutique_name")}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl">$</span>
                                <span className="text-4xl font-bold font-display tracking-tight">{PRICING.boutique.price}</span>
                                <span className="text-xs text-foreground/50 uppercase tracking-widest ml-1">{t("currency_usd_label")} /mo</span>
                            </div>
                        </div>

                        <ul className="space-y-4 flex-1">
                            {[
                                t("pricing_feature_ai_100"),
                                t("pricing_feature_regen_1"),
                                t("pricing_feature_clients_50"),
                                t("pricing_feature_service_manager"),
                                t("pricing_feature_link_dedicated"),
                                t("pricing_feature_revenue_weekly"),
                                t("pricing_feature_pdf_monthly")
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs tracking-wide text-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            onClick={() => status === "active" ? handleManageBilling("boutique") : handleSubscribe(PRICING.boutique.priceId)}
                            disabled={loadingPlan !== null || status === "pro"}
                            variant="outline"
                            className="w-full h-12 uppercase tracking-wider text-xs font-semibold"
                        >
                            {loadingPlan === "boutique" || loadingPlan === PRICING.boutique.priceId ? t("val_loading") : status === "active" ? t("sub_manage_cta") : t("sub_subscribe_boutique")}
                        </Button>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-background border-2 border-accent rounded-sm p-8 text-left space-y-6 flex flex-col relative w-full shadow-[0_12px_50px_-14px_hsl(var(--axis-charcoal)_/_0.15)]">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs md:text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                            {t("pricing_recommended")}
                        </div>
                        <div>
                            <h3 className="font-display font-semibold tracking-[0.15em] uppercase text-lg mb-1 text-accent">{t("pricing_pro_name")}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl">$</span>
                                <span className="text-4xl font-bold font-display tracking-tight">{PRICING.professional.price}</span>
                                <span className="text-xs text-foreground/50 uppercase tracking-widest ml-1">{t("currency_usd_label")} /mo</span>
                            </div>
                        </div>

                        <ul className="space-y-4 flex-1">
                            {[
                                t("pricing_feature_everything"),
                                t("pricing_feature_ai_300"),
                                t("pricing_feature_regen_3"),
                                t("pricing_feature_clients_200"),
                                t("pricing_feature_advanced_insights"),
                                t("pricing_feature_revenue_snapshot"),
                                t("pricing_feature_support_priority")
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs tracking-wide text-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            onClick={() => status === "pro" ? handleManageBilling("pro") : handleSubscribe(PRICING.professional.priceId)}
                            disabled={loadingPlan !== null}
                            className="w-full h-12 bg-accent text-accent-foreground hover:opacity-90 uppercase tracking-wider text-xs font-semibold"
                        >
                            {loadingPlan === "pro" || loadingPlan === PRICING.professional.priceId ? t("val_loading") : status === "pro" ? t("sub_manage_cta") : t("sub_subscribe_pro")}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 mt-8">
                    <p className="text-xs md:text-[10px] text-muted-foreground uppercase tracking-[0.1em] flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 text-muted-foreground/60" /> {t("sub_secure_stripe")}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] flex items-center justify-center">
                        {t("pricing_payment_notice")}
                    </p>
                </div>
            </div>
        </div >
    );
};

export default Subscription;
