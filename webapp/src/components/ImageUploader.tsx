import React, { useState, useRef } from 'react';
import { Camera, X, UploadCloud } from 'lucide-react';
import { uploadImages } from '../api/client';

interface Props {
  onUploadSuccess: (urls: string[]) => void;
}

export default function ImageUploader({ onUploadSuccess }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 5) {
        setError('Chỉ được upload tối đa 5 ảnh');
        return;
      }
      
      const newFiles = [...files, ...selectedFiles];
      setFiles(newFiles);
      
      const newPreviews = selectedFiles.map(f => URL.createObjectURL(f));
      setPreviews([...previews, ...newPreviews]);
      setError('');
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError('');
    
    try {
      const urls = await uploadImages(files);
      onUploadSuccess(urls);
    } catch (err: any) {
      setError(err.message || 'Lỗi upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= 5 || isUploading}
        >
          <Camera size={20} /> Chọn ảnh ({files.length}/5)
        </button>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {previews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {previews.map((preview, index) => (
            <div key={index} style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
              <img 
                src={preview} 
                alt="preview" 
                style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', padding: '4px' }}
                disabled={isUploading}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button 
          type="button" 
          className="btn btn-primary w-full flex justify-center" 
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? <span className="spinner"></span> : <><UploadCloud size={20} /> Xác nhận Upload Ảnh</>}
        </button>
      )}
    </div>
  );
}
