export interface ConsultationFormData {
  // Client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  // Service
  serviceType: "quick_service" | "full_preview";
  // Hair profile
  faceShape: string;
  hairTexture: string;
  desiredLength: string;
  // Lifestyle
  maintenanceLevel: string;
  lifestyle: string;
  inspirationNotes: string;
  // Appointment
  estimatedPrice: string;
  estimatedDuration: string;
  appointmentDate: string;
  // Photo
  clientPhoto: File | null;
}

export const INITIAL_FORM_DATA: ConsultationFormData = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  serviceType: "full_preview",
  faceShape: "",
  hairTexture: "",
  desiredLength: "",
  maintenanceLevel: "",
  lifestyle: "",
  inspirationNotes: "",
  estimatedPrice: "",
  estimatedDuration: "",
  appointmentDate: "",
  clientPhoto: null,
};

export interface StepProps {
  data: ConsultationFormData;
  onChange: <K extends keyof ConsultationFormData>(key: K, value: ConsultationFormData[K]) => void;
}
