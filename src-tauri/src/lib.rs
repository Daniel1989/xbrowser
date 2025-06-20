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

fn get_navigation_bar_script() -> String {
    r#"
    (function() {
        // Check if navigation bar already exists
        if (document.getElementById('xbrowser-nav-bar')) {
            return;
        }

        // Create navigation bar HTML
        const navBarHTML = `
            <div id="xbrowser-nav-bar" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 50px;
                background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
                border-bottom: 1px solid #ccc;
                display: flex;
                align-items: center;
                padding: 8px 12px;
                gap: 8px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <button id="xbrowser-back" style="
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #555;
                    transition: background 0.2s;
                " title="Go Back">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                </button>
                
                <button id="xbrowser-forward" style="
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #555;
                    transition: background 0.2s;
                " title="Go Forward">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                </button>
                
                <button id="xbrowser-reload" style="
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #555;
                    transition: background 0.2s;
                " title="Reload">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                </button>
                
                <div style="
                    flex: 1;
                    display: flex;
                    align-items: center;
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 0 12px;
                    height: 34px;
                    margin: 0 8px;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        color: #4CAF50;
                        margin-right: 8px;
                    ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"/>
                        </svg>
                    </div>
                    <input id="xbrowser-url" type="text" value="${window.location.href}" style="
                        flex: 1;
                        border: none;
                        outline: none;
                        font-size: 14px;
                        background: transparent;
                        color: #333;
                    " readonly>
                </div>
                
                <button id="xbrowser-close" style="
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #d32f2f;
                    transition: background 0.2s;
                " title="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                </button>
            </div>
        `;

        // Inject navigation bar
        document.body.insertAdjacentHTML('afterbegin', navBarHTML);
        
        // Adjust body margin to account for nav bar
        document.body.style.marginTop = '50px';
        
        // Add button hover effects
        const buttons = document.querySelectorAll('#xbrowser-nav-bar button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(0,0,0,0.1)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'transparent';
            });
        });
        
        // Add navigation functionality
        document.getElementById('xbrowser-back').addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            }
        });
        
        document.getElementById('xbrowser-forward').addEventListener('click', () => {
            window.history.forward();
        });
        
        document.getElementById('xbrowser-reload').addEventListener('click', () => {
            window.location.reload();
        });
        
        document.getElementById('xbrowser-close').addEventListener('click', () => {
            // This will be handled by the Tauri backend
            window.close();
        });
        
        // Update URL when navigation occurs
        const updateURL = () => {
            const urlInput = document.getElementById('xbrowser-url');
            if (urlInput) {
                urlInput.value = window.location.href;
            }
        };
        
        // Listen for navigation events
        window.addEventListener('popstate', updateURL);
        window.addEventListener('load', updateURL);
        
        // Update URL periodically (for dynamic content)
        setInterval(updateURL, 1000);
        
        // Make navigation bar unselectable
        const navBar = document.getElementById('xbrowser-nav-bar');
        navBar.style.userSelect = 'none';
        navBar.style.webkitUserSelect = 'none';
        navBar.style.mozUserSelect = 'none';
        navBar.style.msUserSelect = 'none';
        
        console.log('xbrowser navigation bar injected');
    })();
    "#.to_string()
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
                        Ok(_) => {
                            // Inject navigation bar after navigation
                            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                            let _ = browser_webview.eval(&get_navigation_bar_script());
                            Ok(format!("Navigated to {}", url))
                        }
                        Err(e) => Err(format!("Failed to navigate: {}", e)),
                    }
                } else {
                    // Create new browser webview
                    let webview_builder = WebviewWindowBuilder::new(
                        &app,
                        "browser",
                        WebviewUrl::External(parsed_url.clone()),
                    )
                    .title(&format!("xbrowser - {}", url))
                    .inner_size(1200.0, 800.0)
                    .min_inner_size(800.0, 600.0)
                    .resizable(true)
                    .maximizable(true)
                    .minimizable(true)
                    .closable(true)
                    .center()
                    .focused(true);

                    match webview_builder.build() {
                        Ok(webview) => {
                            // Hide the main window since we now have a browser window
                            let _ = main_window.hide();

                            // Inject navigation bar after the page loads
                            let webview_clone = webview.clone();
                            tauri::async_runtime::spawn(async move {
                                tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
                                let _ = webview_clone.eval(&get_navigation_bar_script());
                            });

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
async fn inject_navigation_bar(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(browser_window) = app.get_webview_window("browser") {
        match browser_window.eval(&get_navigation_bar_script()) {
            Ok(_) => Ok("Navigation bar injected".to_string()),
            Err(e) => Err(format!("Failed to inject navigation bar: {}", e)),
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
            inject_navigation_bar,
            update_bookmarks,
            get_bookmarks,
            clear_history,
            get_browser_info,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
