#!/usr/bin/env node
/**
 * SCORM Package Build Script
 * 
 * Creates a SCORM 1.2 compliant package for Moodle 4.6+
 * 
 * Usage: npm run build:scorm
 * Output: scorm-package.zip
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const outputZip = path.join(projectRoot, 'scorm-package.zip');

// SCORM schema files to copy
const schemaFiles = [
  'imsmanifest.xml',
  'adlcp_rootv1p2.xsd',
  'ims_xml.xsd',
  'imscp_rootv1p1p2.xsd',
  'imsmd_rootv1p2p1.xsd'
];

/**
 * Run the Vite build
 */
function runBuild() {
  console.log('📦 Building application...');
  execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
  console.log('✅ Build complete\n');
}

/**
 * Get all files in dist directory recursively
 */
function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath.replace(/\\/g, '/')); // Normalize for XML
    }
  }
  
  return files;
}

/**
 * Update imsmanifest.xml with all built files
 */
function updateManifest() {
  console.log('📝 Updating manifest with file list...');
  
  const manifestPath = path.join(distDir, 'imsmanifest.xml');
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  // Get all files in dist (excluding schema files)
  const allFiles = getAllFiles(distDir)
    .filter(f => !schemaFiles.includes(f));
  
  // Generate file entries
  const fileEntries = allFiles
    .map(f => `      <file href="${f}"/>`)
    .join('\n');
  
  // Replace the placeholder comment with actual file list
  manifest = manifest.replace(
    /<file href="index\.html"\/>[\s\S]*?<!-- Additional files will be added by the build script -->/,
    `<file href="index.html"/>\n${fileEntries}`
  );
  
  fs.writeFileSync(manifestPath, manifest);
  console.log(`✅ Added ${allFiles.length} files to manifest\n`);
}

/**
 * Create the SCORM ZIP package
 */
async function createZip() {
  console.log('🗜️  Creating SCORM package...');
  
  // Remove existing zip if present
  if (fs.existsSync(outputZip)) {
    fs.unlinkSync(outputZip);
  }
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZip);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Created scorm-package.zip (${sizeMB} MB)\n`);
      resolve();
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    
    // Add all files from dist directory
    archive.directory(distDir, false);
    
    archive.finalize();
  });
}

/**
 * Main build process
 */
async function main() {
  console.log('\n🎓 SCORM Package Builder\n');
  console.log('=' .repeat(40) + '\n');
  
  try {
    // Step 1: Run Vite build
    runBuild();
    
    // Step 2: Copy schema files (should already be in dist from public/)
    console.log('📋 Verifying schema files...');
    for (const file of schemaFiles) {
      const distPath = path.join(distDir, file);
      if (!fs.existsSync(distPath)) {
        // Copy from public if not already in dist
        const publicPath = path.join(projectRoot, 'public', file);
        if (fs.existsSync(publicPath)) {
          fs.copyFileSync(publicPath, distPath);
          console.log(`  Copied: ${file}`);
        } else {
          throw new Error(`Missing schema file: ${file}`);
        }
      } else {
        console.log(`  Found: ${file}`);
      }
    }
    console.log('✅ Schema files verified\n');
    
    // Step 3: Update manifest with file list
    updateManifest();
    
    // Step 4: Create ZIP package
    await createZip();
    
    // Done!
    console.log('=' .repeat(40));
    console.log('🎉 SCORM package ready!\n');
    console.log('📁 Output: scorm-package.zip');
    console.log('\nUpload to Moodle:');
    console.log('  1. Course → Add activity → SCORM package');
    console.log('  2. Upload scorm-package.zip');
    console.log('  3. Set Grade method: Highest grade');
    console.log('  4. Save and test\n');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
