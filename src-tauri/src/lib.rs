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
    // In a real implementation, you might save to a file or database
    println!("Bookmarks updated: {:?}", bookmarks);
    Ok(format!("Updated {} bookmarks", bookmarks.len()))
}

#[tauri::command]
fn get_bookmarks() -> Result<Vec<Bookmark>, String> {
    // In a real implementation, you would load from storage
    // For now, return empty array
    Ok(vec![])
}

#[tauri::command]
fn get_browser_info() -> Result<serde_json::Value, String> {
    let info = serde_json::json!({
        "name": "xbrowser",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Multi-tab browser built with Tauri + React + TypeScript",
        "author": "xbrowser Team",
        "features": [
            "Multi-tab browsing with independent WebviewWindows",
            "URL validation",
            "Bookmark management",
            "Modern React UI",
            "TypeScript support"
        ]
    });
    Ok(info)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            validate_url,
            update_bookmarks,
            get_bookmarks,
            get_browser_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
