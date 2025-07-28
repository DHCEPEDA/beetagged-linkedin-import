# Build System Configuration

## Available Build Commands

### Squarespace Bundle Build
**Workflow**: `BuildSquarespaceBundle`
**Command**: `npx webpack --config webpack.squarespace.config.js`
**Output**: `dist/beetagged-app-bundle.js` (13.2KB optimized for Squarespace)

### Development Build
**Workflow**: `BuildDevelopment` 
**Command**: `vite build --mode development`
**Output**: `dist-vite/` (Vite development build)

### Development Server
**Workflow**: `ViteDev`
**Command**: `vite dev --host 0.0.0.0 --port 3000`
**Purpose**: Local React development with hot reload

## Build Configurations

### Webpack (Squarespace Bundle)
- **Target**: UMD bundle for Squarespace integration
- **Externals**: React/ReactDOM from CDN
- **Size**: Optimized for production (13.2KB)
- **Output**: Single bundle file ready for upload

### Vite (Development)
- **Target**: Modern ES modules for development
- **HMR**: Hot module replacement enabled
- **Alias**: `@/` points to `src/` directory
- **Port**: 3000 with network access

## Usage Workflow

### For Squarespace Deployment:
1. Run `BuildSquarespaceBundle` workflow
2. Upload `dist/beetagged-app-bundle.js` to Squarespace
3. Upload `src/beetagged-styles.css` to Squarespace
4. Use code block with file URLs

### For Development:
1. Run `ViteDev` workflow for live development
2. Run `BuildDevelopment` for development builds
3. Test locally at `http://localhost:3000`

### For Backend Testing:
1. Run `BeeTaggedServer` workflow (port 5000)
2. APIs available at `http://localhost:5000/api/*`
3. Health check at `http://localhost:5000/health`

## Build Scripts Integration
The build system supports multiple deployment targets:
- **Squarespace**: Optimized bundle for code block integration
- **Vercel/Netlify**: Standard React build for external hosting
- **Development**: Local testing with hot reload

All builds use the same source code with different optimization targets.