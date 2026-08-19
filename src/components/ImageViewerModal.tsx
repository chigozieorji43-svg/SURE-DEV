import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Image as ImageIcon 
} from 'lucide-react';

interface ImageViewerModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title
}) => {
  const validImages = React.useMemo(() => {
    return images.filter(img => typeof img === 'string' && img.trim().length > 0);
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync index when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      const idx = Math.max(0, Math.min(initialIndex, validImages.length - 1));
      setCurrentIndex(idx);
      setZoomLevel(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, validImages.length]);

  // Reset transform when changing image
  const handleSelectImage = useCallback((index: number) => {
    setCurrentIndex(index);
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (validImages.length <= 1) return;
    const prevIdx = (currentIndex - 1 + validImages.length) % validImages.length;
    handleSelectImage(prevIdx);
  }, [currentIndex, validImages.length, handleSelectImage]);

  const handleNext = useCallback(() => {
    if (validImages.length <= 1) return;
    const nextIdx = (currentIndex + 1) % validImages.length;
    handleSelectImage(nextIdx);
  }, [currentIndex, validImages.length, handleSelectImage]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const nextZoom = Math.max(prev - 0.5, 1);
      if (nextZoom === 1) setPosition({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleToggleZoom = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      handleResetZoom();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mouse drag when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    const currentUrl = validImages[currentIndex];
    if (!currentUrl) return;

    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `project-image-${currentIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentUrl, '_blank');
    }
  };

  if (!isOpen || validImages.length === 0) return null;

  const currentImage = validImages[currentIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-md select-none">
        {/* Top Navigation / Controls Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 text-white shrink-0 z-10">
          {/* Left Title & Counter */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-white/10 text-brand-green shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate text-white max-w-xs md:max-w-md">
                {title || 'Project Screenshot Preview'}
              </h3>
              {validImages.length > 1 && (
                <p className="text-xs text-gray-400 font-mono">
                  Image {currentIndex + 1} of {validImages.length}
                </p>
              )}
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2">
            {/* Close */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-2.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Stage Viewport */}
        <div 
          className="relative flex-1 flex items-center justify-center overflow-hidden p-4 cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Previous Arrow */}
          {validImages.length > 1 && (
            <button
              onClick={handlePrev}
              title="Previous Image (Left Arrow)"
              className="absolute left-4 z-20 p-3 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-105"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Current Image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center pointer-events-auto">
            <motion.img
              key={currentImage}
              src={currentImage}
              alt={`Project Preview ${currentIndex + 1}`}
              onDoubleClick={handleToggleZoom}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Next Arrow */}
          {validImages.length > 1 && (
            <button
              onClick={handleNext}
              title="Next Image (Right Arrow)"
              className="absolute right-4 z-20 p-3 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-105"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip (if multiple images) */}
        {validImages.length > 1 && (
          <div className="px-6 py-3 border-t border-white/10 bg-black/60 flex items-center justify-center gap-3 overflow-x-auto shrink-0 z-10">
            {validImages.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectImage(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  idx === currentIndex 
                    ? 'border-brand-green ring-2 ring-brand-green/50 scale-105 opacity-100' 
                    : 'border-transparent opacity-50 hover:opacity-90'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
