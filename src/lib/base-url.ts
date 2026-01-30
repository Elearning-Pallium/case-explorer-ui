/**
 * Base URL Utility for SCORM Compatibility
 * 
 * Moodle serves SCORM packages from nested URLs like:
 *   /pluginfile.php/12345/mod_scorm/content/1/index.html
 * 
 * Using absolute paths like `/content/case.json` would resolve to:
 *   /content/case.json (WRONG - 404)
 * 
 * Instead, we need paths relative to the launch page:
 *   /pluginfile.php/12345/mod_scorm/content/1/content/case.json (CORRECT)
 */

/**
 * Get the base URL for fetching content files.
 * Works in both development (Vite) and production (SCORM/Moodle).
 */
export function getBaseUrl(): string {
  const href = window.location.href;
  
  // Remove hash portion (for HashRouter)
  const hashIndex = href.indexOf('#');
  const urlWithoutHash = hashIndex >= 0 ? href.substring(0, hashIndex) : href;
  
  // Get directory path (everything up to last /)
  const lastSlashIndex = urlWithoutHash.lastIndexOf('/');
  return urlWithoutHash.substring(0, lastSlashIndex + 1);
}

/**
 * Build a full URL for a content file path.
 */
export function buildContentUrl(relativePath: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${baseUrl}${cleanPath}`;
}
