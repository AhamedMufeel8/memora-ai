import { useRef, useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { aiService } from '../services/ai.service';
import { motion } from 'framer-motion';
import { SummarySkeleton } from '../components/Skeleton';
import {
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  FileIcon,
  X,
  Copy,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

export const Summarizer = () => {
  const { documents, uploadDocument, addToast } = useStudy();
  const [dragActive, setDragActive] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(documents[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [tempFile, setTempFile] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef('');

  const validatePdf = (file) => {
    if (!file) return false;

    const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = !file.type || file.type === 'application/pdf' || file.type === 'application/x-pdf' || file.type === 'application/octet-stream';

    if (!isPdfExtension || !isPdfMime) {
      addToast('Only PDF files are supported.', 'error');
      return false;
    }

    if (file.size > MAX_PDF_SIZE) {
      addToast('PDF is too large. Maximum file size is 10MB.', 'error');
      return false;
    }

    return true;
  };

  const setSelectedFile = (file) => {
    if (!validatePdf(file)) return;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setErrorMessage('');
    setTempFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcessSubmit = async () => {
    if (!tempFile && !notesText.trim()) {
      addToast('Please provide a file or some text notes.', 'error');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStage(tempFile ? 'uploading' : 'analyzing');
    setErrorMessage('');

    try {
      const formData = new FormData();
      if (tempFile) {
        formData.append('file', tempFile);
      }
      if (notesText.trim()) {
        formData.append('text', notesText);
      }

      const response = await aiService.summarizeNotes(formData, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
          if (progress >= 100) {
            setProcessingStage('extracting');
          }
        },
        onStage: (stage) => {
          if (stage === 'extracting' || stage === 'ocr' || stage === 'generating' || stage === 'saving') {
            setProcessingStage(stage);
          }
        },
      });

      setProcessingStage('saving');
      
      const newDoc = {
        id: response.id || `doc_${Date.now()}`,
        name: tempFile ? tempFile.name : 'Text Snippet',
        size: tempFile ? `${(tempFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Text',
        uploadedAt: new Date().toLocaleDateString(),
        summary: response.summary,
        source: response.source || 'gemini',
      };

      uploadDocument(newDoc);
      setSelectedDoc(newDoc);
      addToast(response.source === 'fallback' ? 'Summary created with fallback mode. You can retry Gemini later.' : 'AI summary generated successfully!', response.source === 'fallback' ? 'warning' : 'success');
      setProcessingStage('done');
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
      setTempFile(null);
      setNotesText('');
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      const message = error?.message || 'Failed to generate summary. Please try again.';
      console.error('[Summarizer] Upload/Processing failed:', error);
      if (error?.response?.data) {
        console.error('[Summarizer] Backend Error Data:', error.response.data);
      }
      setErrorMessage(message);
      addToast(message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearInput = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }

    setTempFile(null);
    setNotesText('');
    setUploadProgress(0);
    setProcessingStage('idle');
    setErrorMessage('');
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopySummary = async () => {
    if (!selectedDoc?.summary) return;
    await navigator.clipboard.writeText(selectedDoc.summary);
    addToast('Summary copied to clipboard.', 'success');
  };

  const handleDownloadSummary = () => {
    if (!selectedDoc?.summary) return;

    const blob = new Blob([`# ${selectedDoc.name}\n\n${selectedDoc.summary}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDoc.name.replace(/\.pdf$/i, '') || 'summary'}-summary.md`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Summary downloaded as Markdown.', 'success');
  };

  const stageCopy = {
    idle: 'Ready to analyze',
    uploading: 'Uploading PDF...',
    extracting: 'Extracting text...',
    ocr: 'Running OCR...',
    generating: 'Generating summary...',
    analyzing: 'Generating summary...',
    saving: 'Saving your summary...',
    done: 'Summary ready',
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          AI Notes Summarizer
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Save time studying. Let AI extract the most important concepts from your documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Upload Column (Left Panel) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm dark:shadow-glass-dark">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Upload Notes or PDF</h3>

            {/* Drag Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragActive
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-950/40'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag and drop PDF textbook</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Files up to 10MB accepted</p>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-500">OR</span>
            </div>

            <div className="mt-4">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Paste your notes here..."
                className="w-full h-32 p-3 text-xs bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:text-white"
              ></textarea>
            </div>

            {/* Selected Temp File Container */}
            {(tempFile || notesText.trim()) && (
              <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{tempFile ? tempFile.name : 'Text Notes Snippet'}</p>
                      {tempFile && <p className="text-[9px] text-slate-400 mt-0.5">{(tempFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={clearInput}
                      disabled={isProcessing}
                      className="p-1.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleProcessSubmit}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold shadow-sm disabled:opacity-60"
                    >
                      {isProcessing ? 'Analyzing...' : 'Generate Summary'}
                    </button>
                  </div>
                </div>

                {previewUrl && (
                  <div className="border-t border-indigo-500/10 bg-white/70 dark:bg-slate-950/30">
                    <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <Eye className="w-3.5 h-3.5" />
                      PDF preview
                    </div>
                    <iframe
                      src={previewUrl}
                      title="PDF preview"
                      className="w-full h-56 bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  onClick={handleProcessSubmit}
                  disabled={isProcessing}
                  className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900 text-rose-500 hover:text-rose-600 disabled:opacity-50"
                  title="Retry"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Uploaded History List */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm dark:shadow-glass-dark">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Recently Uploaded Documents</h3>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">No files processed yet.</p>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${selectedDoc?.id === doc.id
                        ? 'border-indigo-500 bg-indigo-500/5 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-950/25'
                      }`}
                  >
                    <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedDoc?.id === doc.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <div className="overflow-hidden flex-grow">
                      <h4 className="text-xs font-semibold truncate">{doc.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {doc.uploadedAt}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Summary Details Panel (Right Column) */}
        <div className="lg:col-span-2 space-y-6">
          {isProcessing ? (
            <div className="p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm dark:shadow-glass-dark">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Building Study Summary</h3>
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="relative w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center"
                >
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </motion.div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{stageCopy[processingStage]}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Please keep this page open while your document is processed.</p>
                </div>
                <div className="w-full max-w-md">
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${tempFile ? uploadProgress : 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {processingStage === 'uploading' && tempFile
                        ? `${uploadProgress}% uploaded`
                        : stageCopy[processingStage] || 'Processing on server'}
                    </span>
                    <span>
                      {processingStage === 'ocr'
                        ? 'Scanned pages are being read with OCR'
                        : 'Please keep this page open until processing completes'}
                    </span>
                  </div>
                </div>
              </div>
              <SummarySkeleton />
            </div>
          ) : selectedDoc ? (
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm dark:shadow-glass-dark">
              {/* Doc Header Info */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">{selectedDoc.name}</h3>
            
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Copy summary"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadSummary}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Download summary"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              

              {/* Navigation tabs inside Summaries */}
              <div className="flex items-center gap-3 mt-6 border-b border-slate-100 dark:border-slate-850 pb-2">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`text-xs font-semibold pb-2 px-1 relative transition-all ${activeTab === 'summary'
                      ? 'text-indigo-500 border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                  Highlights Summary
                </button>
               
                
              </div>

              {/* Tab Display Panel */}
              <div className="py-6 min-h-[300px]">
                {activeTab === 'summary' && (
                  <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-350">
                    <p className="whitespace-pre-line font-medium leading-relaxed font-sans">{selectedDoc.summary}</p>
                  </div>
                )}

                
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm text-center">
              <FileIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-pulse-slow" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">No Document Selected</h3>
             
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
