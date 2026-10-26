import React from 'react';
import { DocumentCorpus } from '../utils/ragEngine.ts';
import {
  LayoutDashboard,
  MessageSquare,
  CheckCircle2,
  FolderTree,
  Upload,
  X,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentView: 'portal' | 'workstation';
  onNavigate: (view: 'portal' | 'workstation') => void;
  activeDoc: DocumentCorpus;
  onUploadClick: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeDoc,
  onUploadClick,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-[260px] bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800 z-50 flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-5">
          {/* Brand Header & Close button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => {
                onNavigate('portal');
                onClose();
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-mono text-[13px] font-bold group-hover:bg-sky-500 group-hover:text-slate-950 transition-all">
                PW
              </div>
              <div>
                <div className="text-[14px] font-bold text-white tracking-tight">PageWise</div>
                <div className="text-[10px] font-mono text-slate-400 tracked-caps">Document AI</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Menu"
              aria-label="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action: Upload */}
          <button
            onClick={() => {
              onUploadClick();
              onClose();
            }}
            className="w-full h-9 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-[13px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            <button
              onClick={() => {
                onNavigate('portal');
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-[13px] transition-colors text-left cursor-pointer ${
                currentView === 'portal'
                  ? 'bg-slate-900 text-white border border-slate-800 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${currentView === 'portal' ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>Upload Portal</span>
            </button>

            {activeDoc.id && (
              <button
                onClick={() => {
                  onNavigate('workstation');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors text-left cursor-pointer ${
                  currentView === 'workstation'
                    ? 'bg-slate-900 text-white border border-slate-800 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <MessageSquare className={`w-4 h-4 ${currentView === 'workstation' ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>Active Workspace</span>
              </button>
            )}
          </nav>

          {/* Active Document Card if loaded */}
          {activeDoc.id && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Active Document
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="text-xs text-white font-medium truncate" title={activeDoc.filename}>
                  {activeDoc.filename}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>{activeDoc.totalPages} Pages</span>
                <span>•</span>
                <span className="text-emerald-400">{activeDoc.chunksVectorized} Chunks</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 tracked-caps">
            PageWise Document Intelligence
          </span>
        </div>
      </aside>
    </>
  );
};
