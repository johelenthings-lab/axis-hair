import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, CheckCircle, Sparkles, ImageIcon, ArrowLeft, Loader2, Calendar, User, Camera, Scissors, Check, Edit3, ChevronDown, Clock, X } from "lucide-react";
import AIRecommendation from "@/components/AIRecommendation";

import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { DateTime } from "luxon";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { validateImage } from "@/utils/imageValidation";
import { logSystemEvent } from "@/utils/systemLogger";
import { invokeSafeAI } from "@/lib/ai-service";

interface StylistProfile {
    user_id: string;
    full_name: string;
    salon_name: string | null;
    bio: string | null;
    specialties: string[] | null;
    location: string | null;
    booking_slug: string;
    client_text_size_preference?: string;
    booking_confirmation_window?: string;
    timezone?: string;
}

const TEXT_SIZES = ["text-sm", "text-base", "text-lg", "text-xl"] as const;
type ClientTextSize = typeof TEXT_SIZES[number];

interface LookData {
    id: string;
    look_number: number;
    style_label: string;
    style_description: string | null;
    image_url: string | null;
    generation_status: string;
    selected: boolean;
    audit_status?: string;
}

const ClientBooking = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t, lang } = useLanguage();
    const [searchParams] = useSearchParams();
    
    const translateServiceName = (name: string): string => {
        if (lang === 'en') return name;
        
        const translations: Record<string, { es: string; fr: string }> = {
            "Haircut": { es: "Corte de Pelo", fr: "Coupe de Cheveux" },
            "Color": { es: "Coloración", fr: "Couleur" },
            "Highlights": { es: "Mechas", fr: "Mèches" },
            "Balayage": { es: "Balayage", fr: "Balayage" },
            "Extensions": { es: "Extensiones", fr: "Extensions" },
            "Treatment": { es: "Tratamiento", fr: "Traitement" },
            "Styling": { es: "Peinado", fr: "Coiffure" },
            "Blowout": { es: "Secado", fr: "Brushing" },
            "Updo": { es: "Recogido", fr: "Coiffure" },
            "Bridal": { es: "Novia", fr: "Mariée" },
            "Perm": { es: "Permanente", fr: "Permanente" },
            "Straightening": { es: "Alisado", fr: "Lissage" },
            "Keratin": { es: "Queratina", fr: "Kératine" },
            "Consultation": { es: "Consulta", fr: "Consultation" },
            "Trim": { es: "Recorte", fr: "Taille" },
            "Shave": { es: "Afeitado", fr: "Rasage" },
            "Beard Trim": { es: "Recorte de Barba", fr: "Taille de Barbe" },
            "Buzz Cut": { es: "Corte al rape", fr: "Coupe rasée" },
            "Fade": { es: "Degradado", fr: "Dégradé" },
            "Beard": { es: "Barba", fr: "Barbe" },
            "Mustache": { es: "Bigote", fr: "Moustache" },
            "Hair Consultation": { es: "Consulta de Pelo", fr: "Conseil Cheveux" },
        };
        
        const lowerName = name.toLowerCase();
        for (const [key, value] of Object.entries(translations)) {
            if (lowerName.includes(key.toLowerCase())) {
                return value[lang as 'es' | 'fr'];
            }
        }
        return name;
    };
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [success, setSuccess] = useState(false);
    const [finished, setFinished] = useState(false);
    const [clientTextSize, setClientTextSize] = useState<ClientTextSize>("text-sm");
    const [showAppointmentChanges, setShowAppointmentChanges] = useState(false);
    const [appointmentNote, setAppointmentNote] = useState("");
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleSlot, setRescheduleSlot] = useState("");
    const [cancelConfirm, setCancelConfirm] = useState(false);

    // Data State
    const [stylist, setStylist] = useState<StylistProfile | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [existingBooking, setExistingBooking] = useState<any>(null);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [consultationId, setConsultationId] = useState<string | null>(null);

    // Form State
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientId, setClientId] = useState<string | null>(null);
    const [serviceType, setServiceType] = useState<"full_preview" | "quick_service">("full_preview");
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [hairTexture, setHairTexture] = useState("");
    const [desiredLength, setDesiredLength] = useState("");
    const [desiredStyle, setDesiredStyle] = useState("");
    const [desiredColor, setDesiredColor] = useState("");
    const [highlightChoice, setHighlightChoice] = useState("");
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
    const [faceShape, setFaceShape] = useState("");
    const [maintenanceLevel, setMaintenanceLevel] = useState("");
    const [lifestyle, setLifestyle] = useState("");
    const [beardStyle, setBeardStyle] = useState("");
    const [beardLength, setBeardLength] = useState("");
    const [mustacheStyle, setMustacheStyle] = useState("");
    const [groomingNotes, setGroomingNotes] = useState("");
    const [clientPhoto, setClientPhoto] = useState<File | null>(null);
    const [inspirationFiles, setInspirationFiles] = useState<File[]>([]);
    const [inspirationNotes, setInspirationNotes] = useState("");
    const [requestedDate, setRequestedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [socialConsent, setSocialConsent] = useState(true);

    // AI Generation State
    const [generatingLooks, setGeneratingLooks] = useState(false);
    const [looks, setLooks] = useState<LookData[]>([]);
    const [selectedLookLocal, setSelectedLookLocal] = useState<number | null>(null);
    const [validating, setValidating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRegenUsed, setIsRegenUsed] = useState(false);
    const [regenDescription, setRegenDescription] = useState("");

    useEffect(() => {
        const checkExisting = async () => {
            let storId = localStorage.getItem("axis_client_id");
            const qId = searchParams.get("client_id");
            if (qId) {
                storId = qId;
                localStorage.setItem("axis_client_id", qId);
            }

            if (storId && stylist) {
                const { data } = await supabase
                    .from("consultations")
                    .select("*, clients(full_name)")
                    .eq("client_id", storId)
                    .eq("stylist_id", stylist.user_id)
                    .in("status", ["awaiting_approval", "approved"])
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (data) {
                    setExistingBooking(data);
                }
            }
        };
        checkExisting();
    }, [stylist, searchParams]);

    // Save booking progress to localStorage (only serializable data)
    useEffect(() => {
        if (!slug || loading || success) return;
        
        const saveState = () => {
            const stateToSave = {
                currentStep,
                clientName,
                clientEmail,
                clientPhone,
                serviceType,
                selectedServiceIds,
                hairTexture,
                desiredLength,
                desiredStyle,
                desiredColor,
                highlightChoice,
                uploadedPhotoUrl,
                maintenanceLevel,
                requestedDate,
                selectedSlot,
                groomingNotes
            };
            try {
                localStorage.setItem(`booking_${slug}`, JSON.stringify(stateToSave));
                console.log("Booking state saved:", stateToSave);
            } catch (e) {
                console.error("Error saving booking state:", e);
            }
        };
        
        // Debounce save to avoid too frequent writes
        const timeoutId = setTimeout(saveState, 500);
        return () => clearTimeout(timeoutId);
    }, [slug, currentStep, clientName, clientEmail, clientPhone, serviceType, selectedServiceIds, hairTexture, desiredLength, desiredStyle, desiredColor, highlightChoice, uploadedPhotoUrl, maintenanceLevel, requestedDate, selectedSlot, groomingNotes, loading, success]);

    // Restore booking progress from localStorage only for returning clients
    useEffect(() => {
        if (!slug || loading || !stylist) return;
        
        // Only restore state if there's a client_id in URL (returning client)
        const clientIdParam = searchParams.get("client_id");
        if (!clientIdParam) {
            // Fresh visit - clear any saved state and start at step 1
            localStorage.removeItem(`booking_${slug}`);
            setCurrentStep(1);
            return;
        }
        
        const savedState = localStorage.getItem(`booking_${slug}`);
        console.log("Checking for saved state:", savedState ? "Found" : "Not found");
        
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                console.log("Restoring state:", parsed);
                if (parsed.currentStep) setCurrentStep(parsed.currentStep);
                if (parsed.clientName) setClientName(parsed.clientName);
                if (parsed.clientEmail) setClientEmail(parsed.clientEmail);
                if (parsed.clientPhone) setClientPhone(parsed.clientPhone);
                if (parsed.serviceType) setServiceType(parsed.serviceType);
                if (parsed.selectedServiceIds && parsed.selectedServiceIds.length > 0) setSelectedServiceIds(parsed.selectedServiceIds);
                if (parsed.hairTexture) setHairTexture(parsed.hairTexture);
                if (parsed.desiredLength) setDesiredLength(parsed.desiredLength);
                if (parsed.desiredStyle) setDesiredStyle(parsed.desiredStyle);
                if (parsed.desiredColor) setDesiredColor(parsed.desiredColor);
                if (parsed.highlightChoice) setHighlightChoice(parsed.highlightChoice);
                if (parsed.uploadedPhotoUrl) setUploadedPhotoUrl(parsed.uploadedPhotoUrl);
                if (parsed.maintenanceLevel) setMaintenanceLevel(parsed.maintenanceLevel);
                if (parsed.requestedDate) setRequestedDate(parsed.requestedDate);
                if (parsed.selectedSlot) setSelectedSlot(parsed.selectedSlot);
                if (parsed.groomingNotes) setGroomingNotes(parsed.groomingNotes);
                console.log("State restored successfully");
            } catch (e) {
                console.error("Error restoring booking state:", e);
            }
        }
    }, [slug, loading, stylist]);

    // Clear localStorage on successful booking
    useEffect(() => {
        if (success && slug) {
            localStorage.removeItem(`booking_${slug}`);
        }
    }, [success, slug]);

    useEffect(() => {
        const fetchStylist = async () => {
            if (!slug) return;
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("booking_slug", slug)
                .single();

            if (error) {
                toast({ title: t('error_loading'), variant: "destructive" });
            } else {
                setStylist(data as any);
                if (data.client_text_size_preference) {
                    setClientTextSize(data.client_text_size_preference as ClientTextSize);
                }
                const { data: sData } = await supabase
                    .from("services")
                    .select("*")
                    .eq("user_id", data.user_id)
                    .eq("is_active", true);
                if (sData) setServices(sData);
            }
            setLoading(false);
        };
        fetchStylist();
    }, [slug, toast, t]);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!stylist || !requestedDate) {
                setAvailableSlots([]);
                return;
            }
            // Clear current slots while fetching to avoid showing old ones
            setAvailableSlots([]);
            const { data, error } = await supabase.functions.invoke("get-available-slots", {
                body: { 
                    stylistId: stylist.user_id, 
                    date: requestedDate,
                    timezone: stylist.timezone
                }
            });
            if (error) {
                console.error("Error fetching slots:", error);
                toast({ title: t('error_loading_slots') || "Error loading available times", variant: "destructive" });
            } else if (data?.slots) {
                setAvailableSlots(data.slots);
            }
        };
        fetchSlots();
    }, [requestedDate, stylist, t, toast]);

    useEffect(() => {
        const fetchRescheduleSlots = async () => {
            if (!stylist || !rescheduleDate) {
                setAvailableSlots([]);
                return;
            }
            setAvailableSlots([]);
            const { data, error } = await supabase.functions.invoke("get-available-slots", {
                body: { 
                    stylistId: stylist.user_id, 
                    date: rescheduleDate,
                    timezone: stylist.timezone
                }
            });
            if (error) {
                console.error("Error fetching slots:", error);
            } else if (data?.slots) {
                setAvailableSlots(data.slots);
            }
        };
        fetchRescheduleSlots();
    }, [rescheduleDate, stylist]);

    // Polling for AI Looks
    useEffect(() => {
        if (!generatingLooks || !consultationId) return;

        const interval = setInterval(async () => {
            const { data: lookRows } = await supabase
                .from("consultation_looks")
                .select("*")
                .eq("consultation_id", consultationId)
                .order("look_number");

            if (lookRows) {
                setLooks(lookRows as unknown as LookData[]);
                const allDone = (lookRows as any[]).every(l => l.generation_status === 'done' || l.generation_status === 'error');
                if (allDone && lookRows.length > 0) {
                    setGeneratingLooks(false);
                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [generatingLooks, consultationId]);

    const handleStyleProfileSubmit = () => {
        if (serviceType === "full_preview" && !hairTexture) {
            toast({ title: t('hair_texture_req') || "Please select a hair texture", variant: "destructive" });
            return;
        }
        setCurrentStep(3);
        window.scrollTo(0, 0);
    };

    const completeConsultationAndTriggerAI = async () => {
        if (!clientName || !clientPhoto || !stylist) {
            if (!clientPhoto) toast({ title: t('client_photo_req'), variant: "destructive" });
            return;
        }
        
        setValidating(true);
        setGeneratingLooks(true);
        setCurrentStep(4);
        window.scrollTo(0, 0);

        try {
            // 1. Find or Create Client
            let client;
            const { data: existingClient } = await supabase
                .from("clients")
                .select("*")
                .eq("stylist_id", stylist.user_id)
                .eq("full_name", clientName)
                .maybeSingle();

            if (existingClient) {
                const { data: updated, error: updateError } = await supabase
                    .from("clients")
                    .update({
                        email: clientEmail || null,
                        phone: clientPhone || null
                    })
                    .eq("id", existingClient.id)
                    .select()
                    .single();
                if (updateError) throw updateError;
                client = updated;
            } else {
                const { data: created, error: createError } = await supabase
                    .from("clients")
                    .insert({
                        stylist_id: stylist.user_id,
                        full_name: clientName,
                        email: clientEmail || null,
                        phone: clientPhone || null
                    })
                    .select()
                    .single();
                if (createError) throw createError;
                client = created;
            }

            setClientId(client.id);

            // 2. Upload Photo
            const fileExt = clientPhoto.name.split('.').pop();
            const filePath = `${stylist.user_id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("consultation-images")
                .upload(filePath, clientPhoto);
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from("consultation-images")
                .getPublicUrl(filePath);

            // 3. Create Draft Consultation
            const { data: consult, error: consultError } = await supabase
                .from("consultations")
                .insert([{
                    stylist_id: stylist.user_id,
                    client_id: client.id,
                    original_image_url: publicUrl,
                    status: 'pending',
                    service_type: serviceType,
                    selected_service_ids: selectedServiceIds,
                    hair_texture: hairTexture,
                    desired_length: desiredLength,
                    desired_style: desiredStyle,
                    desired_color: desiredColor,
                    face_shape: faceShape,
                    maintenance_level: maintenanceLevel,
                    lifestyle: lifestyle,
                    beard_style: beardStyle,
                    beard_length: beardLength,
                    mustache_style: mustacheStyle,
                    grooming_notes: groomingNotes
                }])
                .select()
                .single();

            if (consultError) throw consultError;
            setConsultationId(consult.id);

            // 4. Trigger AI Generation
            Promise.allSettled([
                invokeSafeAI(
                    "generate-try-on-looks",
                    { consultation_id: consult.id, look_number: -1 },
                    { eventType: "ai_tryon", resourceId: consult.id }
                ),
                invokeSafeAI(
                    "generate-recommendation",
                    { consultation_id: consult.id, lang: lang },
                    { eventType: "ai_recommendation", resourceId: consult.id }
                )
            ]).then((results) => {
                let hasError = false;
                results.forEach((result, idx) => {
                    const isLooks = idx === 0;
                    if (result.status === 'rejected' || (result.status === 'fulfilled' && (result.value as any).error)) {
                        const err = result.status === 'rejected' ? result.reason : (result.value as any).error;
                        console.error(`AI Task ${isLooks ? 'Looks' : 'Recommendation'} failed:`, err);
                        if (isLooks) hasError = true;
                    }
                });
                
                if (hasError) {
                    toast({ 
                        title: t('error_gen_look'), 
                        description: t('gen_style_preview_sub'), 
                        variant: "destructive" 
                    });
                    setGeneratingLooks(false);
                }
            });
            
        } catch (err: any) {
            toast({ title: t('error_gen_look'), description: err.message, variant: "destructive" });
            setGeneratingLooks(false);
        } finally {
            setValidating(false);
        }
    };

    const handleRegenerate = async () => {
        if (!consultationId || isRegenUsed || !selectedLookLocal) return;
        setIsRegenerating(true);
        
        try {
            await supabase
                .from("consultations")
                .update({ 
                    desired_style: desiredStyle,
                    desired_color: desiredColor,
                    grooming_notes: groomingNotes
                })
                .eq("id", consultationId);

            await invokeSafeAI(
                "generate-try-on-looks",
                { 
                    consultation_id: consultationId, 
                    look_number: 3, 
                    is_regeneration: true,
                    description: regenDescription 
                },
                { eventType: "ai_tryon", resourceId: consultationId }
            );
            
            setIsRegenUsed(true);
            setGeneratingLooks(true);
            toast({ title: "✨ Refinement started", description: "Generating your adjusted look..." });
        } catch (err: any) {
            toast({ title: "Regeneration failed", description: err.message, variant: "destructive" });
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleFinalSubmit = async () => {
        if (!requestedDate || !selectedSlot) {
            toast({ title: t('val_fields'), variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const appointmentDate = DateTime.fromISO(`${requestedDate}T${selectedSlot}:00`, { 
                zone: stylist?.timezone || 'UTC' 
            }).toUTC().toISO();

            if (!appointmentDate) throw new Error("Invalid date");

            let finalInspirationUrls: string[] = [];
            for (const file of inspirationFiles) {
                const fileExt = file.name.split('.').pop();
                const filePath = `inspiration/${consultationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("consultation-images")
                    .upload(filePath, file);
                
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from("consultation-images")
                        .getPublicUrl(filePath);
            
            setUploadedPhotoUrl(publicUrl);
                    finalInspirationUrls.push(publicUrl);
                }
            }

            let updatedInspirationNotes = inspirationNotes;
            if (finalInspirationUrls.length > 0) {
                updatedInspirationNotes += "\n\n[Inspiration Images]: " + finalInspirationUrls.join(", ");
            }

            const selectedLook = looks.find(l => l.look_number === selectedLookLocal);
            const previewImageUrl = selectedLook ? selectedLook.image_url : null;

            const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
            const totalPrice = selectedServices.reduce((sum, s) => sum + (Number(s.price_usd) || 0), 0);
            const totalDuration = selectedServices.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0);

            const { error: consultError } = await supabase
                .from("consultations")
                .update({
                    appointment_date: appointmentDate,
                    inspiration_notes: updatedInspirationNotes,
                    social_consent: socialConsent,
                    status: 'pending',
                    session_complete: true,
                    manual_uploads_count: inspirationFiles.length,
                    preview_image_url: previewImageUrl,
                    estimated_price: totalPrice > 0 ? totalPrice : null,
                    estimated_duration_minutes: totalDuration > 0 ? totalDuration : null,
                    service_id: selectedServiceIds.length > 0 ? selectedServiceIds[0] : null
                })
                .eq("id", consultationId!);

            if (consultError) throw consultError;
            
            const serviceNames = selectedServices.map(s => s.name).join(", ");
            
            try {
                await supabase.functions.invoke("send-booking-sms", {
                    body: {
                        client_name: clientName,
                        client_phone: clientPhone,
                        stylist_name: stylist?.full_name,
                        salon_name: stylist?.salon_name,
                        service_name: serviceNames || (serviceType === "full_preview" ? "Hair Consultation" : "Service"),
                        appointment_date: appointmentDate
                    }
                });
            } catch (smsErr) {}

            setSuccess(true);
            logSystemEvent('image_upload_success', 'Client completed consultation booking', { consultationId });

        } catch (err: any) {
            toast({ title: t('fail_consult'), description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const getServiceMetrics = () => {
        if (selectedServiceIds.length === 0) return { duration: 45, price: "-" };
        let totalDuration = 0;
        let totalPrice = 0;
        let hasPrice = false;
        selectedServiceIds.forEach(id => {
            const s = services.find(x => x.id === id);
            if (s) {
                totalDuration += s.duration_minutes || 0;
                if (s.price_usd) {
                    totalPrice += Number(s.price_usd);
                    hasPrice = true;
                }
            }
        });
        return { duration: totalDuration || 45, price: hasPrice ? totalPrice : "-" };
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    if (!stylist) return <div className="min-h-screen flex items-center justify-center bg-background"><p>Stylist not found.</p></div>;

    if (finished) {
        return (
            <div className="min-h-screen bg-[#D2B48C] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="max-w-md w-full text-center space-y-8 py-12 relative z-10">
                    <div className="w-20 h-20 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="h-10 w-10 text-black" />
                    </div>
                    <h1 className="font-display text-4xl font-black tracking-tighter uppercase text-black">AXIS HAIR™</h1>
                    <p className="text-black/80 text-sm font-medium">Thank you for visiting. Your professional session is complete.</p>
                    <Button onClick={() => navigate("/")} className="w-full h-14 bg-black text-white uppercase text-[10px] tracking-[0.2em] font-black rounded-xl hover:bg-black/80 transition-all">{t('book_done_btn')}</Button>
                </div>
            </div>
        );
    }

    if (success) {
        const { duration, price } = getServiceMetrics();
        const formattedDate = requestedDate ? new Date(requestedDate + 'T00:00:00').toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '';
        const selectedLook = looks.find(l => l.look_number === selectedLookLocal);
        
        return (
            <div className={`min-h-screen bg-[#D2B48C] flex items-center justify-center p-6 relative overflow-hidden ${clientTextSize}`}>
                <div className="max-w-4xl w-full text-center space-y-8 py-12 relative z-10">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-black/20">
                            <CheckCircle className="h-10 w-10 text-black animate-in zoom-in duration-700" />
                        </div>
                        <h1 className="font-display text-4xl font-black tracking-tighter uppercase text-black">{t('book_success_title')}</h1>
                        <p className="text-black/80 text-sm font-medium">
                            {t('book_success_sub').replace('{stylist}', stylist?.full_name || '')}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center">
                        <div className="flex-1 bg-[#D2B48C]/90 backdrop-blur-3xl border border-black/20 p-8 rounded-sm text-left space-y-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-black/60 font-black">{t('client')}</p>
                                    <p className="text-xl font-display font-black uppercase text-black">{clientName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6 border-b border-black/20 pb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-widest text-black/60 font-black">{t('appointment')}</p>
                                        <p className="text-sm font-bold text-black">{formattedDate}</p>
                                        <p className="text-[10px] font-medium text-black uppercase tracking-widest flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" /> {selectedSlot}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] uppercase tracking-widest text-black/60 font-black">Status</p>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/10 border border-black/20 rounded-full">
                                            <div className="w-1 h-1 rounded-full bg-black animate-pulse" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-black">{t('dash_status_awaiting')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-widest text-black/60 font-black">{t('service')}</p>
                                        <p className="text-sm font-bold text-black leading-tight">
                                            {services.filter(s => selectedServiceIds.includes(s.id)).map(s => translateServiceName(s.name)).join(", ") || (serviceType === "full_preview" ? t('book_service_full') : t('book_service_quick'))}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-widest text-black/60 font-black">{t('book_summary_price')}</p>
                                            <p className="text-sm font-bold text-black">{price !== "-" ? `$${price}` : t('price_varies')}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] uppercase tracking-widest text-black/60 font-black">{t('book_summary_duration')}</p>
                                            <p className="text-sm font-bold text-black">~{duration} {t('ser_minutes_long')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-72 bg-[#D2B48C]/90 backdrop-blur-3xl border border-black/20 p-4 rounded-sm shadow-2xl space-y-4">
                            <p className="text-[10px] uppercase tracking-widest text-black/60 font-black text-left">{t("preview") || "Chosen Transformation"}</p>
                            <div className="aspect-[3/4] bg-black/10 rounded-sm overflow-hidden border border-black/20 relative">
                                <img src={selectedLook?.image_url || uploadedPhotoUrl || existingBooking?.original_image_url} alt="Chosen Hairstyle" className="w-full h-full object-cover" />
                                {selectedLook && <div className="absolute top-2 left-2 bg-black text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">Selected</div>}
                            </div>
                            <div className="text-left space-y-1">
                                <p className="text-xs font-bold text-black uppercase tracking-wider">{selectedLook?.style_label || (serviceType === "full_preview" ? "Hair Consultation" : "Service Selection")}</p>
                                <p className="text-[10px] text-black/60 line-clamp-2">{selectedLook?.style_description || "Your professional will use your session notes and photos as a guide."}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10">
                        <Button onClick={() => setShowAppointmentChanges(true)} variant="outline" className="h-14 border-black text-black uppercase text-[10px] tracking-[0.2em] font-black">
                            <Calendar className="h-4 w-4 mr-2" /> {t('book_appointment_changes')}
                        </Button>
                        <Button onClick={() => setFinished(true)} className="h-14 bg-black text-white uppercase text-[10px] tracking-[0.2em] font-black">
                            {t('book_done_btn')}
                        </Button>
                    </div>

                    {showAppointmentChanges && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAppointmentChanges(false)} />
                            <div className="relative bg-white border border-black/20 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                <button onClick={() => setShowAppointmentChanges(false)} className="absolute top-4 right-4 text-black/50 hover:text-black">
                                    <X className="h-6 w-6" />
                                </button>
                                
                                <h2 className="text-2xl font-display font-black uppercase text-black mb-2">{t('appointment_changes_title')}</h2>
                                <p className="text-black/60 text-sm mb-6">{t('appointment_changes_sub')}</p>
                                
                                <div className="space-y-6 text-left">
                                    <div className="p-4 bg-black/5 rounded-xl border border-black/10">
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-[10px] uppercase tracking-widest text-black/60">{t('appointment')}</span>
                                                <span className="text-sm font-bold text-black">{formattedDate} at {selectedSlot}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[10px] uppercase tracking-widest text-black/60">{t('service')}</span>
                                                <span className="text-sm font-bold text-black">{services.filter(s => selectedServiceIds.includes(s.id)).map(s => s.name).join(", ") || (serviceType === "full_preview" ? "Hair Consultation" : "Service")}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[10px] uppercase tracking-widest text-black/60">{t('book_summary_price')}</span>
                                                <span className="text-sm font-bold text-black">{price !== "-" ? `$${price}` : t('price_varies')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-black/5 rounded-xl border border-black/10">
                                        <p className="text-[10px] uppercase tracking-widest text-black/60 mb-2">Your Selected Look</p>
                                        <div className="aspect-video bg-black/10 rounded-lg overflow-hidden">
                                            <img src={selectedLook?.image_url || uploadedPhotoUrl || existingBooking?.original_image_url} alt="Your Look" className="w-full h-full object-cover" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase tracking-widest text-black">{t('appointment_note_label')}</Label>
                                        <Textarea 
                                            value={appointmentNote}
                                            onChange={(e) => e.target.value.length <= 200 && setAppointmentNote(e.target.value)}
                                            placeholder={t('appointment_note_placeholder')}
                                            className="bg-black/5 border-black/20 text-black placeholder:text-black/40"
                                            maxLength={200}
                                        />
                                        <p className="text-[10px] text-black/40 text-right">{appointmentNote.length}/200</p>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-black/10">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] uppercase tracking-widest text-black">{t('appointment_reschedule')}</Label>
                                            <Button 
                                                type="button"
                                                onClick={() => {
                                                    const input = document.getElementById('reschedule-date-input');
                                                    if (input) {
                                                        const htmlInput = input as HTMLInputElement;
                                                        try { htmlInput.showPicker?.(); } catch(e) { htmlInput.click(); }
                                                    }
                                                }}
                                                className="w-full h-14 bg-black/10 border-2 border-dashed border-black/30 hover:border-black hover:bg-black/20 text-black rounded-xl transition-all group"
                                            >
                                                <Calendar className="h-5 w-5 mr-2 text-black" />
                                                <span className="font-bold">{rescheduleDate ? new Date(rescheduleDate + 'T00:00:00').toLocaleDateString() : "Select New Date"}</span>
                                            </Button>
                                            <Input 
                                                id="reschedule-date-input"
                                                type="date" 
                                                min={new Date().toISOString().split("T")[0]} 
                                                value={rescheduleDate} 
                                                onChange={(e) => { setRescheduleDate(e.target.value); setRescheduleSlot(""); }}
                                                className="hidden" 
                                            />
                                            {rescheduleDate && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {availableSlots.filter(s => s.available).map((slotObj) => (
                                                        <Button 
                                                            key={slotObj.time} 
                                                            variant={rescheduleSlot === slotObj.time ? "default" : "outline"} 
                                                            size="sm"
                                                            onClick={() => setRescheduleSlot(slotObj.time)}
                                                            className="text-xs"
                                                        >
                                                            {slotObj.time}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button 
                                                onClick={async () => {
                                                    if (!rescheduleDate || !rescheduleSlot) {
                                                        toast({ title: "Please select a new date and time", variant: "destructive" });
                                                        return;
                                                    }
                                                    const newDate = DateTime.fromISO(`${rescheduleDate}T${rescheduleSlot}:00`, { zone: stylist?.timezone || 'UTC' }).toUTC().toISO();
                                                    await supabase.from("consultations").update({ appointment_date: newDate, stylist_notes: appointmentNote || null }).eq("id", consultationId);
                                                    toast({ title: t('appointment_reschedule_success') });
                                                    setShowAppointmentChanges(false);
                                                }}
                                                disabled={!rescheduleDate || !rescheduleSlot}
                                                className="flex-1"
                                            >
                                                <Calendar className="h-4 w-4 mr-2" /> {t('appointment_reschedule')}
                                            </Button>
                                            {!cancelConfirm ? (
                                                <Button variant="destructive" onClick={() => setCancelConfirm(true)}>
                                                    {t('appointment_cancel')}
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button variant="outline" onClick={() => setCancelConfirm(false)} className="text-xs">No</Button>
                                                    <Button variant="destructive" onClick={async () => {
                                                        await supabase.from("consultations").update({ status: 'cancelled', stylist_notes: appointmentNote || null }).eq("id", consultationId);
                                                        toast({ title: t('appointment_cancel_success') });
                                                        setShowAppointmentChanges(false);
                                                        setFinished(true);
                                                    }} className="text-xs">Yes, Cancel</Button>
                                                </div>
                                            )}
                                        </div>
                                        {cancelConfirm && (
                                            <p className="text-red-400 text-xs text-center">{t('appointment_cancel_confirm')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-axis-salon bg-fixed bg-cover overflow-x-hidden relative ${clientTextSize}`}>
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none bg-black shadow-inner" />
            <div className="relative z-10 w-full">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-[#050505] border-b border-white/20 px-6 md:px-12 py-6 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="font-display text-sm font-black tracking-[0.4em] uppercase text-white">AXIS HAIR™</div>
                    <div className="h-4 w-[1px] bg-white/20 hidden md:block" />
                    <div className="flex flex-col hidden md:flex">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">{stylist?.full_name}</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-accent/80">{stylist?.salon_name}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 md:px-12 pt-16 relative z-10">
                {currentStep > 1 && (
                    <div className="mb-12 space-y-4">
                        <div className="flex justify-between items-end mb-2">
                            <div className="space-y-1 text-left">
                                <p className="text-[11px] uppercase font-black tracking-[0.4em] text-accent">Your Booking Journey</p>
                                <h2 className="text-3xl font-display font-black tracking-tighter uppercase text-white">
                                    {currentStep === 2 && "Personal Style Profile"}
                                    {currentStep === 3 && "Visual Canvas Capture"}
                                    {currentStep === 4 && "AI Transformation Gallery"}
                                    {currentStep === 5 && "Refine Your Look"}
                                    {currentStep === 6 && "Reserve Your Session"}
                                </h2>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{currentStep}/6</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1.5">
                            {[1, 2, 3, 4, 5, 6].map((step) => (
                                <div key={step} className={`h-full flex-1 rounded-full transition-all duration-1000 ease-out ${step <= currentStep ? "bg-accent" : "bg-white/10"}`} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative">
                    <div className="space-y-12">
                        {currentStep === 1 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="text-center space-y-12 mb-20 pt-10"
                                >
                                    <div className="space-y-6">
                                        <h1 className="text-7xl md:text-9xl font-display font-black tracking-tighter uppercase text-white leading-none filter drop-shadow-2xl">
                                            {t('book_welcome_title')}
                                        </h1>
                                        <div className="inline-flex items-center gap-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full backdrop-blur-md shadow-2xl">
                                            <span className="text-[11px] uppercase font-black tracking-[0.5em] text-white">{t('book_welcome_session')}</span>
                                            <div className="h-4 w-[2px] bg-accent/40" />
                                            <span className="text-sm font-black uppercase tracking-[0.2em] text-accent drop-shadow-sm">{stylist?.full_name}</span>
                                        </div>
                                    </div>
                                    <p className="max-w-2xl mx-auto text-white text-lg font-medium leading-relaxed tracking-wide balance">
                                        {t('book_welcome_sub')}
                                    </p>
                                </motion.div>

                                <div className="space-y-8 bg-black/95 backdrop-blur-2xl p-8 md:p-12 rounded-2xl border border-white/30 shadow-2xl">
                                    <div className="space-y-4">
                                            <label className="text-[11px] uppercase font-black tracking-[0.3em] text-white ml-1 mb-2 block">{t('book_full_name')}</label>
                                            <Input 
                                                placeholder={t('book_name_placeholder')}
                                                className="h-14 bg-white/15 border-white/30 focus:border-accent text-white placeholder:text-white/50 text-lg rounded-xl transition-all"
                                                value={clientName}
                                                onChange={(e) => e.target.value.length <= 50 && setClientName(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-[11px] uppercase font-black tracking-[0.3em] text-white ml-1 mb-2 block">{t('book_email')}</label>
                                                <Input 
                                                    type="email"
                                                    placeholder={t('book_email_placeholder')}
                                                    className="h-14 bg-white/15 border-white/30 focus:border-accent text-white placeholder:text-white/50 text-lg rounded-xl transition-all"
                                                    value={clientEmail}
                                                    onChange={(e) => e.target.value.length <= 100 && setClientEmail(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] uppercase font-black tracking-[0.3em] text-white ml-1 mb-2 block">{t('book_phone')}</label>
                                                <Input 
                                                    type="tel"
                                                    placeholder={t('book_phone_placeholder')}
                                                    className="h-14 bg-white/15 border-white/30 focus:border-accent text-white placeholder:text-white/50 text-lg rounded-xl transition-all"
                                                    value={clientPhone}
                                                    onChange={(e) => e.target.value.length <= 20 && setClientPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <label className="text-[11px] uppercase font-black tracking-[0.3em] text-white ml-1 block">{t('book_booking_experience')}</label>
                                        </div>
                                </div>
                                        <div className="p-8 bg-black/95 backdrop-blur-2xl border border-white/30 rounded-2xl space-y-8 shadow-2xl">
                                    <h4 className="text-[10px] uppercase tracking-widest font-black text-white">{t('book_select_service')}</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {serviceType === "full_preview" ? (
                                            <div className="p-6 border-2 border-white bg-accent rounded-xl cursor-pointer relative shadow-xl shadow-accent/50 scale-[1.02]">
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-black" />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                                                        <Scissors className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm text-white uppercase tracking-wider">{t('book_service_full')}</p>
                                                        <p className="text-xs text-white/70 mt-1">Full hair consultation with AI preview</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div onClick={() => setServiceType("full_preview")} className="p-6 border border-white/20 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 hover:border-white transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center">
                                                        <Scissors className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm text-white/70 uppercase tracking-wider">{t('book_service_full')}</p>
                                                        <p className="text-xs text-white/40 mt-1">Full hair consultation with AI preview</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {serviceType === "quick_service" ? (
                                            <div className="p-6 border-2 border-white bg-accent rounded-xl cursor-pointer relative shadow-xl shadow-accent/50 scale-[1.02]">
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-black" />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                                                        <Scissors className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm text-white uppercase tracking-wider">{t('book_service_quick')}</p>
                                                        <p className="text-xs text-white/70 mt-1">Quick trim or polish service</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div onClick={() => setServiceType("quick_service")} className="p-6 border border-white/20 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 hover:border-white transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center">
                                                        <Scissors className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm text-white/70 uppercase tracking-wider">{t('book_service_quick')}</p>
                                                        <p className="text-xs text-white/40 mt-1">Quick trim or polish service</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {services.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] uppercase tracking-widest text-white font-black">{t('book_select_service') || "Select Specific Services"}</Label>
                                            <span className="text-[9px] font-bold text-accent uppercase tracking-widest">{selectedServiceIds.length} Selected</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {services.map(service => (
                                                <div 
                                                    key={service.id}
                                                    onClick={() => {
                                                        if (selectedServiceIds.includes(service.id)) {
                                                            setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                                                        } else {
                                                            setSelectedServiceIds([...selectedServiceIds, service.id]);
                                                        }
                                                    }}
                                                    className={`p-4 border rounded-sm cursor-pointer transition-all flex items-center justify-between gap-4 ${selectedServiceIds.includes(service.id) ? "border-accent bg-accent/5" : "border-border hover:border-accent/20"}`}
                                                >
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-white uppercase tracking-wider">{translateServiceName(service.name)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-white">${service.price}</p>
                                                        {selectedServiceIds.includes(service.id) && <Check className="h-4 w-4 text-accent ml-auto mt-1" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                    <div className="space-y-4">
                                        <Button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (clientName) {
                                                    setCurrentStep(2);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }} 
                                            disabled={!clientName}
                                            className={`w-full h-16 uppercase text-xs tracking-[0.4em] font-black rounded-xl transition-all shadow-2xl ${clientName ? "bg-white text-black hover:bg-white/90 hover:scale-[1.02]" : "bg-white/20 text-white/40 border border-white/10 cursor-not-allowed"}`}
                                        >
                                            {t('next_step')}
                                        </Button>
                                        
                                         <Button 
                                            type="button"
                                            onClick={() => {
                                                setCurrentStep(6);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            variant="outline"
                                            className="w-full h-14 border-2 border-white/30 text-black bg-white hover:bg-white/90 hover:border-white text-[10px] uppercase tracking-[0.3em] font-black rounded-xl transition-all"
                                        >
                                            {t('direct_booking')}
                                        </Button>
                                    </div>
                                </div>
                        )}

                        {/* Step 2: Styling Preferences */}
                        {currentStep === 2 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="space-y-10 bg-black/95 backdrop-blur-2xl p-8 md:p-12 rounded-2xl border border-white/30 shadow-2xl">
                                    <div className="space-y-2 text-center pb-8 border-b border-white/10">
                                        <h3 className="font-display text-2xl font-black tracking-tighter uppercase text-white">{t('styling_choice_title')}</h3>
                                        <p className="text-white text-[10px] uppercase tracking-[0.2em] font-black">{t('flow_step_2_desc')}</p>
                                    </div>
                                    <div className="space-y-6">
                                        <label className="text-[11px] uppercase font-black tracking-[0.4em] text-white">{t('hair_texture_label')}</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {['straight', 'wavy', 'curly', 'coily'].map((texture) => (
                                                <button
                                                    key={texture}
                                                    onClick={() => setHairTexture(texture)}
                                                    className={`h-16 px-4 rounded-xl border text-sm font-bold uppercase tracking-widest transition-all ${hairTexture === texture ? "bg-accent border-accent text-accent-foreground" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
                                                >
                                                    {t(`hair_texture_${texture}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4 text-left">
                                            <Label className="text-[11px] uppercase font-black tracking-[0.3em] text-white">{t('color_choice_label')}</Label>
                                            <Select value={desiredColor} onValueChange={setDesiredColor}>
                                                <SelectTrigger className="h-14 bg-white/15 border-white/30 text-white rounded-xl focus:border-accent">
                                                    <SelectValue placeholder={t('select_color_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="black">{t('color_black')}</SelectItem>
                                                    <SelectItem value="dark_brown">{t('color_dark_brown')}</SelectItem>
                                                    <SelectItem value="medium_brown">{t('color_medium_brown')}</SelectItem>
                                                    <SelectItem value="light_brown">{t('color_light_brown')}</SelectItem>
                                                    <SelectItem value="blonde">{t('color_blonde')}</SelectItem>
                                                    <SelectItem value="red">{t('color_red')}</SelectItem>
                                                    <SelectItem value="silver">{t('color_silver')}</SelectItem>
                                                    <SelectItem value="creative">{t('color_creative')}</SelectItem>
                                                    <SelectItem value="other">{t('color_other')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4 text-left">
                                            <Label className="text-[11px] uppercase font-black tracking-[0.3em] text-white">{t('highlight_choice_label')}</Label>
                                            <Select value={highlightChoice} onValueChange={setHighlightChoice}>
                                                <SelectTrigger className="h-14 bg-white/15 border-white/30 text-white rounded-xl focus:border-accent">
                                                    <SelectValue placeholder={t('select_highlight_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">{t('highlight_none')}</SelectItem>
                                                    <SelectItem value="subtle">{t('highlight_subtle')}</SelectItem>
                                                    <SelectItem value="balayage">{t('highlight_balayage')}</SelectItem>
                                                    <SelectItem value="ombre">{t('highlight_ombre')}</SelectItem>
                                                    <SelectItem value="face_frame">{t('highlight_face_frame')}</SelectItem>
                                                    <SelectItem value="full">{t('highlight_full')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4 text-left">
                                            <Label className="text-[11px] uppercase font-black tracking-[0.3em] text-white">{t('goal_label')}</Label>
                                            <Select value={desiredLength} onValueChange={setDesiredLength}>
                                                <SelectTrigger className="h-14 bg-white/15 border-white/30 text-white rounded-xl focus:border-accent">
                                                    <SelectValue placeholder={t('select_length_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="buzz">{t('length_buzz')}</SelectItem>
                                                    <SelectItem value="short">{t('length_short')}</SelectItem>
                                                    <SelectItem value="medium">{t('length_medium')}</SelectItem>
                                                    <SelectItem value="long">{t('length_long')}</SelectItem>
                                                    <SelectItem value="maintain">{t('length_maintain')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4 text-left">
                                            <Label className="text-[11px] uppercase font-black tracking-[0.3em] text-white">{t('maint_level_label')}</Label>
                                            <Select value={maintenanceLevel} onValueChange={setMaintenanceLevel}>
                                                <SelectTrigger className="h-14 bg-white/15 border-white/30 text-white rounded-xl focus:border-accent">
                                                    <SelectValue placeholder={t('select_maint_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">{t('maint_low')}</SelectItem>
                                                    <SelectItem value="medium">{t('maint_medium')}</SelectItem>
                                                    <SelectItem value="high">{t('maint_high')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-left">
                                         <Label className="text-[11px] uppercase font-black tracking-[0.3em] text-white">{t('notes_label')}</Label>
                                         <Textarea 
                                             value={groomingNotes} 
                                             onChange={(e) => setGroomingNotes(e.target.value)} 
                                             placeholder={t('desired_style_placeholder')} 
                                             className="min-h-[160px] bg-white/15 border-white/30 focus:border-accent text-white placeholder:text-white/50 text-lg rounded-xl transition-all resize-none" 
                                             maxLength={250}
                                         />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button type="button" onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} variant="outline" className="w-1/3 h-16 uppercase text-xs tracking-widest font-bold border-white/20 text-white bg-white/5 rounded-xl hover:bg-white/10">{t('back_btn')}</Button>
                                    <Button 
                                        type="button"
                                        onClick={() => {
                                            handleStyleProfileSubmit();
                                        }} 
                                        disabled={serviceType === "full_preview" && !hairTexture}
                                        className={`w-2/3 h-16 uppercase text-xs tracking-[0.4em] font-black rounded-xl transition-all shadow-2xl ${(serviceType !== "full_preview" || hairTexture) ? "bg-white text-black hover:bg-white/90 hover:scale-[1.02]" : "bg-white/20 text-white/40 border border-white/10 cursor-not-allowed"}`}
                                    >
                                        {t('next_step')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Selfie Capture */}
                        {currentStep === 3 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="max-w-xl mx-auto space-y-8 text-center bg-black/95 backdrop-blur-2xl p-8 md:p-12 rounded-2xl border border-white/30 shadow-2xl">
                                    <h3 className="font-display text-2xl font-black tracking-tighter uppercase text-white">{t('visual_capture_title')}</h3>
                                    <p className="text-white text-sm font-black leading-relaxed tracking-wide">{t('flow_step_3_desc')}</p>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-[3/4] max-w-[320px] mx-auto border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-accent/40 transition-all bg-muted/20 relative overflow-hidden group shadow-2xl"
                                    >
                                        {clientPhoto ? (
                                            <img src={URL.createObjectURL(clientPhoto)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="space-y-4 p-8">
                                                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform">
                                                    <Camera className="h-8 w-8 text-accent" />
                                                </div>
                                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white">Tap to Take Photo</p>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" capture="user" onChange={(e) => e.target.files?.[0] && setClientPhoto(e.target.files[0])} />
                                    </div>
                                    <div className="flex gap-4 pt-8">
                                        <Button type="button" onClick={() => { setCurrentStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }} variant="outline" className="w-1/3 h-16 uppercase text-xs tracking-widest font-bold border-white/30 text-white bg-white/10 rounded-xl hover:bg-white/20">{t('back_btn')}</Button>
                                        <Button 
                                            type="button"
                                            onClick={() => {
                                                completeConsultationAndTriggerAI();
                                            }} 
                                            disabled={!clientPhoto} 
                                            className={`w-2/3 h-16 uppercase text-xs tracking-[0.4em] font-black rounded-xl transition-all shadow-2xl ${clientPhoto ? "bg-white text-black hover:bg-white/90 hover:scale-[1.02]" : "bg-white/20 text-white/40 border border-white/10 cursor-not-allowed"}`}
                                        >
                                            {t('next_step')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Looks Generation */}
                        {currentStep === 4 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="max-w-xl mx-auto text-center space-y-10 bg-black/95 backdrop-blur-2xl p-8 md:p-12 rounded-2xl border border-white/30 shadow-2xl">
                                    {generatingLooks ? (
                                        <>
                                            <div className="relative w-24 h-24 mx-auto mb-8">
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-full h-full border-2 border-dashed border-accent rounded-full" />
                                                <div className="absolute inset-0 flex items-center justify-center"><Camera className="h-8 w-8 text-accent/60" /></div>
                                            </div>
                                            <h3 className="font-display text-2xl font-black tracking-tighter uppercase text-white">AI Transformation Gallery</h3>
                                            <p className="text-white text-sm font-black italic">{t('looks_arriving')}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full mb-4">
                                                <Scissors className="h-3.5 w-3.5 text-accent" />
                                                <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-accent">{t('ai_tryon_looks')}</span>
                                            </div>
                                            <h3 className="font-display text-2xl font-black tracking-tighter uppercase text-white">AI Transformation Gallery</h3>
                                            {looks.length === 0 ? (
                                                <div className="py-12 space-y-6">
                                                    <p className="text-white/60 text-sm">Unable to generate AI looks. Please try again.</p>
                                                    <Button onClick={() => {
                                                        setLooks([]);
                                                        handleStyleProfileSubmit();
                                                    }} className="bg-white text-black hover:bg-white/90 h-12 px-8 rounded-xl text-xs tracking-widest font-bold uppercase">
                                                        Try Again
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-8">
                                                        {looks.slice(0, 2).map((look) => (
                                                            <div key={look.id} onClick={() => setSelectedLookLocal(look.look_number)} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedLookLocal === look.look_number ? "border-accent ring-2 ring-accent/20" : "border-white/10 hover:border-accent/40"}`}>
                                                                {look.image_url ? <img src={look.image_url} alt={`Look ${look.look_number}`} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center italic text-xs text-white/40">{t('error_gen_look')} {look.look_number}</div>}
                                                                <div className="absolute bottom-4 left-4"><span className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[9px] uppercase tracking-widest font-bold text-white">Look {look.look_number}</span></div>
                                                                {selectedLookLocal === look.look_number && <div className="absolute top-4 right-4 bg-accent p-1 rounded-full text-accent-foreground"><CheckCircle className="h-4 w-4" /></div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    <div className="flex items-start gap-4 p-6 border border-white/10 bg-white/5 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-xl mx-auto mt-8 shadow-inner">
                                                        <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                                        <div className="space-y-1 text-left">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Pro Tip</p>
                                                            <p className="text-xs text-white leading-relaxed font-black uppercase tracking-widest">Select Your Favorite Look</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-10 flex gap-4 max-w-md mx-auto">
                                                        <Button onClick={() => setCurrentStep(3)} variant="outline" className="w-1/3 h-16 uppercase text-xs tracking-widest font-bold border-white/10 text-white bg-white/5 rounded-xl hover:bg-white/10">{t('back_btn')}</Button>
                                                        <Button disabled={!selectedLookLocal} onClick={() => { setCurrentStep(5); window.scrollTo(0, 0); }} className="w-2/3 bg-white text-black hover:bg-white/90 hover:scale-[1.02] h-16 uppercase text-xs tracking-[0.3em] font-black rounded-xl shadow-2xl">{t('next_step')}</Button>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Refine & Inspiration */}
                        {currentStep === 5 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-accent" />
                                        <h4 className="text-[10px] uppercase tracking-widest font-black text-white">{t('rec_quote') || "AI Style Analysis"}</h4>
                                    </div>
                                    <AIRecommendation 
                                        consultationId={consultationId!} 
                                        initialRecommendation={null} 
                                        initialGeneratedAt={null}
                                        onUpdate={() => {}}
                                    />
                                </div>

                                <div className="bg-black/95 backdrop-blur-2xl border border-white/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                        <h5 className="text-[11px] uppercase tracking-[0.2em] font-black text-accent">{t('pro_insight_label')}</h5>
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    </div>
                                    <p className="text-xs text-white font-black uppercase tracking-widest leading-relaxed max-w-sm mx-auto">{t('pro_insight_desc')}</p>
                                </div>

                                <div className="p-8 bg-black/95 backdrop-blur-2xl border border-white/30 rounded-2xl space-y-6 text-left shadow-2xl">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] uppercase tracking-widest font-black text-accent">{t('flow_gen_refine_title')}</h4>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isRegenUsed ? "border-muted text-muted-foreground bg-muted/20" : "border-accent/40 text-accent bg-accent/10"}`}>
                                            {isRegenUsed ? t('flow_gen_limit_reached') : `1 ${t('flow_pass_remaining')}`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white leading-relaxed font-black mb-4">{t('flow_step_4_desc')}</p>
                                    
                                    {isRegenUsed && looks.length >= 3 && (
                                        <div className="text-center space-y-4 mb-6">
                                            <div onClick={() => setSelectedLookLocal(3)} className={`aspect-[3/4] w-48 rounded-sm overflow-hidden border-2 cursor-pointer transition-all mx-auto relative ${selectedLookLocal === 3 ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-accent/40"}`}>
                                                <img src={looks.find(l => l.look_number === 3)?.image_url || ''} className="w-full h-full object-cover" />
                                                {selectedLookLocal === 3 && <div className="absolute top-2 right-2 bg-accent p-1 rounded-full text-accent-foreground shadow-lg"><CheckCircle className="h-4 w-4" /></div>}
                                                <div className="absolute bottom-2 left-2"><span className="bg-black/80 backdrop-blur-sm border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-widest font-black text-white">{t('refined_look_label')}</span></div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] uppercase font-black tracking-[0.3em] text-white">{t('flow_description_change')}</Label>
                                            <Textarea 
                                                value={regenDescription} 
                                                onChange={(e) => setRegenDescription(e.target.value)} 
                                                placeholder={t('refine_placeholder')} 
                                                className="bg-white/15 border-white/30 min-h-[100px] resize-none text-lg text-white rounded-xl focus:border-accent placeholder:text-white/50" 
                                                maxLength={250} 
                                                disabled={isRegenUsed || isRegenerating} 
                                            />
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            disabled={isRegenUsed || isRegenerating || !selectedLookLocal} 
                                            onClick={handleRegenerate} 
                                            className="w-full h-14 bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground uppercase text-xs tracking-[0.3em] font-black rounded-xl"
                                        >
                                            {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> {t('refine_once_btn')}</>}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-8 border-t border-white/10 text-left">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] uppercase tracking-widest font-black text-white">{t('inspiration_canvas_title')}</h4>
                                        <span className={`text-[9px] font-bold px-4 py-1 rounded-full border ${inspirationFiles.length >= 2 ? "border-white/10 text-white" : "border-accent/40 text-accent"}`}>{inspirationFiles.length}/2 {t('files_used')}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {inspirationFiles.map((f, i) => (
                                            <div key={i} className="aspect-square bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative group">
                                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                                <button onClick={() => setInspirationFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                        {inspirationFiles.length < 2 && (
                                            <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e: any) => { const file = e.target.files[0]; if (file) setInspirationFiles(prev => [...prev, file]); }; input.click(); }} className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-accent/40 transition-colors bg-white/5 group"><Upload className="h-6 w-6 text-white/20 mb-2 group-hover:text-accent" /><span className="text-[9px] uppercase tracking-widest font-bold text-white/20 group-hover:text-white">{t('add_photo_btn')}</span></button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button type="button" onClick={() => { setCurrentStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }} variant="outline" className="w-1/3 h-16 uppercase text-xs tracking-widest font-bold border-white/10 text-white bg-white/5 rounded-xl hover:bg-white/10">{t('back_btn')}</Button>
                                    <Button type="button" onClick={() => { setCurrentStep(6); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-2/3 bg-white text-black hover:bg-white/90 hover:scale-[1.02] h-16 uppercase text-xs tracking-[0.4em] font-black rounded-xl shadow-2xl">{t('next_step')}</Button>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Scheduling & Finalize */}
                        {currentStep === 6 && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="space-y-8 bg-black/95 backdrop-blur-2xl p-8 md:p-12 rounded-2xl border border-white/30 shadow-2xl">
                                    <div className="space-y-6 text-center max-w-xl mx-auto">
                                        <h3 className="font-display text-2xl font-black tracking-tighter uppercase text-white">{t('secure_res_title')}</h3>
                                        <p className="text-white text-sm font-black leading-relaxed tracking-wide">{t('flow_step_6_desc')}</p>
                                    </div>

                                    <div className="space-y-8 text-left">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-accent" />
                                            <h3 className="font-display text-xs tracking-[0.3em] font-black uppercase text-white">AI Transformation Gallery</h3>
                                        </div>
                                        <AIRecommendation 
                                            consultationId={consultationId!} 
                                            initialRecommendation={null} 
                                            initialGeneratedAt={null}
                                            onUpdate={() => {}}
                                        />
                                        
                                        <div className="flex items-start gap-4 p-4 border border-accent/20 bg-accent/5 rounded-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
                                            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">{t('processing_note')}</p>
                                                <p className="text-xs text-white leading-relaxed font-medium">{t('processing_desc')}</p>
                                            </div>
                                        </div>

                                        <Button 
                                            type="button"
                                            onClick={() => {
                                                setSelectedLookLocal(null);
                                                window.scrollTo({ top: document.getElementById('date-section')?.offsetTop || 400, behavior: 'smooth' });
                                            }}
                                            className="w-full h-12 bg-white/10 border border-white/20 hover:bg-white/20 text-white/70 hover:text-white rounded-xl transition-all text-xs uppercase tracking-widest font-bold"
                                        >
                                            Continue Without AI Preview
                                        </Button>
                                    </div>

                                    <div className="space-y-10 text-left" id="date-section">
                                        <div className="space-y-4">
                                            <Label className="text-[11px] uppercase tracking-[0.3em] font-black text-white">{t('book_req_date')}</Label>
                                            
                                            {!requestedDate ? (
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('date-input') as HTMLInputElement | null;
                                                        if (input) {
                                                            try { input.showPicker?.(); } catch(e) { input.click(); }
                                                        }
                                                    }}
                                                    className="w-full h-20 bg-white/10 border-2 border-dashed border-white/30 hover:border-accent hover:bg-accent/10 text-white rounded-xl transition-all group"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Calendar className="h-8 w-8 text-accent group-hover:scale-110 transition-transform" />
                                                        <span className="text-lg font-black uppercase tracking-wider">Secure Your Reservation</span>
                                                        <span className="text-xs text-white/50 font-medium">Tap to open calendar</span>
                                                    </div>
                                                </Button>
                                            ) : (
                                                <div className="bg-accent/20 border-2 border-accent rounded-xl p-5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center">
                                                            <Calendar className="h-7 w-7 text-black" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-white font-bold text-xl">{new Date(requestedDate + 'T00:00:00').toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                            <button type="button" onClick={() => setRequestedDate("")} className="text-accent text-sm underline hover:text-white transition-colors">Change date</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <Input 
                                                id="date-input"
                                                type="date" 
                                                min={new Date().toISOString().split("T")[0]} 
                                                value={requestedDate} 
                                                onChange={(e) => setRequestedDate(e.target.value)} 
                                                className="hidden"
                                            />
                                        </div>
                                        
                                        {requestedDate && availableSlots.length > 0 && (
                                            <div className="space-y-4">
                                                <Label className="text-[11px] uppercase tracking-[0.3em] font-black text-white">{t('book_select_time')}</Label>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {availableSlots.map((slotObj) => (
                                                        <Button key={slotObj.time} variant={selectedSlot === slotObj.time ? "default" : "outline"} size="sm" onClick={() => slotObj.available && setSelectedSlot(slotObj.time)} disabled={!slotObj.available} className={`text-xs h-12 tracking-widest font-black uppercase rounded-lg transition-all ${selectedSlot === slotObj.time ? "bg-white text-black border-white shadow-lg" : "bg-white/10 border-white/20 text-white"}`}>{slotObj.time}</Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {requestedDate && availableSlots.length === 0 && (
                                            <div className="py-10 px-4 text-center border border-white/10 bg-white/5 space-y-3 rounded-2xl">
                                                <Calendar className="h-8 w-8 text-white/20 mx-auto mb-2" />
                                                <p className="text-xs text-white tracking-[0.2em] font-black uppercase">{t('no_slots_msg')}</p>
                                                <Button variant="link" onClick={() => setRequestedDate("")} className="text-[10px] uppercase tracking-widest font-black text-accent">{t('choose_another_date')}</Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-8 pt-8 border-t border-white/10">
                                        <div className="flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl text-left group cursor-pointer hover:bg-white/10 transition-all">
                                            <Checkbox id="consent" checked={socialConsent} onCheckedChange={(checked) => setSocialConsent(checked as boolean)} className="mt-1 border-white/20 data-[state=checked]:bg-accent data-[state=checked]:border-accent" />
                                            <Label htmlFor="consent" className="text-xs text-white leading-relaxed font-black uppercase tracking-wider cursor-pointer group-hover:text-white">{t('consent_label')}</Label>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button type="button" onClick={() => { setCurrentStep(serviceType === "full_preview" ? 5 : 2); window.scrollTo({ top: 0, behavior: 'smooth' }); }} variant="outline" className="w-1/3 h-16 uppercase text-xs tracking-widest font-bold border-white/10 text-white bg-white/5 rounded-xl hover:bg-white/10">{t('back_btn')}</Button>
                                            <Button type="button" onClick={(e) => { e.preventDefault(); handleFinalSubmit(); }} disabled={submitting || !selectedSlot} className="w-2/3 bg-white text-black hover:bg-white/90 hover:scale-[1.02] h-16 uppercase text-xs tracking-[0.4em] font-black rounded-xl shadow-2xl">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('complete_booking_btn', { name: stylist?.full_name })}</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="border-t border-border/40 bg-background/50 backdrop-blur-md px-6 md:px-12 py-12 text-center mt-20">
                <p className="text-xs md:text-[10px] tracking-[0.3em] uppercase text-white font-black">{t('book_powered_by')}</p>
            </footer>
        </div>
    </div>
    );
};

export default ClientBooking;
