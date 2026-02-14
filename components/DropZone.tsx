
import React, { useCallback, useState } from 'react';

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  isProcessing?: boolean;
  children: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileAccepted, isProcessing = false, children }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Accept images and PDFs
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        onFileAccepted(file);
      } else {
        alert("PROTOCOL MISMATCH: Only Visual Data (Images) or Document Feeds (PDF) accepted.");
      }
    }
  }, [onFileAccepted, isProcessing]);

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full"
    >
      {children}
      
      {/* Drag Overlay */}
      {isDragging && !isProcessing && (
        <div className="absolute inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-[#ffcc00] m-4 rounded-2xl animate-in fade-in duration-200">
           <div className="w-24 h-24 bg-[#ffcc00]/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <span className="text-4xl">📥</span>
           </div>
           <h3 className="text-2xl font-bold text-[#ffcc00] tracking-[0.2em] uppercase">Data Ingestion</h3>
           <p className="text-white/60 font-mono mt-2">Release to upload to Neural Buffer</p>
           
           <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ffcc00] animate-[scan_2s_linear_infinite]"></div>
           </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md flex flex-col items-center justify-center m-4 rounded-2xl animate-in fade-in duration-300">
           <div className="relative w-32 h-32 flex items-center justify-center mb-8">
              <div className="absolute inset-0 border-4 border-[#00d4ff]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-[#00d4ff] rounded-full animate-spin"></div>
              <span className="text-4xl animate-pulse">⚙️</span>
           </div>
           <h3 className="text-2xl font-bold text-[#00d4ff] tracking-[0.2em] uppercase animate-pulse">Analyzing Data</h3>
           <p className="text-white/60 font-mono mt-2 uppercase tracking-widest text-xs">Integrating into Memory Core...</p>
           
           <div className="w-64 h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
              <div className="h-full bg-[#00d4ff] w-1/3 animate-[shimmer_2s_infinite_linear] rounded-full"></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DropZone;
