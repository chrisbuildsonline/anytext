const fs = require("fs-extra");
const path = require("path");
const { minify } = require("terser");

const args = process.argv.slice(2);
const isProduction = args.includes("--production");
const isWatch = args.includes("--watch");

const srcDir = "./";
const distDir = "./dist";

// Files to process
const jsFiles = [
  "background.js",
  "popup.js",
  "content-scripts/main.js",
  "content-scripts/context.js"
];

// Files to copy as-is
const staticFiles = [
  "manifest.json",
  "popup.html",
  "styles/toolbar.css",
  "icons/icon-16.png",
  "icons/icon-32.png", 
  "icons/icon-48.png",
  "icons/icon-128.png",
  "icons/icon-large.png",
  "icons/logo.png"
];

async function processJavaScript(filePath) {
  try {
    const fullPath = path.join(srcDir, filePath);
    
    // Check if file exists before processing
    if (!(await fs.pathExists(fullPath))) {
      console.log(`⚠️  Skipping ${filePath} (file not found)`);
      return null;
    }

    const code = await fs.readFile(fullPath, "utf8");

    if (isProduction) {
      console.log(`⚡ Minifying ${filePath}...`);
      // Chrome Web Store approved minification
      const result = await minify(code, {
        compress: {
          drop_console: false, // Keep console for extension debugging
          drop_debugger: true,
          pure_funcs: ["console.debug"],
        },
        mangle: {
          reserved: ["chrome", "browser", "ai"], // Don't mangle Chrome extension and AI APIs
        },
        format: {
          comments: false,
        },
      });
      return result.code || code;
    }

    return code; // Return unprocessed for development
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    try {
      return await fs.readFile(path.join(srcDir, filePath), "utf8"); // Fallback to original
    } catch {
      return null; // File doesn't exist
    }
  }
}

async function build() {
  console.log("🏗️  Building AnyText Extension...");

  // Clean dist directory
  await fs.remove(distDir);
  await fs.ensureDir(distDir);

  // Process JavaScript files
  for (const file of jsFiles) {
    const processed = await processJavaScript(file);
    if (processed !== null) {
      const outputPath = path.join(distDir, file);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, processed);
      console.log(`✅ Processed: ${file}`);
    }
  }

  // Copy static files
  for (const file of staticFiles) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    
    if (await fs.pathExists(srcPath)) {
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(srcPath, destPath);
      console.log(`📋 Copied: ${file}`);
    } else {
      console.log(`⚠️  Skipping ${file} (file not found)`);
    }
  }

  // Update manifest version for production builds
  if (isProduction) {
    const manifestPath = path.join(distDir, "manifest.json");
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath);
      // Generate valid Chrome extension version (max 4 dot-separated numbers, each ≤65536)
      const now = new Date();
      const buildNumber = Math.floor(now.getTime() / 60000) % 65536; // Minutes since epoch, mod 65536
      manifest.version = `1.0.0.${buildNumber}`;
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
      console.log(`📦 Updated version to: ${manifest.version}`);
    }
  }

  // Create ZIP for Chrome Web Store
  if (isProduction) {
    const { execSync } = require("child_process");
    try {
      execSync(`cd dist && zip -r ../anytext-extension.zip .`, {
        stdio: "inherit",
      });
      console.log("📦 Created production ZIP file: anytext-extension.zip");
    } catch (error) {
      console.log("⚠️  Could not create ZIP (install zip command)");
    }
  }

  console.log(`🎉 Build complete! Output in: ${distDir}`);
}

// Watch mode for development
if (isWatch) {
  console.log("👀 Watching for changes...");
  
  const chokidar = require("fs").watch || null;
  if (chokidar) {
    // Simple file watching - rebuild on any change
    const watchFiles = [...jsFiles, ...staticFiles];
    let timeout;
    
    watchFiles.forEach(file => {
      const fullPath = path.join(srcDir, file);
      try {
        fs.watch(fullPath, () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            console.log(`🔄 File changed: ${file}`);
            build().catch(console.error);
          }, 100);
        });
      } catch (error) {
        // File doesn't exist, skip watching
      }
    });
    
    // Initial build
    build().catch(console.error);
  } else {
    console.log("⚠️  Watch mode not available, running single build");
    build().catch(console.error);
  }
} else {
  build().catch(console.error);
}