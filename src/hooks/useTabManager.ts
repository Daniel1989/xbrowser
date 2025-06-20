import { useState, useCallback, useEffect } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Tab, TabState, WindowMessage, TabWindowConfig } from '../types/tab';

export const useTabManager = () => {
  const [tabState, setTabState] = useState<TabState>({
    tabs: [],
    activeTabId: null,
  });

  const [statusMessage, setStatusMessage] = useState<string>('Ready');

  // Generate unique tab ID
  const generateTabId = (): string => {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create a new tab with WebviewWindow
  const createTab = useCallback(async (url: string): Promise<string | null> => {
    try {
      setStatusMessage(`Creating new tab for ${url}...`);
      
      const tabId = generateTabId();
      const windowLabel = `webview_${tabId}`;
      
      // Validate URL
      const isValidUrl = await invoke<boolean>('validate_url', { url });
      if (!isValidUrl) {
        setStatusMessage('Invalid URL provided');
        return null;
      }

      // Create WebviewWindow configuration
      const windowConfig: TabWindowConfig = {
        url,
        width: 1200,
        height: 800,
        resizable: true,
        decorations: true,
        alwaysOnTop: false,
      };

      // Create the WebviewWindow
      const webview = new WebviewWindow(windowLabel, {
        url,
        width: windowConfig.width,
        height: windowConfig.height,
        resizable: windowConfig.resizable,
        decorations: windowConfig.decorations,
        alwaysOnTop: windowConfig.alwaysOnTop,
        title: `Loading ${url}...`,
        center: true,
      });

      // Create tab object
      const newTab: Tab = {
        id: tabId,
        url,
        title: url,
        isLoading: true,
        windowLabel,
        createdAt: Date.now(),
      };

      // Add tab to state
      setTabState(prev => ({
        tabs: [...prev.tabs, newTab],
        activeTabId: tabId,
      }));

      // Set up window event listeners
      await webview.once('tauri://created', () => {
        setStatusMessage(`Tab created successfully: ${url}`);
        setTabState(prev => ({
          ...prev,
          tabs: prev.tabs.map(tab =>
            tab.id === tabId ? { ...tab, isLoading: false } : tab
          ),
        }));
      });

      await webview.once('tauri://error', (e) => {
        console.error('Window creation error:', e);
        setStatusMessage(`Failed to create tab: ${e}`);
        closeTab(tabId);
      });

      // Listen for window close event
      await webview.onCloseRequested(() => {
        closeTab(tabId);
      });

      setStatusMessage(`Tab opened: ${url}`);
      return tabId;
    } catch (error) {
      console.error('Error creating tab:', error);
      setStatusMessage(`Error creating tab: ${error}`);
      return null;
    }
  }, []);

  // Close a specific tab
  const closeTab = useCallback(async (tabId: string): Promise<void> => {
    try {
      const tab = tabState.tabs.find(t => t.id === tabId);
      if (!tab) return;

      // Try to close the WebviewWindow
      try {
        const webview = await WebviewWindow.getByLabel(tab.windowLabel);
        if (webview) {
          await webview.close();
        }
      } catch (error) {
        console.warn('Window might already be closed:', error);
      }

      // Remove tab from state
      setTabState(prev => {
        const newTabs = prev.tabs.filter(t => t.id !== tabId);
        const newActiveTabId = prev.activeTabId === tabId
          ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
          : prev.activeTabId;
        
        return {
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      });

      setStatusMessage(`Tab closed: ${tab.url}`);
    } catch (error) {
      console.error('Error closing tab:', error);
      setStatusMessage(`Error closing tab: ${error}`);
    }
  }, [tabState.tabs]);

  // Close all tabs
  const closeAllTabs = useCallback(async (): Promise<void> => {
    try {
      setStatusMessage('Closing all tabs...');
      
      // Close all WebviewWindows
      for (const tab of tabState.tabs) {
        try {
          const webview = await WebviewWindow.getByLabel(tab.windowLabel);
          if (webview) {
            await webview.close();
          }
        } catch (error) {
          console.warn('Error closing window:', error);
        }
      }

      // Clear all tabs from state
      setTabState({
        tabs: [],
        activeTabId: null,
      });

      setStatusMessage('All tabs closed');
    } catch (error) {
      console.error('Error closing all tabs:', error);
      setStatusMessage(`Error closing tabs: ${error}`);
    }
  }, [tabState.tabs]);

  // Focus on a specific tab window
  const focusTab = useCallback(async (tabId: string): Promise<void> => {
    try {
      const tab = tabState.tabs.find(t => t.id === tabId);
      if (!tab) return;

      const webview = await WebviewWindow.getByLabel(tab.windowLabel);
      if (webview) {
        await webview.setFocus();
        await webview.show();
        setTabState(prev => ({
          ...prev,
          activeTabId: tabId,
        }));
        setStatusMessage(`Focused on tab: ${tab.url}`);
      }
    } catch (error) {
      console.error('Error focusing tab:', error);
      setStatusMessage(`Error focusing tab: ${error}`);
    }
  }, [tabState.tabs]);

  // Update tab title (called from inter-window communication)
  const updateTabTitle = useCallback((tabId: string, title: string): void => {
    setTabState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === tabId ? { ...tab, title } : tab
      ),
    }));
  }, []);

  // Update tab URL (called from inter-window communication)
  const updateTabUrl = useCallback((tabId: string, url: string): void => {
    setTabState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === tabId ? { ...tab, url } : tab
      ),
    }));
  }, []);

  // Set up inter-window communication listeners
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // Listen for messages from tab windows
        const unlistenTabLoaded = await listen<WindowMessage>('tab-loaded', (event) => {
          const { tabId, title } = event.payload.payload;
          if (title) {
            updateTabTitle(tabId, title);
          }
          setTabState(prev => ({
            ...prev,
            tabs: prev.tabs.map(tab =>
              tab.id === tabId ? { ...tab, isLoading: false } : tab
            ),
          }));
        });

        const unlistenTitleChanged = await listen<WindowMessage>('tab-title-changed', (event) => {
          const { tabId, title } = event.payload.payload;
          if (title) {
            updateTabTitle(tabId, title);
          }
        });

        const unlistenUrlChanged = await listen<WindowMessage>('tab-url-changed', (event) => {
          const { tabId, url } = event.payload.payload;
          if (url) {
            updateTabUrl(tabId, url);
          }
        });

        const unlistenTabClosed = await listen<WindowMessage>('tab-closed', (event) => {
          const { tabId } = event.payload.payload;
          closeTab(tabId);
        });

        // Return cleanup function
        return () => {
          unlistenTabLoaded();
          unlistenTitleChanged();
          unlistenUrlChanged();
          unlistenTabClosed();
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
      }
    };

    setupListeners();
  }, [updateTabTitle, updateTabUrl, closeTab]);

  return {
    tabs: tabState.tabs,
    activeTabId: tabState.activeTabId,
    statusMessage,
    createTab,
    closeTab,
    closeAllTabs,
    focusTab,
    setStatusMessage,
  };
}; 