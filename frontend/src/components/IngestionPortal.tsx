import React, { useState } from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';
import { FlipFadeText } from './ui/flip-fade-text.tsx';
import { CornerButton } from './ui/corner-button.tsx';
import { UploadCloud, ArrowRight } from 'lucide-react';

interface IngestionPortalProps {
  onLoadDocument: (doc: DocumentCorpus) => void;
  onOpenWorkstation: () => void;
  onInspectBboxDemo: () => void;
  onFileUpload: (file: File) => void;
  onDirectQuery: (query: string) => void;
  uploadedDocuments?: DocumentCorpus[];
  isProcessing?: boolean;
}

export const IngestionPortal: React.FC<IngestionPortalProps> = ({
  onLoadDocument,
  onFileUpload,
  isProcessing = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isProcessing) {
      setIsUploading(false);
    }
  }, [isProcessing]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setIsUploading(true);
      onFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      onFileUpload(files[0]);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center select-none">
      <div className="relative z-10 max-w-[760px] w-full flex flex-col items-center gap-6">
        
        {/* Animated 3D FlipFadeText Title */}
        <div className="w-full">
          <FlipFadeText
            words={[
              "PAGEWISE",
              "CHAT WITH PDF",
              "ZERO HALLUCINATION",
              "PRECISE CITATIONS"
            ]}
            className="min-h-[90px] sm:min-h-[120px]"
            textClassName="text-4xl sm:text-6xl md:text-7xl text-white font-extrabold tracking-tight drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]"
          />
        </div>

        {/* Clean, Elegant Tagline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-[560px] leading-relaxed drop-shadow-md -mt-2">
          Upload any PDF report, research paper, or contract to chat with verified page-level citations.
        </p>

        {/* Centerpiece: CornerButton for Upload */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <CornerButton
            onClick={handleTriggerUpload}
            accentColor="#38bdf8"
            className="text-slate-950 font-bold px-8 py-3.5 text-base shadow-xl"
            icon={<ArrowRight className="corner-btn-svg" />}
          >
            {isUploading ? 'Uploading & Parsing...' : 'Upload PDF Document'}
          </CornerButton>
        </div>

        {/* Drag & Drop Canvas Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerUpload}
          className={`w-full max-w-[580px] mt-6 rounded-2xl border-2 border-dashed p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-md ${
            isDragging
              ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_35px_rgba(56,189,248,0.25)]'
              : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="text-sm font-semibold text-slate-200">
            Drag and drop your PDF here, or click to browse
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Accepts PDF documents up to 100 MB · 3,000+ Pages
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

      </div>
    </main>
  );
};
