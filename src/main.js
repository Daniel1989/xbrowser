const { invoke } = window.__TAURI__.core;

// Browser state management
let browserState = {
  currentUrl: "https://www.google.com",
  history: ["https://www.google.com"],
  historyIndex: 0,
  isLoading: false,
  bookmarks: JSON.parse(localStorage.getItem("bookmarks") || "[]")
};

// DOM elements
let addressBar;
let browserFrame;
let backBtn;
let forwardBtn;
let refreshBtn;
let homeBtn;
let statusText;
let loadingIndicator;
let securityIndicator;

// Initialize browser when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  initializeElements();
  setupEventListeners();
  updateUI();
  loadHomePage();
});

function initializeElements() {
  addressBar = document.querySelector("#address-bar");
  browserFrame = document.querySelector("#browser-frame");
  backBtn = document.querySelector("#back-btn");
  forwardBtn = document.querySelector("#forward-btn");
  refreshBtn = document.querySelector("#refresh-btn");
  homeBtn = document.querySelector("#home-btn");
  statusText = document.querySelector("#status-text");
  loadingIndicator = document.querySelector("#loading-indicator");
  securityIndicator = document.querySelector("#security-indicator");
}

function setupEventListeners() {
  // Address bar events
  addressBar.addEventListener("keydown", handleAddressBarKeydown);
  addressBar.addEventListener("focus", handleAddressBarFocus);
  addressBar.addEventListener("blur", handleAddressBarBlur);

  // Navigation button events
  backBtn.addEventListener("click", navigateBack);
  forwardBtn.addEventListener("click", navigateForward);
  refreshBtn.addEventListener("click", refreshPage);
  homeBtn.addEventListener("click", navigateHome);

  // Browser frame events
  browserFrame.addEventListener("load", handleFrameLoad);
  browserFrame.addEventListener("error", handleFrameError);

  // Menu and bookmark events
  document.querySelector("#bookmark-btn").addEventListener("click", toggleBookmark);
  document.querySelector("#menu-btn").addEventListener("click", showMenu);
}

async function handleAddressBarKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const url = addressBar.value.trim();
    if (url) {
      await navigateToUrl(url);
    }
  }
}

function handleAddressBarFocus() {
  addressBar.select();
}

function handleAddressBarBlur() {
  addressBar.value = browserState.currentUrl;
}

async function navigateToUrl(input) {
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
    setLoadingState(true);
    updateStatus(`Loading ${url}...`);

    // Call backend to validate URL
    const isValid = await invoke("validate_url", { url });
    
    if (isValid) {
      // Update browser state
      browserState.currentUrl = url;
      addToHistory(url);
      
      // Navigate iframe
      browserFrame.src = url;
      addressBar.value = url;
      
      // Update security indicator
      updateSecurityIndicator(url);
      
      updateUI();
    } else {
      throw new Error("Invalid URL");
    }
  } catch (error) {
    console.error("Navigation error:", error);
    updateStatus(`Failed to load: ${error.message}`);
    setLoadingState(false);
  }
}

function addToHistory(url) {
  // Remove any forward history if we're not at the end
  if (browserState.historyIndex < browserState.history.length - 1) {
    browserState.history = browserState.history.slice(0, browserState.historyIndex + 1);
  }
  
  // Add new URL to history
  browserState.history.push(url);
  browserState.historyIndex = browserState.history.length - 1;
}

async function navigateBack() {
  if (browserState.historyIndex > 0) {
    browserState.historyIndex--;
    const url = browserState.history[browserState.historyIndex];
    browserState.currentUrl = url;
    browserFrame.src = url;
    addressBar.value = url;
    updateSecurityIndicator(url);
    updateUI();
    updateStatus(`Navigating back to ${url}`);
  }
}

async function navigateForward() {
  if (browserState.historyIndex < browserState.history.length - 1) {
    browserState.historyIndex++;
    const url = browserState.history[browserState.historyIndex];
    browserState.currentUrl = url;
    browserFrame.src = url;
    addressBar.value = url;
    updateSecurityIndicator(url);
    updateUI();
    updateStatus(`Navigating forward to ${url}`);
  }
}

