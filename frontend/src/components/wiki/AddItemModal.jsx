import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const TYPES = ['pdf', 'text', 'url', 'youtube'];
const TYPE_ICONS = { pdf: '📄', text: '📝', url: '🔗', youtube: '▶' };

function extractYoutubeId(url) {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', 'raw');

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        // Normalize URL to raw path in case the preset overrides resource_type
        const url = data.secure_url.replace('/image/upload/', '/raw/upload/');
        resolve({ url, cloudinaryId: data.public_id });
      } else {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
    xhr.send(formData);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsText(file, 'UTF-8');
  });
}

function nameWithoutExt(name) {
  return name.replace(/\.[^.]+$/, '');
}

export default function AddItemModal({ boatId, item, onSave, onClose, t }) {
  const isEdit = Boolean(item);
  const fileRef = useRef();

  const [type, setType] = useState(item?.type || 'pdf');
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [url, setUrl] = useState(item?.url || '');
  const [textMode, setTextMode] = useState('upload');
  const [typedText, setTypedText] = useState('');
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState(item?.file_name || '');
  const [fileSize, setFileSize] = useState(item?.file_size || 0);
  const [youtubeId, setYoutubeId] = useState(item?.youtube_id || null);
  const [youtubePreview, setYoutubePreview] = useState(Boolean(item?.youtube_id));
  // PDF Cloudinary upload state
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null);
  const [cloudinaryId, setCloudinaryId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (type !== 'youtube') return;
    const id = url ? extractYoutubeId(url) : null;
    setYoutubeId(id);
    setYoutubePreview(Boolean(id));
  }, [url, type]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');

    if (file.size > MAX_FILE_BYTES) {
      setError(t('wiki.form.fileTooLarge'));
      return;
    }

    if (type === 'pdf') {
      if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
        setError(t('wiki.form.unsupportedType'));
        return;
      }
      setPdfFile({ name: file.name, size: file.size });
      setFileName(file.name);
      setFileSize(file.size);
      if (!title) setTitle(nameWithoutExt(file.name));

      setUploading(true);
      setUploadProgress(0);
      setCloudinaryUrl(null);
      setCloudinaryId(null);

      try {
        const { url: cUrl, cloudinaryId: cId } = await uploadToCloudinary(file, setUploadProgress);
        setCloudinaryUrl(cUrl);
        setCloudinaryId(cId);
      } catch {
        setError(t('wiki.form.uploadFailed'));
        setPdfFile(null);
      } finally {
        setUploading(false);
      }
    } else if (type === 'text') {
      const allowed = ['.txt', '.md', 'text/plain', 'text/markdown', 'text/x-markdown'];
      const ok = allowed.some(a => file.name.toLowerCase().endsWith(a.replace('.*', '')) || file.type === a);
      if (!ok && !file.name.match(/\.(txt|md)$/i)) {
        setError(t('wiki.form.unsupportedType'));
        return;
      }
      const data = await readFileAsText(file);
      setFileData(data);
      setFileName(file.name);
      setFileSize(file.size);
      if (!title) setTitle(nameWithoutExt(file.name));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError(t('wiki.form.title') + ' required'); return; }

    if (type === 'youtube' && !youtubeId) {
      setError(t('wiki.form.invalidYoutube'));
      return;
    }
    if (type === 'url' && !url.trim()) {
      setError(t('wiki.form.url') + ' required');
      return;
    }
    if (!isEdit) {
      if (type === 'pdf') {
        if (uploading) { setError(t('wiki.form.uploadWait')); return; }
        if (!cloudinaryUrl) { setError(t('wiki.form.fileHint')); return; }
      }
      if (type === 'text' && textMode === 'upload' && !fileData) { setError(t('wiki.form.textHint')); return; }
      if (type === 'text' && textMode === 'type' && !typedText.trim()) {
        setError(t('wiki.form.textHint')); return;
      }
    }

    setSaving(true);
    try {
      const actualFileData = type === 'text' && textMode === 'type' ? typedText : fileData;
      const actualFileName = type === 'text' && textMode === 'type' ? (title.trim() + '.txt') : fileName;
      const actualFileSize = type === 'text' && textMode === 'type'
        ? new Blob([typedText]).size
        : fileSize;

      let res;
      if (isEdit) {
        res = await api.put(`/boats/${boatId}/wiki/items/${item.id}`, {
          title: title.trim(),
          description: description.trim() || null,
          url: url.trim() || null,
        });
      } else {
        res = await api.post(`/boats/${boatId}/wiki/items`, {
          type,
          title: title.trim(),
          description: description.trim() || null,
          url: type === 'pdf' ? cloudinaryUrl : (type === 'url' || type === 'youtube') ? url.trim() : null,
          cloudinary_id: type === 'pdf' ? cloudinaryId : null,
          file_data: type === 'text' ? actualFileData : null,
          file_name: (type === 'pdf' || type === 'text') ? actualFileName : null,
          file_size: (type === 'pdf' || type === 'text') ? actualFileSize : null,
          youtube_id: type === 'youtube' ? youtubeId : null,
        });
      }
      onSave(res.data, isEdit);
    } catch (err) {
      setError(err.response?.data?.error || t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-semibold text-slate-800">
            {isEdit ? t('wiki.form.editTitle') : t('wiki.form.addTitle')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Type selector — only for new items */}
          {!isEdit && (
            <div className="grid grid-cols-4 gap-1.5">
              {TYPES.map(tp => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => {
                    setType(tp);
                    setError('');
                    setFileData(null);
                    setFileName('');
                    setFileSize(0);
                    setPdfFile(null);
                    setCloudinaryUrl(null);
                    setCloudinaryId(null);
                  }}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors ${
                    type === tp
                      ? 'bg-ocean-600 text-white border-ocean-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-ocean-300 hover:bg-ocean-50'
                  }`}
                >
                  <span className="text-lg">{TYPE_ICONS[tp]}</span>
                  <span>{t(`wiki.types.${tp}`)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('wiki.form.title')} *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('wiki.form.titlePlaceholder')}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('wiki.form.description')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('wiki.form.descriptionPlaceholder')}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
            />
          </div>

          {/* PDF upload */}
          {type === 'pdf' && !isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('wiki.form.file')}</label>
              <div
                onClick={() => !uploading && !cloudinaryUrl && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl px-4 py-5 text-center transition-colors ${
                  cloudinaryUrl
                    ? 'border-ocean-400 bg-ocean-50 cursor-default'
                    : uploading
                    ? 'border-ocean-300 bg-ocean-50 cursor-wait'
                    : 'border-slate-200 hover:border-ocean-300 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {cloudinaryUrl ? (
                  <div>
                    <p className="text-sm font-medium text-ocean-700">✓ {pdfFile?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{((pdfFile?.size || 0) / 1024).toFixed(0)} KB — uploaded</p>
                  </div>
                ) : uploading ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">📤 {pdfFile?.name}</p>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-ocean-500 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{uploadProgress}%</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl mb-1">📄</p>
                    <p className="text-sm text-slate-500">{t('wiki.form.fileHint')}</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Text upload/type */}
          {type === 'text' && !isEdit && (
            <div>
              <div className="flex gap-1 mb-2">
                {['upload', 'type'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTextMode(mode)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      textMode === mode ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'upload' ? t('wiki.form.uploadFile') : t('wiki.form.typeText')}
                  </button>
                ))}
              </div>
              {textMode === 'upload' ? (
                <div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors ${
                      fileData ? 'border-ocean-400 bg-ocean-50' : 'border-slate-200 hover:border-ocean-300 hover:bg-slate-50'
                    }`}
                  >
                    {fileData ? (
                      <div>
                        <p className="text-sm font-medium text-ocean-700">📝 {fileName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{(fileSize / 1024).toFixed(0)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl mb-1">📝</p>
                        <p className="text-sm text-slate-500">{t('wiki.form.textHint')}</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <textarea
                  value={typedText}
                  onChange={e => setTypedText(e.target.value)}
                  rows={8}
                  placeholder={type === 'text' ? '# Notes\n\nType your text or markdown here…' : ''}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-y"
                />
              )}
            </div>
          )}

          {type === 'url' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('wiki.form.url')} *</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={t('wiki.form.urlPlaceholder')}
                required={!isEdit}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
          )}

          {type === 'youtube' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('wiki.form.youtubeUrl')} *</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={t('wiki.form.youtubePlaceholder')}
                required={!isEdit}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
              {youtubePreview && youtubeId && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                    alt="YouTube thumbnail"
                    className="w-full aspect-video object-cover"
                  />
                  <p className="text-xs text-green-600 bg-green-50 px-3 py-1.5 font-medium">
                    ✓ Video ID: {youtubeId}
                  </p>
                </div>
              )}
              {url && !youtubeId && (
                <p className="text-xs text-amber-600 mt-1">⚠ {t('wiki.form.invalidYoutube')}</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 pb-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-ocean-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-ocean-700 disabled:opacity-60 transition-colors"
            >
              {saving ? t('wiki.form.saving') : uploading ? t('wiki.form.uploading') : t('wiki.form.save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t('boat.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
