// Tab management types
export interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  windowLabel: string;
  createdAt: number;
}

export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

// Window message types for inter-window communication
export interface WindowMessage {
  type: 'TAB_LOADED' | 'TAB_TITLE_CHANGED' | 'TAB_URL_CHANGED' | 'TAB_CLOSED';
  payload: {
    tabId: string;
    url?: string;
    title?: string;
    windowLabel?: string;
  };
}

// Tab window configuration
export interface TabWindowConfig {
  url: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  resizable: boolean;
  decorations: boolean;
  alwaysOnTop: boolean;
} 