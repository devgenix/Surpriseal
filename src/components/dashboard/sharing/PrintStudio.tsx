"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Download, 
  Palette, 
  QrCode, 
  ImageIcon, 
  Type, 
  Layout, 
  Check, 
  Loader2, 
  Printer,
  ChevronRight,
  Info
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

interface PrintStudioProps {
  isOpen: boolean;
  onClose: () => void;
  moment: any;
}

const TEMPLATES = [
  {
    id: "classic",
    name: "Surpriseal Classic",
    description: "The signature brand look",
    bgColor: "#ffffff",
    textColor: "#1b110e",
    accentColor: "#e64c19",
    fontFamily: "font-sans",
    borderStyle: "border-2 border-[#f3eae7]"
  },
  {
    id: "midnight",
    name: "Midnight Luxury",
    description: "Deep, mysterious and elegant",
    bgColor: "#0a0a0a",
    textColor: "#ffffff",
    accentColor: "#3b82f6",
    fontFamily: "font-sans",
    borderStyle: "border border-white/10"
  },
  {
    id: "parchment",
    name: "Ancient Tale",
    description: "Classic paper feel for stories",
    bgColor: "#f4efe1",
    textColor: "#4a3b2a",
    accentColor: "#8b4513",
    fontFamily: "serif",
    borderStyle: "border-2 border-[#dcd1b3]"
  },
  {
    id: "aurora",
    name: "Aurora Dreams",
    description: "Soft gradients and modern feel",
    bgColor: "#ffffff",
    textColor: "#1b110e",
    accentColor: "#ec4899",
    fontFamily: "font-sans",
    borderStyle: "border border-pink-100",
    specialClass: "bg-gradient-to-br from-white via-pink-50/30 to-blue-50/30"
  }
];

const QR_STYLES = [
  { id: "squares", name: "Classic", level: "H" },
  { id: "dots", name: "Modern", level: "H" },
];

