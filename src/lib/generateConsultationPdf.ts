import jsPDF from "jspdf";

interface PdfData {
  clientName: string;
  hairTexture: string;
  desiredLength: string;
  faceShape: string;
  maintenanceLevel: string;
  lifestyle: string;
  estimatedPrice: string;
  recommendation: string | null;
  generatedAt: string | null;
  originalImageUrl: string | null;
  previewImageUrl: string | null;
}

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const loadImageAsDataUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });

const addImageToPdf = (
  doc: jsPDF,
  dataUrl: string,
  y: number,
  label: string,
  imgWidth: number,
  imgHeight: number,
): number => {
  const maxW = CONTENT_WIDTH;
  const ratio = Math.min(maxW / imgWidth, 1);
  const w = imgWidth * ratio;
  const h = imgHeight * ratio;

  // Check page break
  if (y + h + 12 > 280) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(label.toUpperCase(), MARGIN, y);
  y += 5;

  doc.addImage(dataUrl, "JPEG", MARGIN, y, w, h);
  y += h + 10;
  return y;
};

const SECTION_HEADERS = [
  "STRUCTURE RECOMMENDATION:",
  "STYLING DIRECTION:",
  "MAINTENANCE PLAN:",
  "OPTIONAL UPGRADE:",
  "PROFESSIONAL JUSTIFICATION:",
];

export const generateConsultationPdf = async (data: PdfData) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text("AXIS HAIR\u2122", MARGIN, y);
  y += 4;
  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 10;

  // Client name
  doc.setFontSize(18);
  doc.setTextColor(30);
  doc.text(data.clientName, MARGIN, y);
  y += 12;

  // Details
  const details: [string, string][] = [
    ["Hair Texture", data.hairTexture],
    ["Desired Length", data.desiredLength],
    ["Face Shape", data.faceShape],
    ["Maintenance Level", data.maintenanceLevel],
    ["Lifestyle", data.lifestyle],
    ["Estimated Cost", data.estimatedPrice],
  ];

  doc.setFontSize(8);
  for (const [label, value] of details) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(label.toUpperCase(), MARGIN, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.text(value, MARGIN + 50, y);
    y += 6;
  }

  y += 4;
  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 10;

  // Images
  const imageUrls: { url: string; label: string }[] = [];
  if (data.originalImageUrl) imageUrls.push({ url: data.originalImageUrl, label: "Original" });
  if (data.previewImageUrl) imageUrls.push({ url: data.previewImageUrl, label: "Preview" });

  for (const { url, label } of imageUrls) {
    try {
      const dataUrl = await loadImageAsDataUrl(url);
      // Get dimensions from loaded image
      const img = new Image();
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.src = dataUrl;
      });
      y = addImageToPdf(doc, dataUrl, y, label, img.naturalWidth / 4, img.naturalHeight / 4);
    } catch {
      // Skip image silently
    }
  }

  // Recommendation
  if (data.recommendation) {
    if (y > 240) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setDrawColor(200);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30);
    doc.text("PROFESSIONAL RECOMMENDATION", MARGIN, y);
    y += 8;

    const pattern = new RegExp(
      `(${SECTION_HEADERS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "g",
    );
    const parts = data.recommendation.split(pattern).filter(Boolean);

    for (const part of parts) {
      const isHeader = SECTION_HEADERS.some(
        (h) => part.trim().toUpperCase() === h || part.trim() === h,
      );

      if (isHeader) {
        if (y > 270) { doc.addPage(); y = MARGIN; }
        y += 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(80);
        doc.text(part.replace(/:$/, "").toUpperCase(), MARGIN, y);
        y += 5;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(50);
        const lines = doc.splitTextToSize(part.trim(), CONTENT_WIDTH);
        for (const line of lines) {
          if (y > 280) { doc.addPage(); y = MARGIN; }
          doc.text(line, MARGIN, y);
          y += 4.5;
        }
      }
    }

    if (data.generatedAt) {
      y += 6;
      if (y > 280) { doc.addPage(); y = MARGIN; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(160);
      const dateStr = new Date(data.generatedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      doc.text(`Generated ${dateStr}`, MARGIN, y);
    }
  }

  // Save
  const safeName = data.clientName.replace(/[^a-zA-Z0-9]/g, "-");
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`AXIS-Consultation-${safeName}-${dateStr}.pdf`);
};
