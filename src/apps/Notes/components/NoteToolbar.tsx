import { GfIcon } from '../../../framework/iconSystem'

interface NoteToolbarProps {
  showFolderSidebar: boolean
  folderCount: number
  onToggleFolderSidebar: () => void
}

export function NoteToolbar({ showFolderSidebar, folderCount, onToggleFolderSidebar }: NoteToolbarProps) {
  return (
    <div className="gf-notes__toolbar">
      <div className="gf-notes__toolbar-right">
        <button
          className={`gf-notes__btn ${showFolderSidebar ? 'gf-notes__btn--active' : ''}`}
          onClick={onToggleFolderSidebar}
          aria-label="Toggle folders"
          title="Folders"
        >
          <GfIcon name="folder" size={14} />
          {folderCount > 0 && <span className="gf-notes__folder-count">{folderCount}</span>}
        </button>
      </div>
    </div>
  )
}
