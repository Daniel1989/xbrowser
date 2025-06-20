# xbrowser

A cross-platform desktop browser application built with Tauri, combining the power of Rust backend with modern web frontend technologies.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Rust** (latest stable version)

  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source ~/.cargo/env
  ```

- **Tauri CLI**
  ```bash
  cargo install tauri-cli --version "^2.0.0"
  ```

### Platform-specific Requirements

#### macOS

```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### Windows

- **Microsoft Visual Studio C++ Build Tools** or **Visual Studio Community**
- **WebView2** (usually pre-installed on Windows 10/11)

## Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd xbrowser
   ```

2. **Verify installation**
   ```bash
   cargo tauri info
   ```

## Development Workflow

### Running in Development Mode

Start the development server with hot-reload:

```bash
# From the project root
cargo tauri dev
```

This will:

- Compile the Rust backend
- Start the frontend development server
- Launch the application window
- Enable hot-reload for both frontend and backend changes

### Building the Project

#### Development Build

```bash
cargo tauri build --debug
```

#### Production Build

```bash
cargo tauri build
```

Built applications will be available in:

- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `src-tauri/target/release/bundle/appimage/`

### Frontend Development

The frontend is located in the `src/` directory and uses vanilla HTML, CSS, and JavaScript.

#### File Structure

```
src/
├── index.html      # Main HTML file
├── main.js         # JavaScript logic and Tauri API calls
├── styles.css      # Application styling
└── assets/         # Static assets (images, icons)
```

#### Making Frontend Changes

- Edit files in `src/` directory
- Changes are automatically hot-reloaded in development mode
- No build step required for frontend-only changes

### Backend Development

The Rust backend is located in the `src-tauri/src/` directory.

#### File Structure

```
src-tauri/src/
├── main.rs         # Application entry point
└── lib.rs          # Core application logic and Tauri commands
```

#### Adding New Tauri Commands

1. Define the command function in `lib.rs`:

   ```rust
   #[tauri::command]
   fn your_command(param: String) -> String {
       // Your logic here
       format!("Result: {}", param)
   }
   ```

2. Register the command in the builder:

   ```rust
   .invoke_handler(tauri::generate_handler![greet, your_command])
   ```

3. Call from frontend:
   ```javascript
   const result = await invoke("your_command", { param: "value" });
   ```

## Debugging

### Frontend Debugging

1. **Browser DevTools**: Right-click in the app window → "Inspect Element"
2. **Console Logs**: Use `console.log()` in JavaScript
3. **Network Tab**: Monitor API calls and resources

### Backend Debugging

1. **Print Debugging**: Use `println!()` or `dbg!()` macros
2. **Logging**: Add `tracing` or `log` crate for structured logging
3. **VS Code**: Use the Rust analyzer extension with breakpoints

### Advanced Debugging

#### Rust Debugging with LLDB/GDB

```bash
# Build with debug symbols
cargo tauri build --debug

# Run with debugger (macOS/Linux)
lldb ./src-tauri/target/debug/xbrowser
```

#### Performance Profiling

```bash
# Profile the Rust backend
cargo tauri build --debug
perf record ./src-tauri/target/debug/xbrowser
perf report
```

## Configuration

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to modify:

- App metadata (name, version, description)
- Window properties (size, resizable, decorations)
- Security settings (CSP, permissions)
- Build options (targets, icons)

### Cargo Configuration

Edit `src-tauri/Cargo.toml` to:

- Add new Rust dependencies
- Configure build features
- Set compilation targets

## Common Development Tasks

### Adding Dependencies

#### Rust Dependencies

```bash
cd src-tauri
cargo add serde_json  # Example
```

#### Tauri Plugins

```bash
cd src-tauri
cargo add tauri-plugin-fs  # Example plugin
```

Then enable in `lib.rs`:

```rust
.plugin(tauri_plugin_fs::init())
```

### Updating Tauri

```bash
cargo update
cargo install tauri-cli --version "^2.0.0" --force
```

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Ensure all system dependencies are installed
   - Clear target directory: `cargo clean`
   - Update Rust: `rustup update`

2. **Hot Reload Not Working**

   - Restart the dev server: `cargo tauri dev`
   - Check file permissions
   - Verify frontend file changes are saved

3. **Command Not Found**

   - Ensure command is registered in `generate_handler![]`
   - Check function signature matches frontend call
   - Verify command is marked with `#[tauri::command]`

4. **Permission Errors**
   - Update `src-tauri/capabilities/default.json`
   - Add required permissions for new features

### Getting Help

- [Tauri Documentation](https://tauri.app/develop/)
- [Tauri Discord Community](https://discord.com/invite/SpmNs4S)
- [GitHub Issues](https://github.com/tauri-apps/tauri/issues)

## Recommended IDE Setup

- **VS Code** with extensions:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml)

## Project Structure

```
xbrowser/
├── src/                    # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── main.js
│   ├── styles.css
│   └── assets/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── capabilities/
│   └── icons/
└── README.md
```
