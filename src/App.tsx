import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Type definitions
interface Bookmark {
  url: string;
  title: string;
  timestamp: number;
}

interface BrowserState {
  currentUrl: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  bookmarks: Bookmark[];
}

function App(): JSX.Element {
  // Browser state
  const [browserState, setBrowserState] = useState<BrowserState>({
    currentUrl: "https://www.google.com",
    history: ["https://www.google.com"],
    historyIndex: 0,
    isLoading: false,
    bookmarks: JSON.parse(
      localStorage.getItem("bookmarks") || "[]"
    ) as Bookmark[],
  });

  const [statusText, setStatusText] = useState<string>(
    "xbrowser ready - Enter a URL to start browsing"
  );
  const addressBarRef = useRef<HTMLInputElement>(null);

  // Handle address bar key events
  const handleAddressBarKeydown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ): Promise<void> => {
    if (event.key === "Enter") {
      event.preventDefault();
      const url = addressBarRef.current?.value.trim();
      if (url) {
        await navigateToUrl(url);
      }
    }
  };

  // Handle address bar focus
  const handleAddressBarFocus = (): void => {
    addressBarRef.current?.select();
  };

  // Handle address bar blur
  const handleAddressBarBlur = (): void => {
    if (addressBarRef.current) {
      addressBarRef.current.value = browserState.currentUrl;
    }
  };

  // Navigate to URL
  const navigateToUrl = async (input: string): Promise<void> => {
    try {
      let url = input;

      // Process the input to determine if it's a URL or search query
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        if (url.includes(".") && !url.includes(" ")) {
          // Looks like a domain, add https://
          url = "https://" + url;
        } else {
          // Treat as search query
          url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        }
      }

      // Show loading state
      setBrowserState((prev) => ({ ...prev, isLoading: true }));
      setStatusText(`Loading ${url}...`);

      // Call backend to validate URL
      const isValid = await invoke<boolean>("validate_url", { url });

      if (isValid) {
        // Use native webview navigation
        const result = await invoke<string>("navigate_to_url", { url });

        // Update browser state
        setBrowserState((prev) => {
          const newHistory = [...prev.history];
          if (prev.historyIndex < newHistory.length - 1) {
            newHistory.splice(prev.historyIndex + 1);
          }
          newHistory.push(url);

          return {
            ...prev,
            currentUrl: url,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isLoading: false,
          };
        });

        // Update address bar
        if (addressBarRef.current) {
          addressBarRef.current.value = url;
        }
        setStatusText(result);

        // Inject navigation bar immediately after page starts loading
        try {
          await invoke<string>("inject_navigation_bar");
          setStatusText("Navigation bar injected");
        } catch (error) {
          console.error("Navigation bar injection error:", error);
          setStatusText(
            "Navigation bar injection failed - use Ctrl+I to retry"
          );
        }
      } else {
        throw new Error("Invalid URL");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatusText(`Failed to load: ${errorMessage}`);
      setBrowserState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Navigation functions
  const navigateBack = async (): Promise<void> => {
    try {
      if (browserState.historyIndex > 0) {
        const result = await invoke<string>("browser_go_back");
        setBrowserState((prev) => ({
          ...prev,
          historyIndex: prev.historyIndex - 1,
          currentUrl: prev.history[prev.historyIndex - 1],
        }));
        if (addressBarRef.current) {
          addressBarRef.current.value =
            browserState.history[browserState.historyIndex - 1];
        }
        setStatusText(result);
      }
    } catch (error) {
      console.error("Back navigation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatusText(`Failed to go back: ${errorMessage}`);
    }
  };

  const navigateForward = async (): Promise<void> => {
    try {
      if (browserState.historyIndex < browserState.history.length - 1) {
        const result = await invoke<string>("browser_go_forward");
        setBrowserState((prev) => ({
          ...prev,
          historyIndex: prev.historyIndex + 1,
          currentUrl: prev.history[prev.historyIndex + 1],
        }));
        if (addressBarRef.current) {
          addressBarRef.current.value =
            browserState.history[browserState.historyIndex + 1];
        }
        setStatusText(result);
      }
    } catch (error) {
      console.error("Forward navigation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatusText(`Failed to go forward: ${errorMessage}`);
    }
  };

  const refreshPage = async (): Promise<void> => {
    try {
      setBrowserState((prev) => ({ ...prev, isLoading: true }));
      setStatusText("Refreshing page...");
      const result = await invoke<string>("browser_refresh");
      setStatusText(result);
      setBrowserState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error("Refresh error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatusText(`Failed to refresh: ${errorMessage}`);
      setBrowserState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const navigateHome = async (): Promise<void> => {
    await navigateToUrl("https://www.google.com");
  };

  const forceInjectNavigation = async (): Promise<void> => {
    try {
      const result = await invoke<string>("force_inject_navigation");
      setStatusText(result);
    } catch (error) {
      console.error("Force inject error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatusText(`Failed to inject navigation: ${errorMessage}`);
    }
  };

  const toggleBookmark = async (): Promise<void> => {
    try {
      const url = browserState.currentUrl;
      const title = url;

      const existingIndex = browserState.bookmarks.findIndex(
        (bookmark) => bookmark.url === url
      );
      let newBookmarks: Bookmark[];

      if (existingIndex >= 0) {
        // Remove bookmark
        newBookmarks = browserState.bookmarks.filter(
          (_, index) => index !== existingIndex
        );
        setStatusText("Bookmark removed");
      } else {
        // Add bookmark
        newBookmarks = [
          ...browserState.bookmarks,
          { url, title, timestamp: Date.now() },
        ];
        setStatusText("Bookmark added");
      }

      setBrowserState((prev) => ({ ...prev, bookmarks: newBookmarks }));
      localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));

      // Notify backend
      await invoke<string>("update_bookmarks", { bookmarks: newBookmarks });
    } catch (error) {
      console.error("Bookmark error:", error);
      setStatusText("Failed to update bookmark");
    }
  };

  const showMenu = (): void => {
    const action = prompt(`Choose an action:
1. Close Browser Window
2. Force Inject Navigation Bar
3. Show Bookmarks
4. Cancel

Enter number (1-4):`);

    switch (action) {
      case "1":
        closeBrowserWindow();
        break;
      case "2":
        forceInjectNavigation();
        break;
      case "3":
        console.log("Bookmarks:", browserState.bookmarks);
        setStatusText(`You have ${browserState.bookmarks.length} bookmarks`);
        break;
      case "4":
      default:
        setStatusText("Menu cancelled");
        break;
    }
  };

  const closeBrowserWindow = async (): Promise<void> => {
    try {
      const result = await invoke<string>("close_browser_window");
      setStatusText(result);
    } catch (error) {
      console.error("Close browser error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatusText(`Failed to close browser: ${errorMessage}`);
    }
  };

  const handleQuickLink = (url: string): void => {
    if (addressBarRef.current) {
      addressBarRef.current.value = url;
    }
    navigateToUrl(url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "l":
            event.preventDefault();
            addressBarRef.current?.focus();
            break;
          case "r":
            event.preventDefault();
            refreshPage();
            break;
          case "d":
            event.preventDefault();
            toggleBookmark();
            break;
          case "[":
            event.preventDefault();
            navigateBack();
            break;
          case "]":
            event.preventDefault();
            navigateForward();
            break;
          case "w":
            event.preventDefault();
            closeBrowserWindow();
            break;
          case "i":
            event.preventDefault();
            forceInjectNavigation();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [browserState]);

  const isBookmarked: boolean = browserState.bookmarks.some(
    (bookmark) => bookmark.url === browserState.currentUrl
  );
  const isSecure: boolean = browserState.currentUrl.startsWith("https://");

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-buttons">
          <button
            className="nav-btn"
            title="Go Back"
            disabled={browserState.historyIndex <= 0}
            onClick={navigateBack}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>

          <button
            className="nav-btn"
            title="Go Forward"
            disabled={
              browserState.historyIndex >= browserState.history.length - 1
            }
            onClick={navigateForward}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </button>

          <button className="nav-btn" title="Refresh" onClick={refreshPage}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>

          <button className="nav-btn" title="Home" onClick={navigateHome}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
        </div>

        <div className="address-bar-container">
          <div
            className={`security-indicator ${isSecure ? "secure" : "insecure"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path
                d={
                  isSecure
                    ? "M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"
                    : "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"
                }
              />
            </svg>
          </div>
          <input
            ref={addressBarRef}
            type="text"
            className="address-bar"
            placeholder="Enter URL or search..."
            defaultValue="https://www.google.com"
            onKeyDown={handleAddressBarKeydown}
            onFocus={handleAddressBarFocus}
            onBlur={handleAddressBarBlur}
          />
        </div>

        <div className="browser-actions">
          <button
            className={`action-btn ${isBookmarked ? "bookmarked" : ""}`}
            title="Bookmark"
            onClick={toggleBookmark}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z" />
            </svg>
          </button>
          <button className="action-btn" title="Menu" onClick={showMenu}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Loading indicator */}
      <div
        className={`loading-indicator ${
          browserState.isLoading ? "" : "hidden"
        }`}
      >
        <div className="loading-bar"></div>
      </div>

      <main className="content">
        <div className="welcome-area">
          <div className="welcome-content">
            <div className="browser-logo">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
              </svg>
            </div>
            <h1>🚀 Welcome to xbrowser</h1>
            <p className="welcome-subtitle">
              A fast, secure, and modern web browser built with Tauri + React +
              TypeScript
            </p>

            <div className="getting-started">
              <h3>Getting Started</h3>
              <ul>
                <li>Enter a URL in the address bar above</li>
                <li>Try searching for anything</li>
                <li>Use keyboard shortcuts for quick navigation</li>
                <li>Bookmark your favorite sites</li>
              </ul>
            </div>

            <div className="quick-links">
              <h3>Quick Links</h3>
              <div className="link-grid">
                <button
                  className="quick-link"
                  onClick={() => handleQuickLink("https://www.google.com")}
                >
                  Google
                </button>
                <button
                  className="quick-link"
                  onClick={() => handleQuickLink("https://github.com")}
                >
                  GitHub
                </button>
                <button
                  className="quick-link"
                  onClick={() => handleQuickLink("https://tauri.app")}
                >
                  Tauri
                </button>
                <button
                  className="quick-link"
                  onClick={() =>
                    handleQuickLink("https://developer.mozilla.org")
                  }
                >
                  MDN
                </button>
              </div>
            </div>

            <div className="keyboard-shortcuts">
              <h3>Keyboard Shortcuts</h3>
              <div className="shortcut-grid">
                <div className="shortcut">
                  <kbd>Ctrl/Cmd + L</kbd>
                  <span>Focus address bar</span>
                </div>
                <div className="shortcut">
                  <kbd>Ctrl/Cmd + R</kbd>
                  <span>Refresh page</span>
                </div>
                <div className="shortcut">
                  <kbd>Ctrl/Cmd + D</kbd>
                  <span>Bookmark page</span>
                </div>
                <div className="shortcut">
                  <kbd>Ctrl/Cmd + I</kbd>
                  <span>Force inject navigation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="status-bar">
        <span className="status-text">{statusText}</span>
        <span className="zoom-level">100%</span>
      </footer>
    </div>
  );
}

export default App;
