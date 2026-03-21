import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

type Section = "privacy" | "terms" | "cookies" | "accessibility" | "about" | "contact";

const sectionTitles: Record<Section, { en: string; es: string; fr: string }> = {
    about: { en: "About AXIS HAIR™", es: "Acerca de AXIS HAIR™", fr: "À Propos d'AXIS HAIR™" },
    contact: { en: "Contact Us", es: "Contáctanos", fr: "Contactez-Nous" },
    privacy: { en: "Privacy Policy", es: "Política de Privacidad", fr: "Politique de Confidentialité" },
    terms: { en: "Terms of Service", es: "Términos de Servicio", fr: "Conditions d'Utilisation" },
    cookies: { en: "Cookie Policy", es: "Política de Cookies", fr: "Politique des Cookies" },
    accessibility: { en: "Accessibility Statement", es: "Declaración de Accesibilidad", fr: "Déclaration d'Accessibilité" }
};

const sectionContent: Record<Section, { 
    title: { en: string; es: string; fr: string };
    lastUpdated: string;
    body: { en: React.ReactNode; es: React.ReactNode; fr: React.ReactNode };
}> = {
    about: {
        title: { en: "About AXIS HAIR™", es: "Acerca de AXIS HAIR™", fr: "À Propos d'AXIS HAIR™" },
        lastUpdated: "February 26, 2026",
        body: {
            en: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>AXIS HAIR™ is revolutionizing the hairstyling industry by bridging the gap between client vision and stylist expertise through cutting-edge AI technology.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Our Mission</h3><p>We empower stylists and barbers to deliver personalized hair consultations that exceed client expectations.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">How It Works</h3><p>Stylists upload a client's photo and describe their desired look.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Who We Serve</h3><p>AXIS HAIR™ serves professional stylists, barbers, and salons of all sizes.</p></section>
                </div>
            ),
            es: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>AXIS HAIR™ está revolucionando la industria del peinado.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Nuestra Misión</h3><p>Empoderamos a los estilistas para ofrecer consultas personalizadas.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Cómo Funciona</h3><p>Los estilistas suben la foto del cliente y describen el look deseado.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">A Quién Servimos</h3><p>AXIS HAIR™ sirve a estilistas profesionales de todos los tamaños.</p></section>
                </div>
            ),
            fr: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>AXIS HAIR™ révolutionne l'industrie de la coiffure.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Notre Mission</h3><p>Nous permettons aux stylistes de proposer des consultations personnalisées.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Comment Ça Fonctionne</h3><p>Les stylistes téléchargent la photo du client.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">À Qui Nous Servons</h3><p>AXIS HAIR™ sert les professionnels de toutes tailles.</p></section>
                </div>
            )
        }
    },
    contact: {
        title: { en: "Contact Us", es: "Contáctanos", fr: "Contactez-Nous" },
        lastUpdated: "February 26, 2026",
        body: {
            en: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>We'd love to hear from you.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Email</h3><p><a href="mailto:axishairteam@gmail.com" className="text-accent hover:underline">axishairteam@gmail.com</a></p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Business Hours</h3><p>Mon – Thurs, 9am – 4pm E.S.T.</p></section>
                </div>
            ),
            es: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Nos encantaría saber de usted.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Correo</h3><p><a href="mailto:axishairteam@gmail.com" className="text-accent hover:underline">axishairteam@gmail.com</a></p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Horario</h3><p>Lun – Jue, 9am – 4pm E.S.T.</p></section>
                </div>
            ),
            fr: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Nous aimerions avoir de vos nouvelles.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">E-mail</h3><p><a href="mailto:axishairteam@gmail.com" className="text-accent hover:underline">axishairteam@gmail.com</a></p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Heures d'Ouverture</h3><p>Lun – Jeu, 9am – 4pm E.S.T.</p></section>
                </div>
            )
        }
    },
    privacy: {
        title: { en: "Privacy Policy", es: "Política de Privacidad", fr: "Politique de Confidentialité" },
        lastUpdated: "February 26, 2026",
        body: {
            en: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>We take your privacy seriously.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Data Collection</h3><p>We collect information you provide directly.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Payment</h3><p>Payments are processed securely via Stripe.</p></section>
                </div>
            ),
            es: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Nos tomamos su privacidad en serio.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Recopilación</h3><p>Recopilamos la información que proporciona.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Pagos</h3><p>Los pagos se procesan de forma segura.</p></section>
                </div>
            ),
            fr: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Nous prenons votre vie privée au sérieux.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Collecte</h3><p>Nous collectons les informations que vous fournissez.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Paiements</h3><p>Les paiements sont traités en toute sécurité.</p></section>
                </div>
            )
        }
    },
    terms: {
        title: { en: "Terms of Service", es: "Términos de Servicio", fr: "Conditions d'Utilisation" },
        lastUpdated: "February 26, 2026",
        body: {
            en: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>By using AXIS HAIR™, you agree to our terms.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Service Disclaimer</h3><p>AI previews are for visualization only.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Subscriptions</h3><p>Pro subscriptions are billed monthly.</p></section>
                </div>
            ),
            es: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Al usar AXIS HAIR™, acepta nuestros términos.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Aviso</h3><p>Las previsualizaciones son solo para visualización.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Suscripciones</h3><p>Las suscripciones se facturan mensualmente.</p></section>
                </div>
            ),
            fr: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>En utilisant AXIS HAIR™, vous acceptez nos conditions.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Avertissement</h3><p>Les aperçus IA sont uniquement pour visualisation.</p></section>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Abonnements</h3><p>Les abonnements sont facturés mensuellement.</p></section>
                </div>
            )
        }
    },
    cookies: {
        title: { en: "Cookie Policy", es: "Política de Cookies", fr: "Politique des Cookies" },
        lastUpdated: "February 26, 2026",
        body: {
            en: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>We use cookies to improve your experience.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Essential</h3><p>Session cookies keep you logged in.</p></section>
                </div>
            ),
            es: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Usamos cookies para mejorar su experiencia.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Esenciales</h3><p>Las cookies de sesión mantienen la sesión iniciada.</p></section>
                </div>
            ),
            fr: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Nous utilisons des cookies pour améliorer votre expérience.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Essentiels</h3><p>Les cookies de session vous gardent connecté.</p></section>
                </div>
            )
        }
    },
    accessibility: {
        title: { en: "Accessibility Statement", es: "Declaración de Accesibilidad", fr: "Déclaration d'Accessibilité" },
        lastUpdated: "February 26, 2026",
        body: {
            en: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>We are committed to accessibility.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Commitment</h3><p>We strive for WCAG 2.1 AA compliance.</p></section>
                </div>
            ),
            es: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Estamos comprometidos con la accesibilidad.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Compromiso</h3><p>Intentamos cumplir con WCAG 2.1 AA.</p></section>
                </div>
            ),
            fr: (
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>Nous nous engageons pour l'accessibilité.</p>
                    <section><h3 className="text-foreground font-semibold uppercase tracking-wider mb-2">Engagement</h3><p>Nous visons la conformité WCAG 2.1 AA.</p></section>
                </div>
            )
        }
    }
};

