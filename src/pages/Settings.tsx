import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, Check, ExternalLink, Camera, Plus, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { validateImage } from "@/utils/imageValidation";
import { Loader2, Smartphone } from "lucide-react";
import { PWAInstallButton } from "@/components/PWAInstallButton";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: (t: any) => Record<string, string> = (t) => ({
  monday: t("day_mon"),
  tuesday: t("day_tue"),
  wednesday: t("day_wed"),
  thursday: t("day_thu"),
  friday: t("day_fri"),
  saturday: t("day_sat"),
  sunday: t("day_sun"),
});

interface DayHours { start: string; end: string; active: boolean }
type WorkingHours = Record<string, DayHours>;

interface RecurringBlock {
  id: string;
  days: string[];
  start: string;
  end: string;
  label: string;
  active: boolean;
}

interface BlockedSlot {
  date: string;
  start: string;
  end: string;
  label?: string;
}

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30];

const DEFAULT_HOURS: WorkingHours = {
  monday: { start: "09:00", end: "17:00", active: true },
  tuesday: { start: "09:00", end: "17:00", active: true },
  wednesday: { start: "09:00", end: "17:00", active: true },
  thursday: { start: "09:00", end: "17:00", active: true },
  friday: { start: "09:00", end: "17:00", active: true },
  saturday: { start: "10:00", end: "15:00", active: true },
  sunday: { start: "00:00", end: "00:00", active: false },
};

