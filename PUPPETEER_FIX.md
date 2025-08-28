# PDF Export Puppeteer Fix Guide

This guide explains the Puppeteer/Chrome issue with PDF export and the implemented solutions.

## Problem Description

The error "Could not find Chrome (ver. 130.0.7258.138)" occurs when:
1. Puppeteer tries to launch Chrome/Chromium browser for PDF generation
2. Chrome is not installed on the system (common in Docker containers)
3. The path to Chrome executable is incorrect
4. Missing dependencies for running Chrome in headless mode

## Solutions Implemented

### 1. Enhanced Puppeteer Configuration

**Updated `server/exportGenerator.ts`:**
- **Fallback mechanism**: If Puppeteer fails, generates printable HTML with browser conversion instructions
- **Multiple executable paths**: Tries common Chrome/Chromium installation paths
- **Enhanced browser args**: Comprehensive flags for Docker/server environments
- **Better error handling**: Graceful degradation with helpful user instructions

### 2. Docker Container Support

**Updated `Dockerfile` and `Dockerfile.optimized`:**
- **Pre-installed Chromium**: Added `chromium` package to Alpine Linux
- **Required dependencies**: Added `nss`, `freetype`, `harfbuzz`, `ca-certificates`, `ttf-freefont`
- **Environment variables**: Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- **Security**: Runs as non-root user with proper permissions

### 3. Fallback HTML-to-PDF Method

When Puppeteer fails, the system:
1. **Generates printable HTML** with print-optimized CSS
2. **Provides user instructions** for manual PDF conversion
3. **Maintains formatting** with proper page breaks and styles
4. **Works in all browsers** - no server dependencies

## Usage Instructions

### For Docker Deployments

1. **Rebuild containers** with updated Dockerfile:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

2. **Verify Chrome installation** in container:
```bash
docker-compose exec app which chromium-browser
docker-compose exec app chromium-browser --version
```

### For Manual PDF Conversion (Fallback)

When automatic PDF generation fails, users receive an HTML file with instructions:

1. **Open the generated HTML file** in any browser
2. **Press Ctrl+P (Windows/Linux) or Cmd+P (Mac)**
3. **Select "Save as PDF"** as printer destination
4. **Configure settings:**
   - Paper size: A4 or Letter
   - Margins: 1 inch all sides
   - Include background graphics: ✅ Enabled
5. **Save the PDF file**

## Technical Details

### Puppeteer Arguments
```javascript
args: [
  '--no-sandbox',                    // Required for Docker
  '--disable-setuid-sandbox',        // Security for containers
  '--disable-dev-shm-usage',         // Memory optimization
  '--disable-gpu',                   // Headless operation
  '--disable-web-security',          // PDF generation
  '--run-all-compositor-stages-before-draw',
  // ... additional stability flags
]
```

### Chrome Executable Paths Checked
1. `/usr/bin/chromium-browser` (Alpine Linux)
2. `/usr/bin/google-chrome` (Ubuntu/Debian)
3. `/opt/google/chrome/chrome` (CentOS/RHEL)
4. `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (macOS)

### Environment Variables
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` - Don't download Chrome during npm install
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` - Use system Chrome

## Testing PDF Export

### Test in Development
```bash
# Start the application
npm run dev

# Test PDF export through the UI
# Navigate to Export step and try PDF export
```

### Test in Docker
```bash
# Build and run containers
docker-compose up --build -d

# Check Chrome installation
docker-compose exec app chromium-browser --version

# Test PDF export through the application
```

### Verify Export Directory
```bash
# Check if files are generated
ls -la exports/

# In Docker container
docker-compose exec app ls -la exports/
```

## Troubleshooting

### Common Issues

1. **Permission errors in Docker:**
```bash
# Ensure proper ownership
docker-compose exec app chown -R node:node exports/
```

2. **Chrome not found:**
```bash
# Install Chrome/Chromium manually
apk add chromium  # Alpine
apt-get install chromium-browser  # Ubuntu/Debian
```

3. **Memory issues:**
```bash
# Increase Docker memory limit
# Add to docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 2G
```

4. **Fallback HTML not working:**
- Check if `exports/` directory exists and is writable
- Verify template styles are being applied correctly
- Ensure markdown content is being processed

### Log Analysis

Check application logs for PDF generation:
```bash
# Docker logs
docker-compose logs app

# Look for:
# - "Puppeteer PDF generation failed"
# - "attempting fallback method"
# - Chrome executable path messages
```

## Browser Compatibility

The fallback HTML method works with:
- ✅ Chrome/Chromium (all versions)
- ✅ Firefox (recent versions)
- ✅ Safari (macOS/iOS)
- ✅ Edge (modern versions)
- ✅ Mobile browsers with print capability

## Security Considerations

1. **Non-root execution**: Docker containers run as `node` user
2. **Sandbox disabled**: Required for Docker but isolated environment
3. **No external network**: PDF generation doesn't require internet access
4. **File permissions**: Export directory has proper access controls

---

This implementation ensures PDF export works reliably across all deployment environments while providing user-friendly fallbacks when automated generation fails.