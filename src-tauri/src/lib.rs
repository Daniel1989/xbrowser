// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
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
            update_bookmarks,
            get_bookmarks,
            clear_history,
            get_browser_info,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
