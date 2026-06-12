import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Story {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  bgGradient?: string;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    }, 5000); // 5 seconds per story
    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <button onClick={onClose} className="absolute top-6 right-6 text-white z-50">
        <X size={32} />
      </button>

      <div className="relative w-full max-w-sm h-full max-h-[800px] bg-gray-900 overflow-hidden">
        {/* Progress Bars */}
        <div className="absolute top-4 left-2 right-2 flex gap-1 z-30">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: idx === currentIndex ? '100%' : idx < currentIndex ? '100%' : 0 }}
                transition={{ duration: idx === currentIndex ? 5 : 0 }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stories[currentIndex].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {stories[currentIndex].imageUrl ? (
              <img src={stories[currentIndex].imageUrl} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${stories[currentIndex].bgGradient || 'from-gray-800 to-black'}`} />
            )}
            
            <div className="absolute bottom-16 left-6 right-6 text-white">
              <h2 className="text-3xl font-black mb-2">{stories[currentIndex].title}</h2>
              {stories[currentIndex].description && (
                <p className="text-lg text-gray-200">{stories[currentIndex].description}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        className="absolute left-4 text-white"
      >
        <ChevronLeft size={40} />
      </button>
      <button
        onClick={() => setCurrentIndex(Math.min(stories.length - 1, currentIndex + 1))}
        className="absolute right-4 text-white"
      >
        <ChevronRight size={40} />
      </button>
    </div>
  );
};
