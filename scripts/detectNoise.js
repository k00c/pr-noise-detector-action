const fs = require('node:fs');
const path = require('node:path');

// File extension patterns - AI-generated files that shouldn't be in main
const filePatterns = [
  /\.log$/, /\.tmp$/, /\.bak$/, /\.swp$/, 
  /debug\./i, /test-output/i, /\.orig$/,
  /scratch\./i, /temp\./i, /\.draft$/,
  /\.checkpoint$/, /\.autosave$/,
  /untitled/i, /new-file/i,
  /\.DS_Store$/, /Thumbs\.db$/,
  /\.pyc$/, /\.pyo$/
];

// Directory/path patterns - AI-generated artifacts and dev-only folders
const dirPatterns = [
  /^\.vscode[\\/]/, /^\.idea[\\/]/, /^\.pytest_cache[\\/]/, 
  /^coverage[\\/]/, /^__pycache__[\\/]/, /^node_modules[\\/]/,
  /^tmp[\\/]/, /^temp[\\/]/, /^dist[\\/]/, /^build[\\/]/,
  /^scratch[\\/]/, /^debug[\\/]/, /^experiments[\\/]/,
  /^\.cache[\\/]/, /^\.next[\\/]/, /^\.nuxt[\\/]/,
  /^out[\\/]/, /^output[\\/]/
];

function isNoiseFile(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  return filePatterns.some(pattern => pattern.test(normalized)) ||
         dirPatterns.some(pattern => pattern.test(normalized));
}

const IGNORE_FILE = '.pr-noise-ignore';

function loadIgnorePatterns(filePath = IGNORE_FILE) {
  if (!fs.existsSync(filePath)) return [];

  const lines = fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')); // skip empty and comment lines

  return lines.map(pattern => {
    // Escape all regex special characters except *
    let escaped = pattern.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`);
    // Now replace * with .* for glob wildcard
    escaped = escaped.replaceAll('*', '.*');
    return new RegExp(`^${escaped}$`);
  });
}

// Load ignore patterns once at module initialization
let cachedIgnorePatterns = loadIgnorePatterns();

// Exposed function to reload patterns (useful for testing)
function reloadIgnorePatterns() {
  cachedIgnorePatterns = loadIgnorePatterns();
  return cachedIgnorePatterns;
}

function isIgnored(filePath, patterns = cachedIgnorePatterns) {
  return patterns.some(pattern => pattern.test(filePath));
}

function detectNoiseFiles(files, ignore = [], ignorePatterns = cachedIgnorePatterns) {
  return files.filter(file => {
    if (ignore.includes(file)) return false;
    if (isIgnored(file, ignorePatterns)) return false;
    return isNoiseFile(file);
  });
}

function findNoiseFiles(dir = '.') {
  let flagged = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative('.', fullPath);

      if (isIgnored(relativePath)) continue;

      if (isNoiseFile(relativePath)) {
        flagged.push(fullPath);
      }

      if (entry.isDirectory() && !isNoiseFile(relativePath)) {
        walk(fullPath);
      }
    }
  }

  walk(dir);
  return flagged;
}

function formatNoiseOutput(noiseFiles, options = {}) {
    const { maxFilesPerDir = 3, groupThreshold = 3 } = options;
    
    if (noiseFiles.length > 0) {
        let output = '⚠️ Found ' + noiseFiles.length + ' potentially superfluous files:\n';
        
        // Group files by directory
        const filesByDir = {};
        
        for (const file of noiseFiles) {
            const normalized = file.replace(/\\/g, '/');
            const lastSlash = normalized.lastIndexOf('/');
            const dir = lastSlash >= 0 ? normalized.substring(0, lastSlash) : '.';
            const filename = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
            
            if (!filesByDir[dir]) {
                filesByDir[dir] = [];
            }
            filesByDir[dir].push(filename);
        }
        
        // Sort directories for consistent output
        const sortedDirs = Object.keys(filesByDir).sort();
        
        for (const dir of sortedDirs) {
            const files = filesByDir[dir];
            
            if (files.length >= groupThreshold) {
                // Group files in this directory
                if (files.length <= maxFilesPerDir) {
                    // Show all files
                    const fileList = files.sort().join(', ');
                    const dirDisplay = dir === '.' ? '(root)' : dir + '/';
                    output += `- ${dirDisplay} (${files.length} files: ${fileList})\n`;
                } else {
                    // Show first few files + summary
                    const sortedFiles = files.sort();
                    const shownFiles = sortedFiles.slice(0, maxFilesPerDir);
                    const remainingCount = files.length - maxFilesPerDir;
                    const fileList = shownFiles.join(', ');
                    const dirDisplay = dir === '.' ? '(root)' : dir + '/';
                    output += `- ${dirDisplay} (${files.length} files: ${fileList}... and ${remainingCount} more)\n`;
                }
            } else {
                // Show individual files for small directories
                for (const filename of files.sort()) {
                    const fullPath = dir === '.' ? filename : `${dir}/${filename}`;
                    output += `- ${fullPath}\n`;
                }
            }
        }
        
        output += '\n🧹 Consider removing them if they are not needed.';
        return output;
    } else {
        return '✅ No noise detected.';
    }
}

const noiseFiles = findNoiseFiles();
const output = formatNoiseOutput(noiseFiles, { maxFilesPerDir: 3, groupThreshold: 3 });
if (noiseFiles.length > 0) {
    console.log('⚠️ Found potentially superfluous files/directories:');
}
fs.writeFileSync('noise.txt', output);

module.exports = { findNoiseFiles, formatNoiseOutput, detectNoiseFiles, reloadIgnorePatterns, loadIgnorePatterns };