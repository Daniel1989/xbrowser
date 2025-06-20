# xbrowser Multi-Tab Architecture

## Overview

xbrowser is a modern web browser built with Tauri, React, and TypeScript that implements a unique multi-tab architecture using independent WebviewWindows.

## Architecture Components

### 1. Main Browser Shell (`src/App.tsx`)

- Acts as the central control panel for the browser
- Built with React and TypeScript
- Manages tab state and provides the user interface
- Contains URL input, tab management controls, and tab list display

### 2. Tab Management System (`src/hooks/useTabManager.ts`)

- Custom React hook that manages all tab operations
- Handles creation, closing, and focus management of tabs
- Communicates with Tauri backend for URL validation
- Manages inter-window communication

### 3. Independent WebviewWindows

- Each tab runs in its own Tauri WebviewWindow
- Direct navigation to websites without iframe restrictions
- Bypasses X-Frame-Options: DENY and other embedding restrictions
- Each window is resizable, movable, and closable

### 4. React Components

- **NavigationBar** (`src/components/NavigationBar.tsx`): URL input and tab controls
- **TabList** (`src/components/TabList.tsx`): Display and management of open tabs

### 5. Rust Backend (`src-tauri/src/lib.rs`)

- Simplified backend focused on URL validation
- Bookmark management (extensible for storage)
- Browser information and metadata

## Key Features

### Multi-Tab Browsing

- Each tab is an independent WebviewWindow
- No iframe limitations - can load any website
- Individual window management (resize, move, close)
- Tab state synchronization with main window

### Modern UI/UX

- Clean, responsive React interface
- Modern CSS with CSS custom properties
- Dark/light theme support
- Keyboard shortcuts (Ctrl/Cmd + T, W, Q)

### Type Safety

- Full TypeScript implementation
- Strict type checking enabled
- Interface definitions for all data structures
- Type-safe Tauri API integration

## File Structure

```
xbrowser/
├── src/                          # React frontend
│   ├── components/               # React components
│   │   ├── NavigationBar.tsx    # URL input and controls
│   │   └── TabList.tsx          # Tab display and management
│   ├── hooks/                   # Custom React hooks
│   │   └── useTabManager.ts     # Tab management logic
│   ├── types/                   # TypeScript type definitions
│   │   └── tab.ts               # Tab-related interfaces
│   ├── App.tsx                  # Main application component
│   ├── App.css                  # Application styles
│   ├── main.tsx                 # React entry point
│   └── index.html               # HTML template
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── lib.rs               # Main Tauri application
│   │   └── main.rs              # Entry point
│   ├── capabilities/
│   │   └── default.json         # Tauri permissions
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
└── package.json                 # Node.js dependencies
```

## Technical Implementation

### WebviewWindow Creation

```typescript
const webview = new WebviewWindow(windowLabel, {
  url,
  width: 1200,
  height: 800,
  resizable: true,
  decorations: true,
  center: true,
});
```

### URL Validation

```rust
#[tauri::command]
fn validate_url(url: String) -> bool {
    match Url::parse(&url) {
        Ok(parsed_url) => matches!(parsed_url.scheme(), "http" | "https"),
        Err(_) => false,
    }
}
```

### Tab State Management

```typescript
interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  windowLabel: string;
  createdAt: number;
}
```

## Development

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

### Key Commands

- **Ctrl/Cmd + T**: Focus URL input for new tab
- **Ctrl/Cmd + W**: Close active tab
- **Ctrl/Cmd + Q**: Close all tabs

## Advantages of This Architecture

1. **No iframe limitations**: Each tab can load any website, including those that prevent embedding
2. **True isolation**: Each tab runs in its own process
3. **Better performance**: Independent windows reduce memory conflicts
4. **Native window management**: Users can resize, move, and manage tabs as separate windows
5. **Simplified debugging**: Each tab can be debugged independently

## Future Enhancements

- Session persistence
- Bookmark synchronization
- Tab grouping
- Developer tools integration
- Extensions support
- History management
- Privacy/incognito mode
