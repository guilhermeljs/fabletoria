import { useEffect, useRef, useState } from 'react'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseInput } from '../primitives/BaseInput'

interface Props {
  currentFolder: string
  onFileSelect: (files: File[]) => void
  onUrlSubmit: (url: string, name: string) => void
  onFolderCreate: (name: string) => void
}

const ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md'

export default function AssetUploadBar({ onFileSelect, onUrlSubmit, onFolderCreate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)
  const [showUrl, setShowUrl] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [urlName, setUrlName] = useState('')
  const [showFolder, setShowFolder] = useState(false)
  const [folderName, setFolderName] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onFileSelect(files)
    e.target.value = ''
  }

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)

  const handleUrlConfirm = () => {
    if (!urlValue.trim() || !urlName.trim()) return
    onUrlSubmit(urlValue.trim(), urlName.trim())
    setUrlName('')
    setUrlValue('')
    setShowUrl(false)
  }

  const handleFolderConfirm = () => {
    const trimmed = folderName.trim()
    if (!trimmed) return
    onFolderCreate(trimmed)
    setFolderName('')
    setShowFolder(false)
  }

  useEffect(() => {
    if (!isAddMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAddMenuOpen])

  const handleShowUrl = () => {
    setShowUrl(true)
    setShowFolder(false)
    setIsAddMenuOpen(false)
  }

  const handleShowFolder = () => {
    setShowFolder(true)
    setShowUrl(false)
    setIsAddMenuOpen(false)
  }

  return (
    <div className="flex flex-col gap-tk-3 flex-1">
      <div className="flex items-center gap-tk-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="relative" ref={addMenuRef}>
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => setIsAddMenuOpen((v) => !v)}
            title="More options"
            className="p-tk-2"
            active={isAddMenuOpen}
          >
            New
            <BaseIcon name="Plus" size={16} className='ml-tk-1' />
          </BaseButton>

          {isAddMenuOpen && (
            <div className="absolute bottom-full left-0 w-48 bg-bg-main border border-border-main shadow-lg z-1">
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={handleShowUrl}
                leftIcon={<BaseIcon name="Link" size={16} />}
                className="w-full justify-start py-tk-2"
              >
                Add from URL
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<BaseIcon name="UploadCloud" size={16} />}
                className="w-full justify-start py-tk-2"
              >
                Upload File
              </BaseButton>
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={handleShowFolder}
                leftIcon={<BaseIcon name="FolderPlus" size={16} />}
                className="w-full justify-start py-tk-2"
              >
                New Folder
              </BaseButton>
            </div>
          )}
        </div>
      </div>

      {/* URL input */}
      {showUrl && (
        <div className="flex items-end gap-tk-2 p-tk-3 bg-bg-main rounded-tk-lg border border-border-main">
          <BaseInput label="Asset URL" value={urlValue} onChange={(e) => setUrlValue(e.target.value)} placeholder="https://example.com/image.png" fullWidth />
          <BaseInput label="Asset Name" value={urlName} onChange={(e) => setUrlName(e.target.value)} placeholder="e.g. hero-image.png" fullWidth />
          <BaseButton onClick={handleUrlConfirm} disabled={!urlValue.trim() || !urlName.trim()} size="md">
            Confirm
          </BaseButton>
        </div>
      )}

      {/* New folder input */}
      {showFolder && (
        <div className="flex items-end gap-tk-2 p-tk-3 bg-bg-main rounded-tk-lg border border-border-main">
          <BaseInput label="Folder Name" value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleFolderConfirm() }} placeholder="New folder name" autoFocus fullWidth />
          <BaseButton onClick={handleFolderConfirm} disabled={!folderName.trim()} size="md">
            Create
          </BaseButton>
        </div>
      )}
    </div>
  )
}