const Legal = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { lang } = useLanguage();
    const pathSection = searchParams.get("section") as Section;
    const pathName = location.pathname.replace("/", "") as Section;
    const section = pathSection || pathName || "about";

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [section]);

    const content = sectionContent[section] || sectionContent.privacy;
    const title = content.title[lang] || content.title.en;
    const body = content.body[lang] || content.body.en;

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border px-6 md:px-12 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-foreground/70 hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
                    AXIS HAIR™
                </span>
            </header>

            <div className="max-w-2xl mx-auto px-6 md:px-12 py-16">
                <div className="space-y-2 mb-12">
                    <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-[0.1em] uppercase text-foreground">
                        {title}
                    </h1>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
                        Last Updated: {content.lastUpdated}
                    </p>
                </div>

                <div className="axis-divider mb-12" />

                {body}

                <div className="mt-20 flex flex-wrap gap-x-8 gap-y-4 pt-8 border-t border-border">
                    {(Object.keys(sectionContent) as Section[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => navigate(`/${s}`)}
                            className={`text-[10px] tracking-[0.15em] uppercase font-semibold transition-colors ${section === s ? "text-accent" : "text-muted-foreground/60 hover:text-foreground"
                                }`}
                        >
                            {sectionTitles[s][lang] || sectionTitles[s].en}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Legal;
