# Gradient Studio - Agent CLI & API Documentation

A CLI tool and API for generating gradients programmatically. Designed for AI agents to integrate gradient generation into their workflows.

## Table of Contents

- [CLI Usage](#cli-usage)
- [API Endpoint](#api-endpoint)
- [MCP Server](#mcp-server)
- [Examples](#examples)

---

## CLI Usage

### Installation

```bash
# Clone and install dependencies
cd gradient-studio
npm install

# Run CLI directly
node src/cli.ts --help
```

### Basic Usage

```bash
# Generate a gradient with custom colors
node src/cli.ts --colors "#ff0000,#00ff00" --mode meshGradient --output json

# Generate CSS output
node src/cli.ts --colors "#667eea,#764ba2" --mode grainGradient --output css

# Generate with animation
node src/cli.ts --mode dotOrbit --speed 1.2 --output json
```

### Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--colors` | `-c` | Comma-separated hex colors | `#ff6b6b,#4ecdc4,#45b7d1,#96ceb4,#ffeaa7` |
| `--mode` | `-m` | Gradient mode | `meshGradient` |
| `--output` | `-o` | Output format: `json`, `css`, `png` | `json` |
| `--speed` | `-s` | Animation speed (0-2) | `0.5` |
| `--scale` | | Scale factor | `1` |
| `--distortion` | | Distortion amount (0-1) | `0.5` |
| `--swirl` | | Swirl amount (0-1) | `0.3` |
| `--width` | | Output width in pixels | `800` |
| `--height` | | Output height in pixels | `600` |
| `--help` | `-h` | Show help | |
| `--version` | `-v` | Show version | |

### Available Gradient Modes

- `meshGradient` - Animated mesh gradient
- `dotOrbit` - Orbiting dots
- `dotGrid` - Grid of dots
- `warp` - Warped pattern
- `halftone` - Halftone dots
- `halftoneCmyk` - CMYK halftone
- `heatmap` - Heatmap visualization
- `liquidMetal` - Liquid metal effect
- `grainGradient` - Grainy gradient
- `staticMeshGradient` - Static mesh gradient
- `staticRadialGradient` - Static radial gradient

---

## API Endpoint

### POST /api/generate

Generate a gradient with specified parameters.

**Request:**

```json
{
  "colors": ["#ff6b6b", "#4ecdc4", "#45b7d1"],
  "mode": "meshGradient",
  "speed": 0.5,
  "scale": 1,
  "distortion": 0.5,
  "swirl": 0.3,
  "width": 800,
  "height": 600,
  "palette": "sunset",
  "outputFormat": "json"
}
```

**Response:**

```json
{
  "success": true,
  "gradient": {
    "colors": ["#ff6b6b", "#4ecdc4", "#45b7d1"],
    "mode": "meshGradient",
    "params": {
      "speed": 0.5,
      "scale": 1,
      "distortion": 0.5,
      "swirl": 0.3
    },
    "dimensions": { "width": 800, "height": 600 }
  },
  "css": {
    "background": "conic-gradient(from 0deg at 50% 50%, rgb(255, 107, 107), rgb(78, 205, 196), rgb(69, 183, 209))"
  },
  "svg": "<svg>...</svg>",
  "metadata": {
    "version": "0.1.0",
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "description": "A Mesh Gradient gradient with 3 colors"
  }
}
```

### Query Parameters (GET)

- `mode` - Filter by mode
- `palette` - Filter by palette

Returns available modes and palettes.

### Available Palettes

| Palette | Colors |
|---------|--------|
| `sunset` | #ff6b6b, #feca57, #ff9ff3, #54a0ff, #5f27cd |
| `ocean` | #0077b6, #00b4d8, #90e0ef, #caf0f8, #03045e |
| `forest` | #2d6a4f, #40916c, #52b788, #74c69d, #95d5b2 |
| `neon` | #f72585, #7209b7, #3a0ca3, #4361ee, #4cc9f0 |
| `pastel` | #ffadad, #ffd6a5, #fdffb6, #caffbf, #9bf6ff |
| `monochrome` | #000000, #333333, #666666, #999999, #cccccc, #ffffff |
| `fire` | #ff0000, #ff3300, #ff6600, #ff9900, #ffcc00 |
| `aurora` | #00ff87, #60efff, #ff00ff, #bd00ff, #00ff00 |

---

## MCP Server

Expose gradient generation as Model Context Protocol tools.

### Starting the MCP Server

```bash
npm run mcp
```

### Available Tools

#### generate_gradient

Generate a gradient with specified colors, mode, and parameters.

```typescript
{
  name: 'generate_gradient',
  arguments: {
    colors?: string[],      // Array of hex colors
    mode?: string,          // Gradient mode
    speed?: number,         // Animation speed (0-2)
    scale?: number,         // Scale factor
    distortion?: number,   // Distortion (0-1)
    swirl?: number,        // Swirl (0-1)
    width?: number,        // Output width
    height?: number,       // Output height
    outputFormat?: 'json' | 'css' | 'svg'
  }
}
```

#### list_modes

List all available gradient modes.

#### list_palettes

List all predefined color palettes.

---

## Examples

### OpenClaw

```typescript
// Using the CLI via exec tool
const gradient = await exec({
  command: 'node src/cli.ts --colors "#ff6b6b,#4ecdc4" --mode meshGradient --output json'
});

// Parse the result
const { css, svg } = JSON.parse(gradient);

// Use in your app
<div style={{ background: css }} />
```

### Codex

```bash
# Direct CLI usage
codex exec --skip-git-repo-check --full-auto -- "Create a gradient with node src/cli.ts --colors '#ff6b6b,#4ecdc4' --output json"
```

### Claude Code

```bash
# Run CLI command
claude --print 'Generate a gradient with node src/cli.ts --colors "#ff6b6b,#4ecdc4" --output json'
```

### cURL (API)

```bash
# Generate gradient via API
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"colors": ["#ff6b6b", "#4ecdc4"], "mode": "meshGradient"}'

# Get available modes
curl http://localhost:3000/api/generate
```

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    colors: ['#ff6b6b', '#4ecdc4'],
    mode: 'meshGradient',
    speed: 0.5,
  }),
});

const { css, svg, gradient } = await response.json();

// Apply to element
element.style.background = css;
```

---

## Notes

- The CLI and API generate gradient configurations that can be used with `@paper-design/shaders-react`
- For animated gradients in a React app, use the shader components directly
- The SVG output is a static representation; for animated effects, use the CSS or integrate the React components