const RESERVED_WORDS = [
  "login", "admin", "support", "pricing", "contact", "about",
  "app", "stylist", "salon", "book", "signup", "dashboard",
  "settings", "consultation", "clients", "insights", "services",
  "legal", "try-on", "preview", "api", "auth", "profile", "main"
];

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [fullName, setFullName] = useState("");
  const [salonName, setSalonName] = useState("");
  const [bookingSlug, setBookingSlug] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [location, setLocation] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [validating, setValidating] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_HOURS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringBlock[]>([]);
  const [bufferMinutes, setBufferMinutes] = useState<number>(0);
  const [confirmationWindow, setConfirmationWindow] = useState("24 hours");


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [textSize, setTextSize] = useState("medium");
  const [clientTextSize, setClientTextSize] = useState("text-base");
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, salon_name, booking_slug, bio, specialties, location")
        .eq("user_id", user.id)
        .single();

      // Fetch new columns separately to avoid type errors until types.ts is regenerated
      const { data: extData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      const ext = extData as unknown as Record<string, unknown> | null;

      if (data) {
        setFullName(data.full_name || "");
        setSalonName(data.salon_name || "");
        setBookingSlug(data.booking_slug || "");
        setBio(data.bio || "");
        setSpecialties(Array.isArray(data.specialties) ? data.specialties.join(", ") : "");
        setLocation(data.location || "");
        setProfileImageUrl(ext?.profile_image_url as string | null);
        setProfileImageUrl(ext?.profile_image_url as string | null);
        const wh = ext?.working_hours;
        if (wh && typeof wh === "object") {
          setWorkingHours({ ...DEFAULT_HOURS, ...(wh as WorkingHours) });
        }
        const bs = ext?.blocked_slots;
        if (Array.isArray(bs)) {
          setBlockedSlots(bs as BlockedSlot[]);
        }
        const rb = ext?.recurring_blocks;
        if (Array.isArray(rb)) {
          setRecurringBlocks(rb as RecurringBlock[]);
        }
        const buf = ext?.appointment_buffer_minutes;
        if (typeof buf === 'number') {
          setBufferMinutes(buf);
        }
        const cw = ext?.booking_confirmation_window;
        if (typeof cw === 'string') {
          setConfirmationWindow(cw);
        }
        const tz = ext?.timezone;
        if (typeof tz === 'string') {
          setTimezone(tz);
        }

        if (ext?.text_size_preference) {
          const size = ext.text_size_preference as string;
          setTextSize(size);
          document.documentElement.setAttribute("data-text-size", size);
        }
        if (ext?.client_text_size_preference) {
          setClientTextSize(ext.client_text_size_preference as string);
        }
        setSubscriptionTier(ext?.subscription_tier as string | null || "trial");
        setSubStatus(ext?.subscription_status as string | null || "trialing");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setValidating(true);
    const result = await validateImage(file, t);
    setValidating(false);

    if (!result.valid) {
      toast({
        title: t("fail_upload"),
        description: result.error,
        variant: "destructive"
      });
      e.target.value = "";
      return;
    }

    setUploadingAvatar(true);

    const path = `${userId}/profile-avatar.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("consultation-images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast({ title: t('upload_failed'), description: uploadError.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = await supabase.storage
      .from("consultation-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (urlData?.signedUrl) {
      await supabase.from("profiles")
        .update({ profile_image_url: urlData.signedUrl } as Record<string, unknown>)
        .eq("user_id", userId);
      setProfileImageUrl(urlData.signedUrl);
      toast({ title: t('profile_pic_updated') });
    }
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const cleanSlug = bookingSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-") // Allow letters, numbers, and hyphens only
      .replace(/-+/g, "-")         // Replace multiple hyphens with one
      .replace(/^-|-$/g, "");      // Remove leading/trailing hyphens

    if (!cleanSlug && bookingSlug) {
      toast({ title: t('invalid_handle'), description: t('invalid_handle_desc'), variant: "destructive" });
      setSaving(false);
      return;
    }

    if (!cleanSlug) {
      toast({ title: t('handle_req'), description: t('handle_req_desc'), variant: "destructive" });
      setSaving(false);
      return;
    }

    if (RESERVED_WORDS.includes(cleanSlug)) {
      toast({ title: t('invalid_handle'), description: t('handle_reserved'), variant: "destructive" });
      setSaving(false);
      return;
    }

    const specialtiesArray = specialties.split(",").map((s) => s.trim()).filter(Boolean);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        full_name: fullName,
        first_name: fullName.split(" ")[0] || null,
        salon_name: salonName || null,
        booking_slug: cleanSlug || null,
        bio: bio || null,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
        location: location || null,
        working_hours: workingHours,
        blocked_slots: blockedSlots,
        recurring_blocks: recurringBlocks,
        appointment_buffer_minutes: bufferMinutes,
        text_size_preference: textSize,
        client_text_size_preference: clientTextSize,
        booking_confirmation_window: confirmationWindow,
        timezone: timezone,
      } as any, { onConflict: 'user_id' });


    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast({ title: t('handle_taken'), description: t('handle_taken_desc'), variant: "destructive" });
      } else {
        toast({ title: t('fail_save'), description: error.message, variant: "destructive" });
      }
    } else {
      setBookingSlug(cleanSlug);
      toast({ title: t('settings_saved') });
    }
    setSaving(false);
  };

  // Branding: app.getaxishair.com/{slug}
  const domain = window.location.hostname === "localhost" ? "localhost:8081" : "app.getaxishair.com";
  const protocol = window.location.hostname === "localhost" ? "http://" : "https://";
  const displayBaseUrl = `${domain}/`;
  const bookingUrl = bookingSlug ? `${protocol}${displayBaseUrl}${bookingSlug}` : null;

  const handleCopy = async () => {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({ title: t('link_copied') });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManageBilling = () => {
    navigate("/subscription");
  };

  const updateDayHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // ── Blocked Date Slots ─────────────────────────────────────────────────────
  const addBlockedSlot = () => {
    setBlockedSlots(prev => [...prev, { date: format(new Date(), "yyyy-MM-dd"), start: "09:00", end: "10:00", label: "" }]);
  };

  const removeBlockedSlot = (index: number) => {
    setBlockedSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateBlockedSlot = (index: number, field: string, value: string) => {
    setBlockedSlots(prev => prev.map((slot, i) => i === index ? { ...slot, [field]: value } : slot));
  };

  // ── Recurring Blocks ──────────────────────────────────────────────────────
  const addRecurringBlock = () => {
    const newBlock: RecurringBlock = {
      id: crypto.randomUUID(),
      days: [],
      start: "12:00",
      end: "13:00",
      label: "",
      active: true,
    };
    setRecurringBlocks(prev => [...prev, newBlock]);
  };

  const removeRecurringBlock = (id: string) => {
    setRecurringBlocks(prev => prev.filter(b => b.id !== id));
  };

  const updateRecurringBlock = (id: string, field: keyof RecurringBlock, value: any) => {
    setRecurringBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const toggleRecurringDay = (id: string, day: string) => {
    setRecurringBlocks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const has = b.days.includes(day);
      return { ...b, days: has ? b.days.filter(d => d !== day) : [...b.days, day] };
    }));
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-axis-salon">
      <header className="border-b border-border/20 px-6 md:px-12 py-4 flex items-center justify-between backdrop-blur-md bg-background/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:text-white/80 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-white">
            AXIS HAIR™
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-lg p-8 md:p-12 shadow-2xl">
          <h1 className="font-display text-2xl font-semibold tracking-[0.15em] uppercase text-foreground mb-2">
            {t('settings_title')}
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            {t('settings_sub')}
          </p>

          <div className="space-y-12">
          {/* Profile Picture */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              {t('profile_picture')}
            </h2>
            <div className="flex items-center gap-5">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-border">
                  {profileImageUrl ? (
                    <AvatarImage src={profileImageUrl} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="text-lg font-display tracking-wider">
                    {fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-foreground" />
                </button>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-xs tracking-[0.1em] uppercase"
                >
                  {validating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("val_detecting")}
                    </div>
                  ) : uploadingAvatar ? t('uploading') : t('upload_photo')}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1.5">{t('max_size')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* Profile Fields */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              {t('your_profile')}
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-xs tracking-[0.12em] uppercase text-muted-foreground">{t('book_name')}</Label>
                <Input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-salon" className="text-xs tracking-[0.12em] uppercase text-muted-foreground">{t('salon_name')}</Label>
                <Input id="profile-salon" value={salonName} onChange={(e) => setSalonName(e.target.value)} className="bg-background border-border" placeholder={t('optional')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-location" className="text-xs tracking-[0.12em] uppercase text-muted-foreground">{t('location')}</Label>
                <Input id="profile-location" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-background border-border" placeholder="e.g. Brooklyn, NY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-timezone" className="text-xs tracking-[0.12em] uppercase text-muted-foreground">{t('timezone') || "Time Zone"}</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="profile-timezone" className="bg-background border-border h-10 text-xs">
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEST/AEDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-specialties" className="text-xs tracking-[0.12em] uppercase text-muted-foreground">
                  {t('specialties')} <span className="normal-case text-muted-foreground/60">({t('optional').toLowerCase()})</span>
                </Label>
                <Input id="profile-specialties" value={specialties} onChange={(e) => setSpecialties(e.target.value)} className="bg-background border-border" placeholder={t('specialties_placeholder')} />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">{t('bio')}</Label>
              <div className="relative">
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 300))}
                  className="bg-background border-border min-h-[80px] resize-none pb-8"
                  placeholder={t('bio_placeholder')}
                  maxLength={300}
                  aria-label="Professional bio"
                />
                <div className="absolute bottom-2 right-3 text-xs md:text-[10px] text-muted-foreground/60 tabular-nums">
                  {bio.length}/300
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              {t('settings_working_hours')}
            </h2>
            <div className="space-y-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <div className="w-10 text-xs font-medium text-muted-foreground tracking-wide">
                    {DAY_LABELS(t)[day]}
                  </div>
                  <Switch
                    checked={workingHours[day]?.active ?? false}
                    onCheckedChange={(v) => updateDayHours(day, "active", v)}
                  />
                  {workingHours[day]?.active ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={workingHours[day]?.start || "09:00"}
                        onChange={(e) => updateDayHours(day, "start", e.target.value)}
                        className="w-[110px] h-8 text-xs bg-background border-border"
                      />
                      <span className="text-xs text-muted-foreground">{t('to').toLowerCase()}</span>
                      <Input
                        type="time"
                        value={workingHours[day]?.end || "17:00"}
                        onChange={(e) => updateDayHours(day, "end", e.target.value)}
                        className="w-[110px] h-8 text-xs bg-background border-border"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">{t('closed')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Time Blocks */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
              {t('settings_recurring_blocks')}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {t('settings_recurring_sub')}
            </p>
            <div className="space-y-4 mb-4">
              {recurringBlocks.map((block) => (
                <div key={block.id} className="border border-border rounded-sm p-4 space-y-4 bg-muted/10 relative">
                  {/* Header row: label + active toggle + delete */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder={t('settings_recurring_label')}
                        value={block.label}
                        onChange={(e) => updateRecurringBlock(block.id, 'label', e.target.value)}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-[10px] text-muted-foreground uppercase tracking-wider">{t('settings_recurring_active')}</span>
                      <Switch
                        checked={block.active}
                        onCheckedChange={(v) => updateRecurringBlock(block.id, 'active', v)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remove rule"
                      onClick={() => removeRecurringBlock(block.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Time range */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      type="time"
                      value={block.start}
                      onChange={(e) => updateRecurringBlock(block.id, 'start', e.target.value)}
                      className="w-[105px] h-8 text-xs bg-background border-border"
                    />
                    <span className="text-xs text-muted-foreground">{t('to').toLowerCase()}</span>
                    <Input
                      type="time"
                      value={block.end}
                      onChange={(e) => updateRecurringBlock(block.id, 'end', e.target.value)}
                      className="w-[105px] h-8 text-xs bg-background border-border"
                    />
                  </div>

                  {/* Day selector */}
                  <div className="space-y-2">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{t('settings_recurring_days')}</p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const isSelected = block.days.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleRecurringDay(block.id, day)}
                            className={`h-8 px-3 text-xs md:text-[10px] tracking-[0.1em] uppercase font-medium rounded-sm border transition-colors ${
                              isSelected
                                ? 'bg-accent text-accent-foreground border-accent'
                                : 'bg-background text-muted-foreground border-border hover:border-accent/50'
                            }`}
                          >
                            {DAY_LABELS(t)[day]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addRecurringBlock}
              className="text-xs md:text-[10px] tracking-[0.15em] uppercase border-dashed h-8 gap-2"
            >
              <Plus className="h-3 w-3" />
              {t('settings_add_recurring')}
            </Button>
          </div>

          {/* Date-Specific Blocks */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
              {t('settings_blocked_slots')}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {t('settings_blocked_sub')}
            </p>
            <div className="space-y-3 mb-4">
              {blockedSlots.map((slot, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-muted/20 border border-border rounded-sm">
                  <div className="flex-1 w-full sm:w-auto grid grid-cols-1 gap-2">
                    <Input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateBlockedSlot(i, "date", e.target.value)}
                      className="h-8 text-xs bg-background border-border"
                    />
                    <Input
                      placeholder={t('settings_blocked_label')}
                      value={slot.label || ""}
                      onChange={(e) => updateBlockedSlot(i, "label", e.target.value)}
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateBlockedSlot(i, "start", e.target.value)}
                      className="w-[100px] h-8 text-xs bg-background border-border"
                    />
                    <span className="text-xs text-muted-foreground">{t('to').toLowerCase()}</span>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateBlockedSlot(i, "end", e.target.value)}
                      className="w-[100px] h-8 text-xs bg-background border-border"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBlockedSlot(i)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    title="Remove block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addBlockedSlot}
              className="text-xs md:text-[10px] tracking-[0.15em] uppercase border-dashed h-8 gap-2"
            >
              <Plus className="h-3 w-3" />
              {t('settings_add_blocked')}
            </Button>
          </div>

          {/* Appointment Buffer Time */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
              {t('settings_buffer_title')}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {t('settings_buffer_sub')}
            </p>
            <div>
              <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-3 block">
                {t('settings_buffer_label')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {BUFFER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBufferMinutes(opt)}
                    className={`h-9 px-4 text-xs tracking-[0.1em] uppercase font-medium rounded-sm border transition-colors ${
                      bufferMinutes === opt
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-background text-muted-foreground border-border hover:border-accent/50'
                    }`}
                  >
                    {opt === 0 ? t('settings_buffer_none') : `${opt} min`}
                  </button>
                ))}
              </div>
              {bufferMinutes > 0 && (
                <p className="text-[10px] text-muted-foreground/60 mt-3 italic">
                  A {bufferMinutes}-minute buffer will automatically be added after each appointment.
                </p>
              )}
            </div>
          </div>
          
          {/* Booking Confirmation Window */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
              {t('setting_confirm_window')}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {t('setting_confirm_window_desc')}
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="confirmation-window" className="text-xs tracking-[0.12em] uppercase text-muted-foreground">
                  Confirmation Time
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="confirmation-window" 
                    value={confirmationWindow} 
                    onChange={(e) => setConfirmationWindow(e.target.value)} 
                    className="bg-background border-border"
                    placeholder="e.g. 24 hours"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {["24 hours", "48 hours", "72 hours"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setConfirmationWindow(preset)}
                      className={`px-3 py-1 text-[10px] tracking-[0.05em] uppercase border rounded-full transition-colors ${
                        confirmationWindow === preset 
                          ? 'bg-foreground text-background border-foreground' 
                          : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>


          {/* Booking Link */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              {t('booking_link')}
            </h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              {t('booking_link_sub')}
            </p>
            <div className="space-y-6">

              {/* Actual Editable Input */}
              <div className="space-y-2 p-4 border-2 border-accent/20 bg-accent/5 rounded-md">
                <Label htmlFor="booking-slug" className="text-xs tracking-[0.12em] uppercase text-foreground font-bold flex items-center gap-2">
                  {t('edit_handle')}
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-muted-foreground whitespace-nowrap shrink-0">{displayBaseUrl}</span>
                  <Input
                    id="booking-slug"
                    value={bookingSlug}
                    onChange={(e) => setBookingSlug(e.target.value)}
                    onBlur={(e) => {
                      // Format to valid slug on blur so we don't interrupt typing
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                      setBookingSlug(val);
                    }}
                    className="bg-background border-accent shadow-sm font-mono text-foreground font-medium"
                    placeholder="marcus-cuts"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">{t('slug_help')}</p>
              </div>

              {/* Read Only Preview */}
              {bookingUrl && (
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground px-1">
                    {t('live_link_label')}
                  </Label>
                  <div className="rounded-md p-4 bg-background border border-dashed border-border flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 opacity-70">
                      <p className="text-sm text-foreground font-mono truncate">{bookingUrl}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="icon" onClick={handleCopy} className="h-8 w-8 border-border hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors group">
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => window.open(bookingUrl, "_blank")} className="h-8 w-8 border-border hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors group">
                        <ExternalLink className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Services & Pricing */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
              {t('ser_man_title')}
            </h2>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Add or manage the services and prices you offer. These appear on your client booking page.
            </p>
            <div className="border border-border rounded-sm p-4 bg-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.12em] uppercase text-foreground mb-1">Services &amp; Prices</p>
                <p className="text-sm text-muted-foreground">Set your service menu, durations, and pricing for clients to choose from when booking.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/services")}
                className="shrink-0 tracking-[0.12em] uppercase text-xs gap-2"
              >
                Manage Services
              </Button>
            </div>
          </div>

          {/* Billing & Subscription */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              {t('billing_title')}
            </h2>
            <div className="border border-border rounded-sm p-4 bg-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.12em] uppercase text-foreground mb-1">{t('manage_plan')}</p>
                <p className="text-sm text-muted-foreground">{t('billing_desc')}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={saving}
                className="shrink-0 tracking-[0.12em] uppercase text-xs"
              >
                {t('billing_portal')}
              </Button>
            </div>
          </div>

          {/* Typography Settings */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
                {t('settings_typography_title')}
              </h2>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                {t('settings_typography_sub')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["small", "medium", "large", "extra-large"].map((size) => (
                  <Button
                    key={size}
                    variant={textSize === size ? "default" : "outline"}
                    onClick={() => {
                      setTextSize(size);
                      document.documentElement.setAttribute("data-text-size", size);
                      localStorage.setItem("axis-text-size", size);
                    }}
                    className="h-10 text-xs md:text-[10px] tracking-widest uppercase"
                  >
                    {t(`settings_text_size_${size.replace("-", "_")}` as any)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
                {t('settings_client_typography_title')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "text-sm", label: t("settings_text_size_small") },
                  { id: "text-base", label: t("settings_text_size_medium") },
                  { id: "text-lg", label: t("settings_text_size_large") },
                  { id: "text-xl", label: t("settings_text_size_extra_large") }
                ].map((opt) => (
                  <Button
                    key={opt.id}
                    variant={clientTextSize === opt.id ? "default" : "outline"}
                    onClick={() => setClientTextSize(opt.id)}
                    className="h-10 text-xs md:text-[10px] tracking-widest uppercase"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subscription Plan */}
            <div className="pt-4 border-t border-border">
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
                {t('pricing_label')}
              </h2>
              <div className="bg-accent/5 border border-accent/10 rounded-sm p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">Current Plan</p>
                  <p className="font-display text-sm font-bold tracking-[0.1em] uppercase text-foreground">
                    {subscriptionTier ? (
                      t(`dash_tier_${subscriptionTier.toLowerCase().replace('professional', 'pro')}` as any)
                    ) : '---'}
                    {subStatus === 'trialing' ? ` (${t('dash_tier_trial')})` : ''}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="text-[10px] tracking-widest uppercase h-8"
                >
                  {t('sub_manage_cta')}
                </Button>
              </div>
            </div>

            {/* App Installation */}
            <div className="pt-4 pb-8 border-t border-border">
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
                {t('pwa_download_app')}
              </h2>
              <div className="border border-border rounded-sm p-5 bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent/10 rounded-full">
                    <Smartphone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.12em] uppercase text-foreground mb-1 font-bold">{t('pwa_install_promo')}</p>
                    <p className="text-xs text-muted-foreground">Access your dashboard instantly from your home screen.</p>
                  </div>
                </div>
                <PWAInstallButton />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="pt-2 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:opacity-90 tracking-[0.18em] uppercase text-xs font-semibold h-12 px-8"
            >
              {saving ? "..." : t('settings_save')}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="tracking-[0.12em] uppercase text-xs h-12 px-8 border-border"
            >
              {t('settings_back')}
            </Button>
          </div>
          </div>

          {/* System Reliability */}
          <div className="pt-12 border-t border-border/40 mt-8 pb-8">
            <div className="max-w-md">
              <h3 className="font-display text-sm md:text-[10px] tracking-[0.3em] uppercase text-foreground/80 mb-2">
                {t('reliability_tagline')}
              </h3>
              <p className="text-[10px] text-foreground/60 tracking-wider leading-relaxed">
                {t('reliability_description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
