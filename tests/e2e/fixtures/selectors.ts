export const SELECTORS = {
  login: {
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '.error-message, .alert-error, [data-testid="error-message"]',
  },
  
  sidebar: {
    container: '.sidebar, [data-testid="sidebar"]',
    noteList: '.note-list, [data-testid="note-list"]',
    folderTree: '.folder-tree, [data-testid="folder-tree"]',
    newButton: 'button:has-text("New"), [data-testid="new-btn"]',
    newNoteOption: 'text=New Note, [data-testid="new-note"]',
    newFolderOption: 'text=New Folder, [data-testid="new-folder"]',
  },
  
  editor: {
    container: '.editor, [data-testid="editor"]',
    textarea: 'textarea#note-editor, .editor textarea, [data-testid="note-editor"]',
    preview: '.preview, [data-testid="preview"]',
    savedIndicator: '.saved, [data-testid="saved-indicator"]',
  },
  
  toolbar: {
    container: '.toolbar, [data-testid="toolbar"]',
    saveButton: 'button:has-text("Save"), [data-testid="save-btn"]',
    deleteButton: 'button:has-text("Delete"), [data-testid="delete-btn"]',
    shareButton: 'button:has-text("Share"), [data-testid="share-btn"]',
    exportButton: 'button:has-text("Export"), [data-testid="export-btn"]',
  },
  
  search: {
    input: 'input[placeholder*="search"], input[type="search"], [data-testid="search-input"]',
    results: '.search-results, [data-testid="search-results"]',
    resultItem: '.search-result-item, [data-testid="search-result-item"]',
  },
  
  tags: {
    container: '.tags, [data-testid="tags"]',
    tagItem: '.tag, [data-testid="tag-item"]',
    tagFilter: '.tag-filter, [data-testid="tag-filter"]',
  },
  
  modal: {
    container: '.modal, [data-testid="modal"]',
    confirmButton: 'button:has-text("Confirm"), button:has-text("OK")',
    cancelButton: 'button:has-text("Cancel"), button:has-text("Close")',
  },
  
  settings: {
    container: '.settings, [data-testid="settings"]',
    themeSelect: 'select[name="theme"], [data-testid="theme-select"]',
    languageSelect: 'select[name="language"], [data-testid="language-select"]',
  },
  
  graph: {
    container: '.graph-container, [data-testid="graph-container"]',
    canvas: 'canvas, [data-testid="graph-canvas"]',
    node: '.graph-node, [data-testid="graph-node"]',
  },
  
  media: {
    container: '.media-manager, [data-testid="media-manager"]',
    uploadArea: '.upload-area, [data-testid="upload-area"]',
    mediaItem: '.media-item, [data-testid="media-item"]',
  },
  
  share: {
    container: '.share-panel, [data-testid="share-panel"]',
    linkInput: 'input[readonly], [data-testid="share-link"]',
    qrCode: '.qr-code, [data-testid="qr-code"]',
  },
  
  mobile: {
    bottomNav: '.bottom-nav, [data-testid="bottom-nav"]',
    menuToggle: '.menu-toggle, [data-testid="menu-toggle"]',
  },
};
