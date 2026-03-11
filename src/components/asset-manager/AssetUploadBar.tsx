import { useRef, useState } from 'react'

interface Props {
  currentFolder: string
  onFileSelect: (files: File[]) => void
  onUrlSubmit: (url: string, name: string) => void
  onFolderCreate: (name: string) => void
}

const ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md'

export default function AssetUploadBar({ onFileSelect, onUrlSubmit, onFolderCreate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUrl, setShowUrl] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [urlName, setUrlName] = useState('')
  const [urlPreviewOk, setUrlPreviewOk] = useState<boolean | null>(null)
  const [showFolder, setShowFolder] = useState(false)
  const [folderName, setFolderName] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onFileSelect(files)
    e.target.value = ''
  }

  const handleUrlConfirm = () => {
    if (!urlValue.trim() || !urlName.trim()) return
    onUrlSubmit(urlValue.trim(), urlName.trim())
    setUrlValue('')
    setUrlName('')
    setUrlPreviewOk(null)
    setShowUrl(false)
  }

  const handleFolderConfirm = () => {
    const trimmed = folderName.trim()
    if (!trimmed) return
    onFolderCreate(trimmed)
    setFolderName('')
    setShowFolder(false)
  }

  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs font-medium bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
        >
          Upload File
        </button>
        <button
          onClick={() => { setShowUrl((v) => !v); setShowFolder(false) }}
          className="px-3 py-1.5 text-xs font-medium bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
        >
          + URL
        </button>
        <button
          onClick={() => { setShowFolder((v) => !v); setShowUrl(false) }}
          className="px-3 py-1.5 text-xs font-medium bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
        >
          + New Folder
        </button>
      </div>

      {/* URL input */}
      {showUrl && (
        <div className="flex flex-col gap-2 bg-zinc-800 border border-zinc-700 rounded-lg p-3">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => { setUrlValue(e.target.value); setUrlPreviewOk(null) }}
            placeholder="https://example.com/image.png"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500 w-full"
          />
          {urlValue && (
            <img
              src={urlValue}
              alt="URL preview"
              className={`max-h-20 object-contain rounded ${urlPreviewOk === false ? 'hidden' : ''}`}
              onLoad={() => setUrlPreviewOk(true)}
              onError={() => setUrlPreviewOk(false)}
            />
          )}
          {urlPreviewOk === false && (
            <p className="text-xs text-red-400">Could not load image from this URL.</p>
          )}
          <input
            type="text"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            placeholder="Asset name (e.g. hero-image.png)"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500 w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUrlConfirm}
              disabled={!urlValue.trim() || !urlName.trim()}
              className="px-3 py-1 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-40 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => { setShowUrl(false); setUrlValue(''); setUrlName(''); setUrlPreviewOk(null) }}
              className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New folder input */}
      {showFolder && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFolderConfirm() }}
            placeholder="Folder name"
            autoFocus
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleFolderConfirm}
            disabled={!folderName.trim()}
            className="px-3 py-1 text-xs font-medium bg-zinc-600 text-white rounded-lg hover:bg-zinc-500 disabled:opacity-40 transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => { setShowFolder(false); setFolderName('') }}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
