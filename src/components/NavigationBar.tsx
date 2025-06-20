import React, { useState, useRef } from "react";

interface NavigationBarProps {
  onOpenTab: (url: string) => Promise<void>;
  isLoading: boolean;
  statusMessage: string;
  onCloseAllTabs: () => Promise<void>;
  tabCount: number;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  onOpenTab,
  isLoading,
  statusMessage,
  onCloseAllTabs,
  tabCount,
}) => {
  const [urlInput, setUrlInput] = useState<string>("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let url = urlInput.trim();

    // Auto-format URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".") && !url.includes(" ")) {
        // Looks like a domain
        url = "https://" + url;
      } else {
        // Treat as search query
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    await onOpenTab(url);
    setUrlInput(""); // Clear input after opening
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleUrlSubmit(e);
    }
  };

  return (
    <div className="navigation-bar">
      <div className="url-section">
        <form onSubmit={handleUrlSubmit} className="url-form">
          <input
            ref={urlInputRef}
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL or search term..."
            className="url-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="open-button"
            disabled={isLoading || !urlInput.trim()}
          >
            {isLoading ? "Opening..." : "Open"}
          </button>
        </form>
      </div>

      <div className="tab-controls">
        <div className="tab-info">
          <span className="tab-count">
            {tabCount} tab{tabCount !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          onClick={onCloseAllTabs}
          className="close-all-button"
          disabled={tabCount === 0}
          title="Close all tabs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
          Close All
        </button>
      </div>

      <div className="status-section">
        <span className="status-message">{statusMessage}</span>
      </div>
    </div>
  );
};
