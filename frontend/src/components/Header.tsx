import React from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';

interface HeaderProps {
  activeDoc: DocumentCorpus;
  currentView: 'portal' | 'workstation';
  onNavigate: (view: 'portal' | 'workstation') => void;
  onNewDocumentClick: () => void;
  onToggleMobileSidebar: () => void;
  onToggleRightPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDoc,
  currentView,
  onNavigate,
  onNewDocumentClick,
  onToggleMobileSidebar,
  onToggleRightPanel
}) => {
  return (
    <header className="fixed top-0 left-0 md:left-[240px] right-0 md:right-[280px] h-14 bg-canvas-base/95 backdrop-blur-md border-b border-surface-border z-40 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden w-8 h-8 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-ink-secondary"
          aria-label="Open navigation sidebar"
        >
          <span className="material-symbols-outlined text-[18px]">menu</span>
        </button>

        {/* Current Document Name */}
        <div
          onClick={() => (activeDoc.id ? onNavigate('workstation') : onNewDocumentClick())}
          className="flex items-center gap-1.5 text-ink-primary font-medium text-[12px] sm:text-[13px] cursor-pointer hover:text-primary transition-colors min-w-0"
          title={activeDoc.id ? 'Click to view analytical workstation' : 'Click to upload PDF'}
        >
          <span className="material-symbols-outlined text-primary text-[17px] sm:text-[18px] flex-shrink-0">
            {activeDoc.id ? 'description' : 'cloud_upload'}
          </span>
          <span className="font-semibold tracking-tight truncate max-w-[120px] sm:max-w-[240px]">
            {activeDoc.id ? activeDoc.filename : 'Upload a PDF Document'}
          </span>
        </div>

        {activeDoc.id && <div className="hidden sm:block h-3.5 w-px bg-surface-border"></div>}

        {/* Metadata Badges */}
        {activeDoc.id && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-surface-border text-ink-secondary whitespace-nowrap">
              {activeDoc.totalPages} Pages
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{' '}
              {activeDoc.chunksVectorized} Indexed Chunks
            </span>
          </div>
        )}
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* View Switcher Pill */}
        <div className="flex items-center bg-surface-subtle border border-surface-border rounded-lg p-0.5 text-[10px] sm:text-[11px] font-mono">
          <button
            onClick={() => onNavigate('portal')}
            className={`px-1.5 sm:px-2 py-1 rounded-md transition-all cursor-pointer ${
              currentView === 'portal'
                ? 'bg-canvas-base text-primary font-semibold shadow-2xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Portal
          </button>
          <button
            onClick={() => onNavigate('workstation')}
            className={`px-1.5 sm:px-2 py-1 rounded-md transition-all cursor-pointer ${
              currentView === 'workstation'
                ? 'bg-canvas-base text-primary font-semibold shadow-2xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Workstation
          </button>
        </div>

        <button
          onClick={onNewDocumentClick}
          className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg bg-surface-subtle hover:bg-surface-container-high border border-surface-border text-ink-primary font-medium text-[11px] sm:text-[12px] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-ink-secondary">add</span>
          <span className="hidden sm:inline">New Document</span>
        </button>

        {/* Intelligence drawer toggle on tablet/mobile */}
        <button
          onClick={onToggleRightPanel}
          className="md:hidden w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-primary cursor-pointer"
          title="Toggle Intelligence panel"
          aria-label="Toggle Intelligence panel"
        >
          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">insights</span>
        </button>

        <div
          className="hidden sm:flex w-8 h-8 rounded-full bg-surface-subtle border border-surface-border items-center justify-center text-ink-secondary hover:text-ink-primary cursor-pointer transition-colors"
          title="Account profile"
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};
