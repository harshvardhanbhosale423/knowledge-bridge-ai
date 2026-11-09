import React, { useState } from 'react';
import { FileText, X, Search, Copy, Check } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentDetails: {
    id: number;
    project_id: number;
    original_name: string;
    file_type: string;
    file_size: number;
    page_count: number;
    char_count: number;
    extracted_text: string;
    upload_timestamp: string;
  } | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !documentDetails) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(documentDetails.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-4xl w-full max-h-[85vh] p-6 rounded-2xl border border-navy-700 shadow-card flex flex-col space-y-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-navy-750">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>{documentDetails.original_name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-navy-800 text-blue-300 border border-navy-700">
                  {documentDetails.file_type}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {documentDetails.page_count} pages • {documentDetails.char_count.toLocaleString()} characters extracted
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1.5 bg-navy-800 hover:bg-navy-700 text-slate-300 rounded-lg text-xs flex items-center space-x-1 border border-navy-700 transition-colors"
              title="Copy text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search inside document */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within extracted document text..."
            className="w-full pl-9 pr-3 py-1.5 bg-navy-950 border border-navy-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Text container */}
        <div className="flex-1 overflow-y-auto bg-navy-950 p-4 rounded-xl border border-navy-750 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
          {documentDetails.extracted_text}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-navy-750 flex items-center justify-between text-[11px] text-slate-400">
          <span>Evidence integrity: Tokenized with exact page bounds.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

