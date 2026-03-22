'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Image as ImageIcon, MapPin, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function PostMomentForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [momentLink, setMomentLink] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const previews: FilePreview[] = fileArray.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setFiles(prev => [...prev, ...previews]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setUploading(true);

    try {
      // Create the moment record
      const momentId = crypto.randomUUID();
      const rawData = JSON.stringify({
        object_title: title,
        object_desc: description,
        moment_link: momentLink,
        location: location,
        posted_by: 'Lifescape User',
      });

      const { error: momentError } = await supabase
        .from('dataline_objects')
        .insert({
          datalineobject_id: momentId,
          title: title,
          raw_data: rawData,
          start_date: new Date().toISOString(),
        });

      if (momentError) {
        console.error('Error creating moment:', momentError);
        setUploading(false);
        return;
      }

      // Upload files and create media records
      for (let i = 0; i < files.length; i++) {
        const file = files[i].file;
        const fileName = `moments/${Date.now()}_${i}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('lifescape-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        await supabase.from('media').insert({
          media_id: crypto.randomUUID(),
          datalineobject_id: momentId,
          image_url: fileName,
          media_desc: '',
          created_datetime: new Date().toISOString(),
        });
      }

      router.push(`/moment/${momentId}`);
      router.refresh();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-indigo-500' : 'text-gray-300'}`} />
        <p className="text-sm font-medium text-gray-600">
          Drop files here or <span className="text-indigo-600">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Photos and videos</p>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((f, idx) => (
            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
              {f.type === 'image' ? (
                <img src={f.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={f.preview} className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <div className="flex items-center gap-1 text-white text-xs">
                  <ImageIcon className="w-3 h-3" />
                  <span className="truncate">{f.file.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Give your moment a title"
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          <FileText className="w-4 h-4" /> Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Tell the story behind this moment..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
        />
      </div>

      {/* Location and Link row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="w-4 h-4" /> Location
          </label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Where was this?"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <LinkIcon className="w-4 h-4" /> Link
          </label>
          <input
            type="url"
            value={momentLink}
            onChange={e => setMomentLink(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading || !title.trim()}
          className="px-8 py-3 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Moment'
          )}
        </button>
      </div>
    </form>
  );
}
