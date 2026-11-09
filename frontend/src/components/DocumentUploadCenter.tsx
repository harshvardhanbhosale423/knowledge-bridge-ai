import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Sparkles, 
  RefreshCw, 
  FileCode,
  HardDrive
} from 'lucide-react';
import { Document } from '../types';

interface DocumentUploadCenterProps {
  projectId: number;
  documents: Document[];
  onUpload: (file: File, autoAnalyze: boolean) => Promise<void>;
  onDeleteDocument: (docId: number) => Promise<void>;
  onViewDocument: (docId: number) => void;
  onTriggerAnalysis: (docId?: number) => Promise<void>;
  isAnalyzing: boolean;
}

export const DocumentUploadCenter: React.FC<DocumentUploadCenterProps> = ({
  projectId,
  documents,
  onUpload,
  onDeleteDocument,
  onViewDocument,
  onTriggerAnalysis,
  isAnalyzing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndUpload = async (file: File) => {
    setUploadError(null);
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      setUploadError(`Invalid file type (${ext}). Supported formats: PDF, DOCX, TXT.`);
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('File exceeds 4.0 MB limit for Vercel Serverless Functions. Please upload documents under 4 MB.');
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(file, autoAnalyze);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await validateAndUpload(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Drop Zone Card */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
            : 'border-navy-700 hover:border-blue-500/50 bg-navy-900/40 hover:bg-navy-900/60'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf,.docx,.doc,.txt,.md"
          className="hidden" 
          onChange={handleFileSelect}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto shadow-glow-blue">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isUploading ? 'Extracting & Parsing Document...' : 'Drag & Drop Project Documents Here'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports <strong className="text-slate-200">PDF, Word (DOCX)</strong> and <strong className="text-slate-200">Plain Text (TXT)</strong> up to 4 MB (Vercel Serverless Limit)
            </p>
          </div>

          {/* Upload Progress Animation */}
          {isUploading && (
            <div className="w-full bg-navy-800 rounded-full h-2 overflow-hidden mt-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full animate-pulse w-3/4" />
            </div>
          )}

          {/* Auto analyze option */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-300"
          >
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="auto-analyze"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="rounded border-navy-700 bg-navy-800 text-blue-600 focus:ring-0 w-3.5 h-3.5"
              />
              <label htmlFor="auto-analyze" className="cursor-pointer select-none">
                Automatically extract knowledge items upon upload
              </label>
            </div>
            <div className="hidden sm:block text-slate-600">&bull;</div>
            <div className="text-[11px] text-slate-400 flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              <span>Zero-Cost Storage &bull; ₹0.00 Cost</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {uploadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Document Ingestion Table / List */}
      <div className="glass-panel rounded-xl border border-navy-700/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Project Documents Ingested ({documents.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Extracted text is tokenized with page numbers for exact evidence verification.
            </p>
          </div>

          {documents.length > 0 && (
            <button
              onClick={() => onTriggerAnalysis()}
              disabled={isAnalyzing}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Re-Run AI Knowledge Extraction'}</span>
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileCode className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
            <p className="text-xs">No documents uploaded yet for this workspace.</p>
            <p className="text-[11px] text-slate-500">Upload a PDF, Word doc or TXT file above to begin.</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-750">
            {documents.map((doc) => {
              const fileTypeUpper = doc.file_type.toUpperCase();
              const badgeColor = 
                fileTypeUpper === 'PDF' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                fileTypeUpper === 'DOCX' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

              return (
                <div key={doc.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-navy-800/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                      {fileTypeUpper}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {doc.original_name}
                      </h4>
                      <div className="flex items-center space-x-4 text-[11px] text-slate-400 mt-0.5">
                        <span>{roundKb(doc.file_size)} KB</span>
                        <span>{doc.page_count} page(s)</span>
                        <span>{doc.char_count.toLocaleString()} characters</span>
                        <span>Uploaded {new Date(doc.upload_timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => onViewDocument(doc.id)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-750 rounded-lg border border-navy-700 flex items-center space-x-1.5 transition-colors"
                      title="Inspect extracted raw text"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Text</span>
                    </button>
                    <button
                      onClick={() => onTriggerAnalysis(doc.id)}
                      disabled={isAnalyzing}
                      className="px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 flex items-center space-x-1.5 transition-colors"
                      title="Run extraction specifically on this document"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract</span>
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

function roundKb(bytes: number): string {
  return (bytes / 1024).toFixed(1);
}

