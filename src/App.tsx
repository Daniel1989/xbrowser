import React, { useEffect } from "react";
import { useTabManager } from "./hooks/useTabManager";
import { NavigationBar } from "./components/NavigationBar";
import { TabList } from "./components/TabList";
import "./App.css";

function App(): JSX.Element {
  const {
    tabs,
    activeTabId,
    statusMessage,
    createTab,
    closeTab,
    closeAllTabs,
    focusTab,
    setStatusMessage,
  } = useTabManager();

  const [isCreatingTab, setIsCreatingTab] = React.useState<boolean>(false);

  const handleOpenTab = async (url: string): Promise<void> => {
    setIsCreatingTab(true);
    try {
      const tabId = await createTab(url);
      if (tabId) {
        setStatusMessage(`Tab opened successfully: ${url}`);
      } else {
        setStatusMessage(`Failed to open tab: ${url}`);
      }
    } catch (error) {
      console.error("Error opening tab:", error);
      setStatusMessage(`Error opening tab: ${error}`);
    } finally {
      setIsCreatingTab(false);
    }
  };

  const handleFocusTab = async (tabId: string): Promise<void> => {
    try {
      await focusTab(tabId);
    } catch (error) {
      console.error("Error focusing tab:", error);
      setStatusMessage(`Error focusing tab: ${error}`);
    }
  };

  const handleCloseTab = async (tabId: string): Promise<void> => {
    try {
      await closeTab(tabId);
    } catch (error) {
      console.error("Error closing tab:", error);
      setStatusMessage(`Error closing tab: ${error}`);
    }
  };

  const handleCloseAllTabs = async (): Promise<void> => {
    try {
      await closeAllTabs();
    } catch (error) {
      console.error("Error closing all tabs:", error);
      setStatusMessage(`Error closing tabs: ${error}`);
    }
  };

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "t":
            event.preventDefault();
            // Focus on URL input for new tab
            const urlInput = document.querySelector(
              ".url-input"
            ) as HTMLInputElement;
            if (urlInput) {
              urlInput.focus();
            }
            break;
          case "w":
            event.preventDefault();
            if (activeTabId) {
              handleCloseTab(activeTabId);
            }
            break;
          case "q":
            event.preventDefault();
            handleCloseAllTabs();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>🚀 xbrowser</h1>
          <span className="app-subtitle">Multi-Tab Browser</span>
        </div>

        <NavigationBar
          onOpenTab={handleOpenTab}
          isLoading={isCreatingTab}
          statusMessage={statusMessage}
          onCloseAllTabs={handleCloseAllTabs}
          tabCount={tabs.length}
        />
      </header>

      <main className="app-main">
        <TabList
          tabs={tabs}
          activeTabId={activeTabId}
          onFocusTab={handleFocusTab}
          onCloseTab={handleCloseTab}
        />
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="shortcuts-info">
            <h4>Keyboard Shortcuts:</h4>
            <div className="shortcuts-grid">
              <div className="shortcut">
                <kbd>Ctrl/Cmd + T</kbd>
                <span>Focus URL input</span>
              </div>
              <div className="shortcut">
                <kbd>Ctrl/Cmd + W</kbd>
                <span>Close active tab</span>
              </div>
              <div className="shortcut">
                <kbd>Ctrl/Cmd + Q</kbd>
                <span>Close all tabs</span>
              </div>
            </div>
          </div>

          <div className="app-info">
            <p>Built with Tauri + React + TypeScript</p>
            <p>Each tab runs in an independent WebviewWindow</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
