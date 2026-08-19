import React, { useState, useRef } from 'react';
import { ContractFile } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  FolderGit2, Upload, File, FileCode, Image, FileText, Download, 
  Trash2, MessageSquare, Search, HardDrive, Eye, Plus, Send, X, ShieldAlert
} from 'lucide-react';

interface FileManagerProps {
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  files: ContractFile[];
  isReadOnly?: boolean;
}

export const FileManager: React.FC<FileManagerProps> = ({
  projectId,
  projectTitle,
  userId,
  userName,
  userRole,
  files,
  isReadOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [activeFileComments, setActiveFileComments] = useState<ContractFile | null>(null);
  const [commentText, setCommentText] = useState('');
  const [previewFile, setPreviewFile] = useState<ContractFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    (Array.from(uploaded) as File[]).forEach(async (file: File) => {
      // 50MB Size limit enforcement
      if (file.size > 50 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 50MB maximum upload limit.`);
        return;
      }

      const fakeBlobUrl = URL.createObjectURL(file);
      await dbService.addContractFile({
        projectId,
        name: file.name,
        url: fakeBlobUrl,
        fileType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        uploadedBy: userId,
        uploadedByName: userName,
        uploadedByRole: userRole,
        version: 1,
      });
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (confirm('Are you sure you want to remove this document asset from the project vault?')) {
      await dbService.deleteContractFile(fileId, projectId);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFileComments || !commentText.trim()) return;

    await dbService.addContractFileComment(
      activeFileComments.id,
      projectId,
      userName,
      commentText
    );
    setCommentText('');
    setActiveFileComments(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalBytesUsed = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const maxDriveBytes = 500 * 1024 * 1024; // 500 MB quota
  const usagePercentage = Math.min(100, Math.round((totalBytesUsed / maxDriveBytes) * 100));

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFileType === 'all') return matchesSearch;
    if (selectedFileType === 'images') return matchesSearch && f.fileType.includes('image');
    if (selectedFileType === 'code') return matchesSearch && (f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.json') || f.name.endsWith('.html') || f.name.endsWith('.zip'));
    if (selectedFileType === 'docs') return matchesSearch && (f.fileType.includes('pdf') || f.fileType.includes('word') || f.name.endsWith('.md') || f.name.endsWith('.docx'));
    return matchesSearch;
  });

  const getFileIcon = (fileType: string, name: string) => {
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-indigo-500" />;
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.json') || name.endsWith('.zip')) {
      return <FileCode className="w-5 h-5 text-emerald-500" />;
    }
    if (fileType.includes('pdf') || name.endsWith('.docx')) return <FileText className="w-5 h-5 text-rose-500" />;
    return <File className="w-5 h-5 text-brand-teal" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-6 shadow-sm">
      {/* Header & Storage Meter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-brand-border/60 dark:border-slate-800 pb-6">
        <div>
          <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-teal" /> Secure Project File Vault & Asset Repository
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Centralized document hub for source code packages, wireframes, design specs, and contract assets.
          </p>
        </div>

        {/* Drive Storage Capacity Bar */}
        <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-brand-border/60 dark:border-slate-700/60 max-w-xs w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-brand-midnight dark:text-slate-200">
            <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-brand-teal" /> Vault Storage</span>
            <span>{formatFileSize(totalBytesUsed)} / 500 MB</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-brand-teal transition-all duration-500"
              style={{ width: `${Math.max(5, usagePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets by name or extension..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs text-brand-midnight dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-brand-midnight dark:text-slate-200 outline-none"
          >
            <option value="all">All File Types</option>
            <option value="images">Images & Media</option>
            <option value="code">Source Code / Zips</option>
            <option value="docs">PDFs & Docs</option>
          </select>
        </div>

        {/* Upload Button */}
        {!isReadOnly && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadFiles}
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4" /> Upload Vault Asset
            </button>
          </div>
        )}
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-brand-border/80 dark:border-slate-800 p-8 space-y-3">
          <FolderGit2 className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-brand-midnight dark:text-slate-200">No Vault Files Found</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            Upload contract specifications, UI mocks, wireframes, or code archives to store them permanently in the project workspace vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file, idx) => (
            <div
              key={file.id ? `${file.id}-${idx}` : idx}
              className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-brand-border/60 dark:border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-brand-teal transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-xs">
                    {getFileIcon(file.fileType, file.name)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 cursor-pointer"
                      title="Preview Asset"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={file.url}
                      download={file.name}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {!isReadOnly && file.uploadedBy === userId && (
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-brand-midnight dark:text-white truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="text-[10px] text-gray-400 dark:text-slate-400 flex items-center justify-between mt-1">
                    <span>Size: {formatFileSize(file.sizeBytes)}</span>
                    <span className="font-mono bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                      v{file.version || 1}.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploader Meta & Comments Trigger */}
              <div className="pt-3 border-t border-brand-border/40 dark:border-slate-700/40 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                <span>By {file.uploadedByName}</span>
                <button
                  onClick={() => setActiveFileComments(file)}
                  className="font-bold text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Comments ({file.comments?.length || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
              <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-brand-teal" /> Preview: {previewFile.name}
              </h3>
              <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-700 font-bold cursor-pointer">✕</button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center">
              {previewFile.fileType.includes('image') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-h-[350px] object-contain rounded-xl" />
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                  <div className="text-xs text-gray-600 dark:text-slate-300 font-bold">Document Asset Stored Securely</div>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-teal text-brand-midnight font-bold text-xs"
                  >
                    <Download className="w-4 h-4" /> Download File ({formatFileSize(previewFile.sizeBytes)})
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Comments Modal */}
      {activeFileComments && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2 truncate">
                <MessageSquare className="w-4 h-4 text-brand-teal" /> File Notes: {activeFileComments.name}
              </h3>
              <button onClick={() => setActiveFileComments(null)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {(activeFileComments.comments || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">No notes added to this file yet.</div>
              ) : (
                activeFileComments.comments?.map((c, cIdx) => (
                  <div key={c.id ? `${c.id}-${cIdx}` : cIdx} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-brand-midnight dark:text-slate-200">
                      <span>{c.author}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {!isReadOnly && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a feedback note..."
                  className="flex-1 p-2.5 rounded-xl border border-brand-border dark:border-slate-700 text-xs outline-none bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white"
                />
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-brand-teal text-brand-midnight font-bold text-xs cursor-pointer">
                  Add
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
