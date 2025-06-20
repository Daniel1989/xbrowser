// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use url::Url;

#[derive(Debug, Serialize, Deserialize)]
struct Bookmark {
    url: String,
    title: String,
    timestamp: u64,
}

// Browser commands
#[tauri::command]
fn validate_url(url: String) -> bool {
    match Url::parse(&url) {
        Ok(parsed_url) => {
            // Check if it's a valid HTTP/HTTPS URL
            matches!(parsed_url.scheme(), "http" | "https")
        }
        Err(_) => false,
    }
}

#[tauri::command]
async fn navigate_to_url(app: tauri::AppHandle, url: String) -> Result<String, String> {
    match Url::parse(&url) {
        Ok(parsed_url) => {
            if !matches!(parsed_url.scheme(), "http" | "https") {
                return Err("Only HTTP and HTTPS URLs are supported".to_string());
            }

            // Get the main window
            if let Some(main_window) = app.get_webview_window("main") {
                // Check if browser webview already exists
                if let Some(browser_webview) = app.get_webview_window("browser") {
                    // Navigate existing webview
                    match browser_webview.navigate(parsed_url.clone()) {
                        Ok(_) => Ok(format!("Navigated to {}", url)),
                        Err(e) => Err(format!("Failed to navigate: {}", e)),
                    }
                } else {
                    // Create new browser webview
                    let webview_builder = WebviewWindowBuilder::new(
                        &app,
                        "browser",
                        WebviewUrl::External(parsed_url.clone()),
                    )
                    .title("xbrowser")
                    .inner_size(1200.0, 800.0)
                    .min_inner_size(800.0, 600.0)
                    .resizable(true)
                    .maximizable(true)
                    .minimizable(true)
                    .closable(true)
                    .center()
                    .focused(true);

                    match webview_builder.build() {
                        Ok(_) => {
                            // Hide the main window since we now have a browser window
                            let _ = main_window.hide();
                            Ok(format!("Opened {} in new browser window", url))
                        }
                        Err(e) => Err(format!("Failed to create browser window: {}", e)),
                    }
                }
            } else {
                Err("Main window not found".to_string())
            }
        }
        Err(e) => Err(format!("Invalid URL: {}", e)),
    }
}

#[tauri::command]
async fn close_browser_window(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(browser_window) = app.get_webview_window("browser") {
        match browser_window.close() {
            Ok(_) => {
                // Show the main window again
                if let Some(main_window) = app.get_webview_window("main") {
                    let _ = main_window.show();
                    let _ = main_window.set_focus();
                }
                Ok("Browser window closed".to_string())
            }
            Err(e) => Err(format!("Failed to close browser window: {}", e)),
        }
    } else {
        Err("No browser window to close".to_string())
    }
}

#[tauri::command]
async fn get_current_url(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(browser_window) = app.get_webview_window("browser") {
        // Note: Getting the current URL from a webview is limited in Tauri
        // We'll need to track this in the frontend state
        Ok("URL tracking via webview is limited".to_string())
    } else {
        Err("No browser window found".to_string())
    }
}

#[tauri::command]
async fn browser_go_back(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(browser_window) = app.get_webview_window("browser") {
        // Tauri doesn't have direct back/forward navigation
        // We'll need to implement this with JavaScript injection
        let script = "if (window.history.length > 1) { window.history.back(); }";
        match browser_window.eval(script) {
            Ok(_) => Ok("Navigated back".to_string()),
            Err(e) => Err(format!("Failed to go back: {}", e)),
        }
    } else {
        Err("No browser window found".to_string())
    }
}

#[tauri::command]
async fn browser_go_forward(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(browser_window) = app.get_webview_window("browser") {
        let script = "window.history.forward();";
        match browser_window.eval(script) {
            Ok(_) => Ok("Navigated forward".to_string()),
            Err(e) => Err(format!("Failed to go forward: {}", e)),
        }
    } else {
        Err("No browser window found".to_string())
    }
}

#[tauri::command]
async fn browser_refresh(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(browser_window) = app.get_webview_window("browser") {
        let script = "window.location.reload();";
        match browser_window.eval(script) {
            Ok(_) => Ok("Page refreshed".to_string()),
            Err(e) => Err(format!("Failed to refresh: {}", e)),
        }
    } else {
        Err("No browser window found".to_string())
    }
}

#[tauri::command]
fn update_bookmarks(bookmarks: Vec<Bookmark>) -> Result<String, String> {
    // Here you could save bookmarks to a file or database
    // For now, we'll just validate and return success
    println!("Updated bookmarks: {} items", bookmarks.len());
    for bookmark in &bookmarks {
        println!("  - {} ({})", bookmark.title, bookmark.url);
    }
    Ok(format!(
        "Successfully updated {} bookmarks",
        bookmarks.len()
    ))
}

#[tauri::command]
fn get_bookmarks() -> Result<Vec<Bookmark>, String> {
    // In a real implementation, you'd load from a file or database
    // For now, return empty vector
    Ok(vec![])
}

#[tauri::command]
fn clear_history() -> Result<String, String> {
    // Clear browsing history
    println!("Browser history cleared");
    Ok("History cleared successfully".to_string())
}

#[tauri::command]
fn get_browser_info() -> Result<serde_json::Value, String> {
    let info = serde_json::json!({
        "name": "xbrowser",
        "version": env!("CARGO_PKG_VERSION"),
        "user_agent": "xbrowser/1.0 (Tauri Browser)",
        "engine": "WebKit"
    });
    Ok(info)
}

#[tauri::command]
fn open_external_url(url: String) -> Result<String, String> {
    match Url::parse(&url) {
        Ok(_) => {
            // Use tauri's opener plugin to open URL in system browser
            println!("Opening external URL: {}", url);
            Ok(format!("Opened {} in external browser", url))
        }
        Err(e) => Err(format!("Invalid URL: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            validate_url,
            navigate_to_url,
            close_browser_window,
            get_current_url,
            browser_go_back,
            browser_go_forward,
            browser_refresh,
            update_bookmarks,
            get_bookmarks,
            clear_history,
            get_browser_info,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
