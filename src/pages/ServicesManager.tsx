import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
    Plus,
    ArrowLeft,
    Trash2,
    Edit2,
    Check,
    X,
    Loader2,
    Scissors,
    Palette,
    Sparkles,
    User,
    Stethoscope,
    FlaskConical,
    Layers,
    Wind,
    Star,
    Baby,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type ServiceCategory =
    | 'Haircut'
    | 'Color'
    | 'Chemical Services'
    | 'Relaxer / Texturizer'
    | 'Extensions'
    | 'Styling'
    | 'Beard / Grooming'
    | 'Treatment'
    | 'Kids'
    | 'Perm / Body Wave'
    | 'Keratin / Smoothing'
    | 'Brazilian Blowout'
    | 'Scalp Treatment'
    | 'Color Correction'
    | 'Balayage / Ombre'
    | 'Other';

interface ServicePreset {
    name: string;
    duration: number;
    price: number;
    category: ServiceCategory;
    description?: string;
}

const PRESETS: Record<string, ServicePreset[]> = {
    "✂️ Haircut": [
        { name: "Men's Haircut", duration: 30, price: 35, category: "Haircut", description: "Classic cut, scissor or clipper finish" },
        { name: "Women's Haircut", duration: 60, price: 65, category: "Haircut", description: "Cut and style, includes blow dry" },
        { name: "Buzz Cut", duration: 20, price: 25, category: "Haircut", description: "All-over clipper cut" },
        { name: "Fade (Skin/Taper)", duration: 45, price: 45, category: "Haircut", description: "Skin, low, mid, or high fade with precision detail" },
        { name: "Taper Cut", duration: 30, price: 38, category: "Haircut", description: "Clean taper blend" },
        { name: "Shape-Up / Edge-Up", duration: 15, price: 20, category: "Haircut", description: "Hairline and edge clean-up" },
        { name: "DevaCut / Curly Cut", duration: 90, price: 95, category: "Haircut", description: "Specialized dry cutting technique for natural curls" },
        { name: "Rezo Cut", duration: 90, price: 110, category: "Haircut", description: "Curls cut for maximum volume and balance" },
        { name: "Wolf Cut / Shag", duration: 75, price: 85, category: "Haircut", description: "Trendy layered cut with movement" },
        { name: "Precision Bob", duration: 60, price: 75, category: "Haircut", description: "Sharp, clean-lined bob" },
        { name: "Kids Haircut", duration: 20, price: 25, category: "Kids", description: "For kids 12 and under" },
        { name: "Bang Trim", duration: 15, price: 15, category: "Haircut", description: "Quick fringe refresh" },
        { name: "Dreadlock Retwist", duration: 75, price: 80, category: "Haircut", description: "Locs maintained and retightened" },
    ],
    "💈 Beard & Grooming": [
        { name: "Beard Trim & Shape", duration: 20, price: 25, category: "Beard / Grooming", description: "Clean shape-up and line" },
        { name: "Hot Towel Shave", duration: 30, price: 35, category: "Beard / Grooming", description: "Traditional straight-razor shave" },
        { name: "Beard Design / Art", duration: 30, price: 40, category: "Beard / Grooming", description: "Custom beard line and detail work" },
        { name: "Mustache Trim", duration: 10, price: 12, category: "Beard / Grooming", description: "Quick mustache clean-up" },
        { name: "Haircut + Beard Combo", duration: 60, price: 75, category: "Beard / Grooming", description: "Full cut and beard service" },
    ],
    "🎨 Color": [
        { name: "Full Color", duration: 90, price: 90, category: "Color", description: "Single-process all-over color" },
        { name: "Root Touch-Up", duration: 60, price: 65, category: "Color", description: "Color applied to new growth only" },
        { name: "Full Highlights", duration: 120, price: 150, category: "Color", description: "Foil highlights throughout" },
        { name: "Partial Highlights", duration: 90, price: 100, category: "Color", description: "Top and crown foil highlights" },
        { name: "Balayage", duration: 180, price: 185, category: "Color", description: "Hand-painted freehand highlights" },
        { name: "Money Piece", duration: 60, price: 75, category: "Color", description: "Bright face-framing highlights" },
        { name: "Shadow Root / Root Melt", duration: 45, price: 55, category: "Color", description: "Seamless blend from roots to highlights" },
        { name: "Double Process Blonde", duration: 240, price: 220, category: "Color", description: "Bleach and tone for maximum lift" },
        { name: "Fashion / Vivid Color", duration: 180, price: 160, category: "Color", description: "Semi-permanent bright colors" },
        { name: "Gloss / Toner", duration: 30, price: 50, category: "Color", description: "Shine-enhancing toner or gloss" },
        { name: "Color Correction", duration: 300, price: 350, category: "Color", description: "Complex corrective color (hourly rates apply)" },
    ],
    "⚗️ Chemical & Texture": [
        { name: "Keratin Smoothing", duration: 150, price: 250, category: "Keratin / Smoothing", description: "Frizz-free smoothing, lasts 3–5 months" },
        { name: "Brazilian Blowout", duration: 120, price: 220, category: "Brazilian Blowout", description: "Smoothing treatment with blowout finish" },
        { name: "Perm (Traditional)", duration: 120, price: 120, category: "Perm / Body Wave", description: "Classic curl or wave perm" },
        { name: "Digital / Heat Perm", duration: 180, price: 160, category: "Perm / Body Wave", description: "Long-lasting wave with ceramic rods" },
        { name: "Japanese Straightening", duration: 240, price: 350, category: "Chemical Services", description: "Permanent thermal reconditioning" },
        { name: "Relaxer Touch-Up", duration: 90, price: 95, category: "Relaxer / Texturizer", description: "Lye or no-lye relaxer on new growth" },
        { name: "Texturizer", duration: 60, price: 85, category: "Relaxer / Texturizer", description: "Softens natural curl pattern" },
        { name: "Hair Botox", duration: 90, price: 150, category: "Chemical Services", description: "Deep conditioning filler treatment" },
    ],
    "💆 Scalp & Treatment": [
        { name: "Scalp Detox & Massage", duration: 40, price: 55, category: "Scalp Treatment", description: "Exfoliating scalp treatment" },
        { name: "Dry Scalp Relief", duration: 45, price: 65, category: "Scalp Treatment", description: "Moisturizing treatment for flaky scalp" },
        { name: "Olaplex Standalone", duration: 45, price: 65, category: "Treatment", description: "Complete bond repair treatment" },
        { name: "Deep Conditioning Mask", duration: 30, price: 40, category: "Treatment", description: "Intensive moisture or protein boost" },
    ],
    "✨ Special Color": [
        { name: "Full Balayage", duration: 180, price: 185, category: "Balayage / Ombre", description: "Hand-painted freehand highlights" },
        { name: "Partial Balayage", duration: 120, price: 135, category: "Balayage / Ombre", description: "Face-framing or top-half balayage" },
        { name: "Color Correction", duration: 300, price: 350, category: "Color Correction", description: "Complex corrective color (hourly rates apply)" },
        { name: "Gloss / Toner", duration: 30, price: 50, category: "Color", description: "Shine-enhancing toner or gloss" },
        { name: "Money Piece", duration: 60, price: 75, category: "Color", description: "Bright face-framing highlights" },
    ],
    "🪢 Extensions": [
        { name: "Extension Consultation", duration: 15, price: 0, category: "Extensions", description: "Matching color and method" },
        { name: "Tape-In Install", duration: 120, price: 250, category: "Extensions", description: "Install only (hair separate)" },
        { name: "Sew-In (Full)", duration: 210, price: 200, category: "Extensions", description: "Full head sew-in" },
        { name: "Microlinks", duration: 240, price: 400, category: "Extensions", description: "Individual link installation" },
        { name: "Wig Install / Style", duration: 120, price: 150, category: "Extensions", description: "Lace front or closure wig install" },
    ],
};

