import React from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';
import {
  FileText,
  Upload,
  SlidersHorizontal,
  Menu,
  LayoutGrid,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeDoc: DocumentCorpus;
  currentView: 'portal' | 'workstation';
  onNavigate: (view: 'portal' | 'workstation') => void;
  onNewDocumentClick: () => void;
  onToggleSidebar: () => void;
  onToggleRightPanel: () => void;
  isRightPanelOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeDoc,
  currentView,
  onNavigate,
  onNewDocumentClick,
  onToggleSidebar,
  onToggleRightPanel,
  isRightPanelOpen = false
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 z-40 flex items-center justify-between px-4 sm:px-6 shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0">
        {/* Sidebar Toggle Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors shadow-2xs"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Brand Logo & Active Doc */}
        <div
          onClick={() => (activeDoc.id ? onNavigate('workstation') : onNavigate('portal'))}
          className="flex items-center gap-2.5 cursor-pointer text-slate-100 hover:text-sky-400 transition-colors min-w-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 group-hover:bg-sky-500 group-hover:text-slate-950 transition-all">
            PW
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm tracking-tight text-white">PageWise</span>
            {activeDoc.id && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-xs text-slate-300 truncate max-w-[150px] sm:max-w-[280px]">
                  {activeDoc.filename}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Ready
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Header Navigation & Tools */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* View Switcher Pill */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
          <button
            onClick={() => onNavigate('portal')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'portal'
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          {activeDoc.id && (
            <button
              onClick={() => onNavigate('workstation')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'workstation'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
          )}
        </div>

        {/* Upload New Document Button */}
        <button
          onClick={onNewDocumentClick}
          className="h-8 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">New PDF</span>
        </button>

        {/* Intelligence Drawer Toggle */}
        {activeDoc.id && (
          <button
            onClick={onToggleRightPanel}
            className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-mono transition-all cursor-pointer ${
              isRightPanelOpen
                ? 'bg-sky-600 border-sky-500 text-white font-semibold'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Toggle Document Telemetry"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Telemetry</span>
          </button>
        )}
      </div>
    </header>
  );
};
