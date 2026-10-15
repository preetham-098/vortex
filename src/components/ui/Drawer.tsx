'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 300) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop Scrim */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Draggable Drawer Surface */}
          <motion.div
            className={`relative w-full ${width} h-full glass-elevated bg-[var(--bg-surface)] flex flex-col shadow-2xl z-10 border-l border-[var(--border-subtle)] focus:outline-none`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ right: 0.25, left: 0.05 }}
            onDragEnd={handleDragEnd}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 280,
              mass: 0.9,
            }}
          >
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1 bg-[var(--border-strong)] rounded-full self-center mt-3 mb-1 opacity-50 cursor-grab active:cursor-grabbing" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