export function PrintStudio({ isOpen, onClose, moment }: PrintStudioProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"template" | "qr" | "branding">("template");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [qrStyle, setQrStyle] = useState(QR_STYLES[0]);
  const [qrColor, setQrColor] = useState(TEMPLATES[0].accentColor);
  const [includeImage, setIncludeImage] = useState(true);
  const [centerImage, setCenterImage] = useState<string | null>("/favicon.svg");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customText, setCustomText] = useState(`Scan to reveal a special surprise for ${moment.recipientName || "you"}.`);
  const [processedCenterImage, setProcessedCenterImage] = useState<string | null>(null);

  const momentUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/view/${moment.urlSlug || moment.id}`;

  // Pre-process image to Base64 to avoid CORS issues when capturing
  useEffect(() => {
    async function processImage() {
      if (!centerImage) {
        setProcessedCenterImage(null);
        return;
      }

      // If it's already a local path, we can use it, but still better to ensure it's loaded
      try {
        const response = await fetch(centerImage, { mode: 'no-cors' });
        // Note: fetch with no-cors doesn't allow reading body, 
        // but for public assets we usually want to try standard fetch first
        const blobResponse = await fetch(centerImage);
        const blob = await blobResponse.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setProcessedCenterImage(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.warn("Could not pre-process image for QR code, using direct URL", e);
        setProcessedCenterImage(centerImage);
      }
    }
    processImage();
  }, [centerImage]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      // Small delay to ensure everything is rendered
      await new Promise(r => setTimeout(r, 600));
      
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1, 
        pixelRatio: 2, // Reduced slightly for better compatibility
        backgroundColor: selectedTemplate.bgColor,
        cacheBust: true,
        fontEmbedCSS: '', // Bypass SecurityError by forgoing font embedding if scanning fails
        skipFonts: false, // Try to include fonts, but we've added a fallback in layout.tsx
        style: {
          borderRadius: '0' // Ensure corners are sharp if capturing
        }
      });
      const link = document.createElement('a');
      link.download = `Surpriseal-Moment-${moment.recipientName || 'Gift'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-300 p-0 sm:p-4">
      <div className="bg-[#fcf9f8] dark:bg-[#0f0a09] w-full max-w-6xl h-full sm:h-[90vh] sm:rounded-lg overflow-hidden flex flex-col shadow-2xl border border-white/10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-surface-dark">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-[#1b110e] dark:text-white leading-none">Print Studio</h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Create physical memories from digital moments</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Preview Area - Independently scrollable on mobile */}
          <div className="order-1 md:order-2 flex-1 h-1/2 md:h-full bg-[#f0ebe8] dark:bg-black p-4 sm:p-8 flex flex-col items-center justify-start sm:justify-center relative overflow-y-auto md:overflow-hidden border-b md:border-b-0 border-black/5 dark:border-white/5">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] size-96 rounded-full bg-primary/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] size-96 rounded-full bg-blue-500/20 blur-[100px]" />
            </div>

            <div className="w-full max-w-sm space-y-4 relative z-10 scale-[0.8] sm:scale-100 flex flex-col items-center">
               <div className="flex items-center justify-between mb-2 w-full">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Live Preview</p>
               </div>
               
               {/* THE CARD */}
               <div 
                 ref={cardRef} 
                 className={cn(
                   "aspect-[3/4] w-full rounded-lg p-6 sm:p-8 flex flex-col items-center justify-between text-center relative shadow-2xl overflow-hidden transition-all duration-500",
                   selectedTemplate.specialClass,
                   selectedTemplate.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                 )}
                 style={{ 
                    backgroundColor: selectedTemplate.bgColor,
                    color: selectedTemplate.textColor,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                 }}
               >
                  {/* Decorative Elements based on template */}
                  {selectedTemplate.id === 'parchment' && (
                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" 
                        style={{ 
                          backgroundImage: 'radial-gradient(#dcd1b3 0.5px, transparent 0.5px), radial-gradient(#dcd1b3 0.5px, #f4efe1 0.5px)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: '0 0, 10px 10px'
                        }} 
                     />
                  )}
                  {selectedTemplate.id === 'classic' && (
                     <div className="absolute top-0 right-0 p-4 opacity-5">
                       <img src="/favicon.svg" alt="" className="size-32" />
                     </div>
                  )}

                  <div className="space-y-4">
                     <div className="flex flex-col items-center gap-2">
                        <img src="/favicon.svg" alt="Logo" className="size-6 dark:invert opacity-20" />
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Surpriseal Moment</span>
                     </div>
                     <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none mt-4">
                       Something Special<br/>Waiting For You
                     </h3>
                  </div>

                  <div className="relative p-2 bg-white rounded-lg shadow-xl ring-4 ring-black/[0.02]">
                    <QRCodeSVG
                      value={momentUrl}
                      size={140}
                      level={"H"}
                      includeMargin={false}
                      fgColor={qrColor}
                      imageSettings={processedCenterImage ? {
                        src: processedCenterImage,
                        x: undefined,
                        y: undefined,
                        height: 32,
                        width: 32,
                        excavate: true,
                      } : undefined}
                      className="sm:w-[180px] sm:h-[180px]"
                    />
                  </div>

                  <div className="space-y-4 w-full">
                    <p className="text-[10px] sm:text-xs font-semibold leading-relaxed max-w-[200px] mx-auto opacity-70 italic line-clamp-2">
                      {customText}
                    </p>
                    
                    <div className="pt-4 border-t border-current/10 w-full hidden sm:block">
                       <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">Backup Link</p>
                       <p className="text-[9px] font-black tracking-tight">{momentUrl.replace(/^https?:\/\//, '')}</p>
                    </div>
                  </div>
               </div>

               <div className="flex items-center justify-center gap-6 pt-4 hidden sm:flex">
                  <div className="flex flex-col items-center gap-1">
                     <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">3.5" x 5"</span>
                     <span className="text-[8px] font-bold text-text-muted uppercase">Size</span>
                  </div>
                  <div className="w-px h-8 bg-black/5 dark:bg-white/10" />
                  <div className="flex flex-col items-center gap-1">
                     <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">High Res</span>
                     <span className="text-[8px] font-bold text-text-muted uppercase">300 DPI</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar Controls - Independently scrollable bottom section on mobile */}
          <div className="order-2 md:order-1 h-1/2 md:h-full w-full md:w-80 border-r-0 md:border-r border-black/5 dark:border-white/5 flex flex-col bg-white dark:bg-surface-dark overflow-hidden">
            
            {/* Tabs - Fixed at the top of the controls pane */}
            <div className="flex border-b border-black/5 dark:border-white/5 bg-white dark:bg-surface-dark z-20 sticky top-0">
              {[
                { id: "template", icon: Layout, label: "Theme" },
                { id: "qr", icon: QrCode, label: "QR Code" },
                { id: "branding", icon: Type, label: "Details" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-4 flex flex-col items-center gap-1 transition-all relative",
                    activeTab === tab.id ? "text-primary" : "text-text-muted"
                  )}
                >
                  <tab.icon size={18} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Scrollable Settings Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Template Tab */}
              {activeTab === "template" && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Select Template</label>
                    <div className="grid grid-cols-1 gap-3">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTemplate(t);
                            setQrColor(t.accentColor);
                          }}
                          className={cn(
                            "group p-4 rounded-lg border-2 text-left transition-all",
                            selectedTemplate.id === t.id ? "border-primary bg-primary/5" : "border-black/5 dark:border-white/5 hover:border-primary/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black uppercase tracking-tight dark:text-white">{t.name}</span>
                            {selectedTemplate.id === t.id && <Check size={14} className="text-primary" />}
                          </div>
                          <p className="text-[10px] text-text-muted leading-tight">{t.description}</p>
                          <div className="mt-3 flex gap-1.5">
                            <div className="size-3 rounded-full shadow-inner" style={{ backgroundColor: t.bgColor }} />
                            <div className="size-3 rounded-full shadow-inner" style={{ backgroundColor: t.accentColor }} />
                            <div className="size-3 rounded-full shadow-inner" style={{ backgroundColor: t.textColor }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Tab */}
              {activeTab === "qr" && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">QR Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {["#e64c19", "#3b82f6", "#10b981", "#8b5cf6", "#1b110e", "#000000"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setQrColor(c)}
                          className={cn(
                            "aspect-square rounded-lg border-2 transition-all shadow-sm",
                            qrColor === c ? "border-primary scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Center Branding</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCenterImage("/favicon.svg")}
                        className={cn(
                          "p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all",
                          centerImage === "/favicon.svg" ? "border-primary bg-primary/5" : "border-black/5 dark:border-white/5"
                        )}
                      >
                         <img src="/favicon.svg" className="size-6 dark:invert" alt="Logo" />
                         <span className="text-[9px] font-black uppercase tracking-widest dark:text-white">Brand Logo</span>
                      </button>
                      
                      {moment.imageUrl && (
                        <button
                          onClick={() => setCenterImage(moment.imageUrl)}
                          className={cn(
                            "p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all",
                            centerImage === moment.imageUrl ? "border-primary bg-primary/5" : "border-black/5 dark:border-white/5"
                          )}
                        >
                           <img src={moment.imageUrl} className="size-6 object-cover rounded-md" alt="Moment" />
                           <span className="text-[9px] font-black uppercase tracking-widest dark:text-white">Moment Pic</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => setCenterImage(null)}
                        className={cn(
                          "p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all",
                          centerImage === null ? "border-primary bg-primary/5" : "border-black/5 dark:border-white/5"
                        )}
                      >
                         <X size={16} className="text-text-muted" />
                         <span className="text-[9px] font-black uppercase tracking-widest dark:text-white">No Icon</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Branding Tab */}
              {activeTab === "branding" && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Custom Card Message</label>
                    <textarea 
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Write a small sub-header..."
                      className="w-full h-24 p-4 rounded-lg bg-[#f9f5f3] dark:bg-black/20 border border-black/5 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none dark:text-white"
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                     <div className="flex gap-3">
                        <Info size={16} className="text-amber-500 shrink-0" />
                        <p className="text-[9px] font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                          The recipient's URL is automatically added as text at the bottom. This ensures they can still access the moment even without a camera.
                        </p>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-black/5 dark:border-white/5 bg-white dark:bg-surface-dark flex items-center justify-between">
           <div className="hidden sm:block">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Standard PNG Format</p>
              <p className="text-[9px] font-medium text-text-muted mt-0.5">Perfect for home printing or professional card services</p>
           </div>
           
           <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-4 rounded-lg border border-black/5 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[#1b110e] dark:text-white"
              >
                Close
              </button>
              <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 sm:flex-none px-8 py-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                    Download Card
                  </>
                )}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