async function refreshPage() {
  setLoadingState(true);
  updateStatus("Refreshing page...");
  browserFrame.src = browserFrame.src;
}

async function navigateHome() {
  await navigateToUrl("https://www.google.com");
}

function handleFrameLoad() {
  setLoadingState(false);
  updateStatus("Page loaded");
  
  // Try to get the actual URL from the iframe (might be restricted by CORS)
  try {
    const frameUrl = browserFrame.contentWindow.location.href;
    if (frameUrl && frameUrl !== "about:blank") {
      browserState.currentUrl = frameUrl;
      addressBar.value = frameUrl;
      updateSecurityIndicator(frameUrl);
    }
  } catch (error) {
    // CORS restriction, use the src attribute
    console.log("Cannot access iframe URL due to CORS policy");
  }
}

function handleFrameError() {
  setLoadingState(false);
  updateStatus("Failed to load page");
}

function setLoadingState(loading) {
  browserState.isLoading = loading;
  
  if (loading) {
    loadingIndicator.classList.remove("hidden");
    refreshBtn.style.opacity = "0.6";
  } else {
    loadingIndicator.classList.add("hidden");
    refreshBtn.style.opacity = "1";
  }
}

function updateStatus(message) {
  statusText.textContent = message;
}

function updateSecurityIndicator(url) {
  const isSecure = url.startsWith("https://");
  const icon = securityIndicator.querySelector("svg path");
  
  if (isSecure) {
    securityIndicator.style.color = "#4CAF50";
    icon.setAttribute("d", "M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z");
    securityIndicator.title = "Secure connection";
  } else {
    securityIndicator.style.color = "#FF9800";
    icon.setAttribute("d", "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z");
    securityIndicator.title = "Not secure";
  }
}

function updateUI() {
  // Update navigation buttons
  backBtn.disabled = browserState.historyIndex <= 0;
  forwardBtn.disabled = browserState.historyIndex >= browserState.history.length - 1;
  
  // Update bookmark button
  const isBookmarked = browserState.bookmarks.some(bookmark => bookmark.url === browserState.currentUrl);
  const bookmarkBtn = document.querySelector("#bookmark-btn");
  bookmarkBtn.style.color = isBookmarked ? "#4285f4" : "";
}

async function toggleBookmark() {
  try {
    const url = browserState.currentUrl;
    const title = await getPageTitle() || url;
    
    const existingIndex = browserState.bookmarks.findIndex(bookmark => bookmark.url === url);
    
    if (existingIndex >= 0) {
      // Remove bookmark
      browserState.bookmarks.splice(existingIndex, 1);
      updateStatus("Bookmark removed");
    } else {
      // Add bookmark
      browserState.bookmarks.push({ url, title, timestamp: Date.now() });
      updateStatus("Bookmark added");
    }
    
    // Save to localStorage
    localStorage.setItem("bookmarks", JSON.stringify(browserState.bookmarks));
    updateUI();
    
    // Notify backend
    await invoke("update_bookmarks", { bookmarks: browserState.bookmarks });
  } catch (error) {
    console.error("Bookmark error:", error);
    updateStatus("Failed to update bookmark");
  }
}

async function getPageTitle() {
  try {
    return browserFrame.contentDocument?.title || browserFrame.contentWindow?.document?.title;
  } catch (error) {
    return null;
  }
}

function showMenu() {
  // Simple menu implementation
  const menu = [
    "New Tab",
    "New Window", 
    "---",
    "History",
    "Bookmarks",
    "Downloads",
    "---",
    "Settings",
    "Developer Tools"
  ];
  
  updateStatus("Menu opened");
  
  // You could implement a proper context menu here
  console.log("Menu items:", menu);
}

async function loadHomePage() {
  updateStatus("Ready");
  setLoadingState(false);
}

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case "l":
        event.preventDefault();
        addressBar.focus();
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
    }
  }
});