const QUICK_PICK_GROUPS = Object.keys(PRESETS);

interface Service {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price_usd: number;
    category: ServiceCategory;
    is_active: boolean;
}

const ServicesManager = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const servicesWithReturnDays = (data || []).map(s => ({
                ...s,
                recommended_return_days: (s as any).recommended_return_days || null
            }));
            setServices(servicesWithReturnDays as Service[]);
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error(t("ser_error_load"));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingService({
            name: '',
            description: '',
            duration_minutes: 30,
            price_usd: 50,
            category: 'Haircut',
            is_active: true
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t("ser_confirm_delete"))) return;

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setServices(services.filter(s => s.id !== id));
            toast.success(t("ser_success_delete"));
        } catch (error) {
            toast.error(t("ser_error_save"));
        }
    };

    const handleSave = async () => {
        if (!editingService?.name || !editingService.duration_minutes || !editingService.price_usd || !editingService.category) {
            toast.error(t("val_req_fields"));
            return;
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (editingService.id) {
                const { error } = await supabase
                    .from('services')
                    .update({
                        name: editingService.name,
                        description: editingService.description,
                        duration_minutes: editingService.duration_minutes,
                        price_usd: editingService.price_usd,
                        category: editingService.category,
                        is_active: editingService.is_active,
                        recommended_return_days: editingService.recommended_return_days
                    })
                    .eq('id', editingService.id);

                if (error) throw error;
                toast.success(t("ser_success_update"));
            } else {
                const { error } = await supabase
                    .from('services')
                    .insert({
                        user_id: user.id,
                        name: editingService.name,
                        description: editingService.description,
                        duration_minutes: editingService.duration_minutes,
                        price_usd: editingService.price_usd,
                        category: editingService.category as ServiceCategory,
                        is_active: editingService.is_active || true,
                        recommended_return_days: editingService.recommended_return_days || null
                    });

                if (error) throw error;
                toast.success(t("ser_success_create"));
            }
            setIsDialogOpen(false);
            fetchServices();
        } catch (error) {
            toast.error(t("ser_error_save"));
        } finally {
            setSaving(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Haircut': return <Scissors className="w-4 h-4" />;
            case 'Color': return <Palette className="w-4 h-4" />;
            case 'Chemical Services': return <FlaskConical className="w-4 h-4" />;
            case 'Relaxer / Texturizer': return <Zap className="w-4 h-4" />;
            case 'Extensions': return <Layers className="w-4 h-4" />;
            case 'Styling': return <Wind className="w-4 h-4" />;
            case 'Beard / Grooming': return <User className="w-4 h-4" />;
            case 'Treatment': return <Stethoscope className="w-4 h-4" />;
            case 'Kids': return <Baby className="w-4 h-4" />;
            case 'Perm / Body Wave': return <Sparkles className="w-4 h-4" />;
            case 'Keratin / Smoothing': return <Layers className="w-4 h-4" />;
            case 'Brazilian Blowout': return <Wind className="w-4 h-4" />;
            case 'Scalp Treatment': return <User className="w-4 h-4" />;
            case 'Color Correction': return <Palette className="w-4 h-4" />;
            case 'Balayage / Ombre': return <Sparkles className="w-4 h-4" />;
            case 'Other': return <Star className="w-4 h-4" />;
            default: return <Scissors className="w-4 h-4" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'Haircut': return t("cat_haircut");
            case 'Color': return t("cat_color");
            case 'Chemical Services': return t("cat_chemical");
            case 'Relaxer / Texturizer': return t("cat_relaxer");
            case 'Extensions': return t("cat_extensions");
            case 'Styling': return t("cat_styling");
            case 'Beard / Grooming': return t("cat_beard");
            case 'Treatment': return t("cat_treatment");
            case 'Kids': return t("cat_kids");
            case 'Perm / Body Wave': return t("cat_perm");
            case 'Keratin / Smoothing': return t("cat_keratin");
            case 'Brazilian Blowout': return t("cat_brazilian");
            case 'Scalp Treatment': return t("cat_scalp");
            case 'Color Correction': return t("cat_correction");
            case 'Balayage / Ombre': return t("cat_balayage");
            case 'Other': return t("cat_other");
            default: return category;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="border-b border-border px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-foreground/70 hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-display text-xs md:text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
                        {t("ser_man_title")}
                    </span>
                </div>
                <Button onClick={handleCreate} size="sm" className="bg-accent text-accent-foreground hover:opacity-90 tracking-widest uppercase text-xs font-bold h-9">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("ser_add_btn")}
                </Button>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        <p className="text-sm text-foreground/60 animate-pulse">{t("loading")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className={`group border border-border rounded-sm p-6 hover:border-accent/40 transition-all duration-300 relative overflow-hidden ${!service.is_active ? 'opacity-60 bg-muted/5' : 'bg-muted/10'}`}
                            >
                                {!service.is_active && (
                                    <div className="absolute top-0 right-0 bg-muted-foreground/20 text-xs px-3 py-1 uppercase tracking-tighter font-bold">
                                        {t("ser_inactive")}
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-sm ${service.is_active ? 'bg-accent/10' : 'bg-muted'}`}>
                                            {getCategoryIcon(service.category)}
                                        </div>
                                        <div>
                                            <h3 className="font-display text-base font-bold tracking-tight text-foreground truncate max-w-[200px]">
                                                {service.name}
                                            </h3>
                                            <p className="text-xs tracking-widest uppercase text-foreground/50 font-semibold">
                                                {getCategoryLabel(service.category)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(service)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-sm text-foreground/70 line-clamp-2 mb-6 h-10">
                                    {service.description || "—"}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs tracking-widest uppercase text-foreground/40">{t("ser_dur_label")}</span>
                                            <span className="text-sm font-bold">{service.duration_minutes} min</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs tracking-widest uppercase text-foreground/40">{t("ser_price_label")} ({t("currency_usd_label")})</span>
                                            <span className="text-sm font-bold text-accent">{t("price_format", { val: service.price_usd })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs tracking-widest uppercase text-foreground/40">{t("status")}</span>
                                        <div className={`w-2 h-2 rounded-full ${service.is_active ? 'bg-green-500' : 'bg-foreground/20'}`} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {services.length === 0 && (
                            <div className="col-span-full border border-dashed border-border rounded-sm p-20 text-center space-y-4">
                                <Scissors className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                                <h3 className="font-display text-lg font-semibold tracking-tight text-muted-foreground">{t("ser_man_title")}</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">{t("ser_empty_state")}</p>
                                <Button onClick={handleCreate} className="bg-accent text-accent-foreground">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t("ser_add_btn")}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-none border-border">
                    <DialogHeader>
                        <DialogTitle className="font-display uppercase tracking-widest text-xs font-bold">
                            {editingService?.id ? t("ser_save_btn") : t("ser_add_btn")}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Quick Pick Panel */}
                        {!editingService?.id && (
                            <div className="space-y-3">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">Quick Pick — tap a service to pre-fill</p>
                                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                                    {QUICK_PICK_GROUPS.map((group) => (
                                        <div key={group}>
                                            <p className="text-xs md:text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1.5 font-medium">{group}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {PRESETS[group].map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        type="button"
                                                        onClick={() => setEditingService(prev => ({
                                                            ...prev!,
                                                            name: preset.name,
                                                            duration_minutes: preset.duration,
                                                            price_usd: preset.price,
                                                            category: preset.category,
                                                            description: preset.description || '',
                                                        }))}
                                                        className={`px-2.5 py-1 text-xs md:text-[10px] font-medium tracking-wide border rounded-sm transition-all ${
                                                            editingService?.name === preset.name
                                                                ? 'bg-accent text-accent-foreground border-accent'
                                                                : 'bg-background border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                                                        }`}
                                                    >
                                                        {preset.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-px bg-border/40" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{t("ser_name_label")}</Label>
                            <Input
                                id="name"
                                value={editingService?.name || ''}
                                onChange={(e) => setEditingService({ ...editingService!, name: e.target.value })}
                                className="rounded-none focus-visible:ring-accent"
                                placeholder={t("ser_name_placeholder")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{t("ser_cat_label")}</Label>
                                <Select
                                    value={editingService?.category}
                                    onValueChange={(v) => setEditingService({ ...editingService!, category: v as ServiceCategory })}
                                >
                                    <SelectTrigger className="rounded-none focus:ring-accent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none">
                                        <SelectItem value="Haircut">{t("cat_haircut")}</SelectItem>
                                        <SelectItem value="Beard / Grooming">{t("cat_beard")}</SelectItem>
                                        <SelectItem value="Color">{t("cat_color")}</SelectItem>
                                        <SelectItem value="Chemical Services">{t("cat_chemical")}</SelectItem>
                                        <SelectItem value="Relaxer / Texturizer">{t("cat_relaxer")}</SelectItem>
                                        <SelectItem value="Extensions">{t("cat_extensions")}</SelectItem>
                                        <SelectItem value="Styling">{t("cat_styling")}</SelectItem>
                                        <SelectItem value="Treatment">{t("cat_treatment")}</SelectItem>
                                        <SelectItem value="Perm / Body Wave">{t("cat_perm")}</SelectItem>
                                        <SelectItem value="Keratin / Smoothing">{t("cat_keratin")}</SelectItem>
                                        <SelectItem value="Brazilian Blowout">{t("cat_brazilian")}</SelectItem>
                                        <SelectItem value="Scalp Treatment">{t("cat_scalp")}</SelectItem>
                                        <SelectItem value="Color Correction">{t("cat_correction")}</SelectItem>
                                        <SelectItem value="Balayage / Ombre">{t("cat_balayage")}</SelectItem>
                                        <SelectItem value="Kids">{t("cat_kids")}</SelectItem>
                                        <SelectItem value="Other">{t("cat_other")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{t("ser_status_label")}</Label>
                                <div className="flex items-center gap-2 h-10 border border-input px-3">
                                    <Switch
                                        checked={editingService?.is_active}
                                        onCheckedChange={(checked) => setEditingService({ ...editingService!, is_active: checked })}
                                    />
                                    <span className="text-xs">{editingService?.is_active ? t("ser_active") : t("ser_inactive")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{t("ser_dur_label")}</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={editingService?.duration_minutes || ''}
                                    onChange={(e) => setEditingService({ ...editingService!, duration_minutes: parseInt(e.target.value) })}
                                    className="rounded-none focus-visible:ring-accent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{t("ser_price_label")} ({t("currency_usd_label")})</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={editingService?.price_usd || ''}
                                    onChange={(e) => setEditingService({ ...editingService!, price_usd: parseFloat(e.target.value) })}
                                    className="rounded-none focus-visible:ring-accent"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{t("ser_desc_label")}</Label>
                            <Textarea
                                id="description"
                                value={editingService?.description || ''}
                                onChange={(e) => setEditingService({ ...editingService!, description: e.target.value })}
                                className="rounded-none focus-visible:ring-accent resize-none h-20"
                                placeholder={t("ser_desc_placeholder")}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-none uppercase tracking-widest text-xs font-bold">
                            {t("ser_cancel_btn")}
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground rounded-none uppercase tracking-widest text-xs font-bold px-8">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ser_save_btn")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ServicesManager;
