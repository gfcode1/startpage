import { GfIcon } from '../../../framework/iconSystem'

interface FolderSidebarProps {
  folders: string[]
  activeCount: number
  getFolderCount: (folder: string) => number
  selectedFolder: string
  onSelectFolder: (folder: string) => void
  onNewFolder: () => void
  onClose: () => void
}

export function FolderSidebar({ folders, activeCount, getFolderCount, selectedFolder, onSelectFolder, onNewFolder, onClose }: FolderSidebarProps) {
  return (
    <>
      <div className="gf-notes__sidebar-backdrop" onClick={onClose} role="presentation" />
      <aside className="gf-notes__sidebar">
        <button
          className={`gf-notes__sidebar-item ${!selectedFolder ? 'gf-notes__sidebar-item--active' : ''}`}
          onClick={() => onSelectFolder('')}
        >
          <GfIcon name="document" size={14} />
          All Notes
          <span className="gf-notes__sidebar-count">{activeCount}</span>
        </button>
        {folders.map(folder => {
          const count = getFolderCount(folder)
          return (
            <button
              key={folder}
              className={`gf-notes__sidebar-item ${selectedFolder === folder ? 'gf-notes__sidebar-item--active' : ''}`}
              onClick={() => onSelectFolder(folder)}
            >
              <GfIcon name="folder" size={14} />
              {folder}
              <span className="gf-notes__sidebar-count">{count}</span>
            </button>
          )
        })}
        <button
          className="gf-notes__sidebar-item gf-notes__sidebar-item--new"
          onClick={onNewFolder}
        >
          <GfIcon name="plus" size={12} />
          New Folder
        </button>
      </aside>
    </>
  )
}
