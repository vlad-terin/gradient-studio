/**
 * Gradient Studio MCP Server
 * 
 * A simple JSON-RPC server that exposes gradient generation tools
 * for AI agents via stdio.
 * 
 * Usage:
 *   npm run mcp
 * 
 * Tools exposed:
 *   - generate_gradient: Generate a gradient with specified parameters
 *   - list_modes: List all available gradient modes
 *   - list_palettes: List predefined color palettes
 */

// Gradient configuration from the main app
const shaderConfigs = {
  meshGradient: {
    name: 'Mesh Gradient',
    defaultParams: {
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      distortion: 0.5,
      swirl: 0.3,
      grainMixer: 0.2,
      grainOverlay: 0.1,
      speed: 0.5,
      scale: 1,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: true,
    hasSwirl: true,
    hasScale: true,
  },
  dotOrbit: {
    name: 'Dot Orbit',
    defaultParams: {
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
      dotCount: 20,
      dotSize: 0.4,
      spacing: 2.5,
      speed: 0.8,
      orbitSpeed: 1.2,
      chaos: 0.3,
      scale: 1,
    },
    hasColors: true,
    hasSpeed: true,
    hasScale: true,
  },
  dotGrid: {
    name: 'Dot Grid',
    defaultParams: {
      colors: ['#ffffff', '#cccccc'],
      shape: 'circle',
      spacing: 20,
      dotSize: 0.5,
      speed: 0.3,
      scale: 1,
    },
    hasColors: true,
    hasSpeed: true,
    hasScale: true,
  },
  warp: {
    name: 'Warp',
    defaultParams: {
      colors: ['#ee9ca7', '#ffdde1', '#8ec5fc', '#e0c3fc'],
      pattern: 'checks',
      distortion: 0.6,
      swirl: 0.4,
      softness: 0.5,
      speed: 0.7,
      scale: 1,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: true,
    hasSwirl: true,
    hasScale: true,
  },
  halftone: {
    name: 'Halftone',
    defaultParams: {
      colors: ['#000000', '#ffffff'],
      type: 'standard',
      grid: 'square',
      scale: 1,
      dotSize: 0.5,
      contrast: 0.5,
      speed: 0.5,
    },
    hasColors: true,
    hasSpeed: true,
    hasScale: true,
  },
  heatmap: {
    name: 'Heatmap',
    defaultParams: {
      colors: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'],
      speed: 0.6,
      intensity: 0.7,
      scale: 1,
    },
    hasColors: true,
    hasSpeed: true,
    hasScale: true,
  },
  liquidMetal: {
    name: 'Liquid Metal',
    defaultParams: {
      shape: 'sphere',
      speed: 0.8,
      reflection: 0.6,
      distortion: 0.4,
      scale: 1,
    },
    hasSpeed: true,
    hasDistortion: true,
    hasScale: true,
  },
  grainGradient: {
    name: 'Grain Gradient',
    defaultParams: {
      colors: ['#ff9a9e', '#fecfef', '#a18cd1', '#fbc2eb'],
      shape: 'linear',
      grainAmount: 0.3,
      speed: 0.5,
      scale: 1,
    },
    hasColors: true,
    hasSpeed: true,
    hasScale: true,
  },
  staticMeshGradient: {
    name: 'Static Mesh Gradient',
    defaultParams: {
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
      distortion: 0.3,
      swirl: 0.2,
      grainMixer: 0.1,
      grainOverlay: 0.05,
      scale: 1,
    },
    hasColors: true,
    hasDistortion: true,
    hasSwirl: true,
    hasScale: true,
  },
  staticRadialGradient: {
    name: 'Static Radial Gradient',
    defaultParams: {
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      focalX: 0.5,
      focalY: 0.5,
      radius: 1,
      grainMixer: 0.1,
      grainOverlay: 0.05,
      scale: 1,
    },
    hasColors: true,
    hasScale: true,
  },
};

const colorPalettes = {
  sunset: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'],
  ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#03045e'],
  forest: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
  neon: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'],
  pastel: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff'],
  monochrome: ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff'],
  fire: ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00'],
  aurora: ['#00ff87', '#60efff', '#ff00ff', '#bd00ff', '#00ff00'],
};

// Helper functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function generateCSSGradient(colors, mode) {
  const cssColors = colors.map(c => {
    const rgb = hexToRgb(c);
    if (rgb) {
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    return c;
  });

  switch (mode) {
    case 'grainGradient':
    case 'staticRadialGradient':
      return `radial-gradient(circle at 50% 50%, ${cssColors.join(', ')})`;
    case 'dotGrid':
    case 'dotOrbit':
      return `linear-gradient(135deg, ${cssColors[0]}, ${cssColors[1] || cssColors[0]})`;
    default:
      return `conic-gradient(from 0deg at 50% 50%, ${cssColors.join(', ')})`;
  }
}

function generateSVG(params) {
  const { colors, mode, width, height } = params;
  
  let gradientDef = '';
  let backgroundStyle = '';
  
  switch (mode) {
    case 'staticRadialGradient':
    case 'grainGradient':
      const stops = colors.map((c, i) => {
        const pct = (i / (colors.length - 1)) * 100;
        return `<stop offset="${pct}%" stop-color="${c}" />`;
      }).join('\n        ');
      gradientDef = `
    <radialGradient id="grad" cx="50%" cy="50%" r="50%">
        ${stops}
    </radialGradient>`;
      backgroundStyle = 'url(#grad)';
      break;
      
    default:
      const meshStops = colors.map((c) => {
        return `<stop offset="0%" stop-color="${c}" />`;
      }).join('\n        ');
      gradientDef = `
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        ${meshStops}
    </linearGradient>`;
      backgroundStyle = 'url(#grad)';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${gradientDef}
    </defs>
    <rect width="100%" height="100%" fill="${backgroundStyle}" />
</svg>`;
}

function generateGradient(params) {
  const {
    colors = shaderConfigs.meshGradient.defaultParams.colors,
    mode = 'meshGradient',
    speed = 0.5,
    scale = 1,
    distortion = 0.5,
    swirl = 0.3,
    width = 800,
    height = 600,
    outputFormat = 'json',
  } = params;

  const config = shaderConfigs[mode];
  const result = {
    success: true,
    gradient: {
      colors,
      mode,
      params: {
        speed,
        scale,
        distortion,
        swirl,
        ...(config?.defaultParams || {}),
      },
      dimensions: { width, height },
    },
    css: {
      background: generateCSSGradient(colors, mode),
      backgroundImage: generateCSSGradient(colors, mode),
    },
    svg: generateSVG({ colors, mode, width, height }),
    metadata: {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      description: `A ${config?.name || mode} gradient with ${colors.length} colors`,
    },
  };

  // Format output
  switch (outputFormat) {
    case 'css':
      return {
        success: true,
        css: result.css.background,
      };
    case 'svg':
      return {
        success: true,
        svg: result.svg,
      };
    default:
      return result;
  }
}

// JSON-RPC request handler
function handleRequest(request) {
  const { jsonrpc, id, method, params } = request;

  try {
    let result;

    switch (method) {
      case 'generate_gradient':
        result = generateGradient(params || {});
        break;

      case 'list_modes':
        result = {
          modes: Object.entries(shaderConfigs).map(([key, config]) => ({
            id: key,
            name: config.name,
            hasColors: config.hasColors,
            hasSpeed: config.hasSpeed,
            hasDistortion: config.hasDistortion,
            hasSwirl: config.hasSwirl,
            hasScale: config.hasScale,
            defaultParams: config.defaultParams,
          })),
        };
        break;

      case 'list_palettes':
        result = { palettes: colorPalettes };
        break;

      case 'initialize':
        result = {
          protocolVersion: '1.0',
          serverInfo: {
            name: 'gradient-studio',
            version: '0.1.0',
          },
          capabilities: {
            tools: {},
          },
        };
        break;

      case 'tools/list':
        result = {
          tools: [
            {
              name: 'generate_gradient',
              description: 'Generate a gradient with specified colors, mode, and parameters. Returns JSON with gradient configuration, CSS, and SVG representations.',
              inputSchema: {
                type: 'object',
                properties: {
                  colors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of hex color codes',
                    default: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
                  },
                  mode: {
                    type: 'string',
                    enum: Object.keys(shaderConfigs),
                    description: 'The gradient mode/shader type',
                    default: 'meshGradient',
                  },
                  speed: {
                    type: 'number',
                    description: 'Animation speed (0-2)',
                    default: 0.5,
                  },
                  scale: {
                    type: 'number',
                    description: 'Scale factor',
                    default: 1,
                  },
                  distortion: {
                    type: 'number',
                    description: 'Distortion amount (0-1)',
                    default: 0.5,
                  },
                  swirl: {
                    type: 'number',
                    description: 'Swirl amount (0-1)',
                    default: 0.3,
                  },
                  width: {
                    type: 'number',
                    description: 'Output width in pixels',
                    default: 800,
                  },
                  height: {
                    type: 'number',
                    description: 'Output height in pixels',
                    default: 600,
                  },
                  outputFormat: {
                    type: 'string',
                    enum: ['json', 'css', 'svg'],
                    description: 'Output format',
                    default: 'json',
                  },
                },
              },
            },
            {
              name: 'list_modes',
              description: 'List all available gradient modes with their descriptions and supported parameters.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'list_palettes',
              description: 'List all predefined color palettes that can be used with the generate_gradient tool.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
          ],
        };
        break;

      case 'tools/call':
        const { name, arguments: args } = params;
        switch (name) {
          case 'generate_gradient':
            result = generateGradient(args || {});
            break;
          case 'list_modes':
            result = {
              modes: Object.entries(shaderConfigs).map(([key, config]) => ({
                id: key,
                name: config.name,
                hasColors: config.hasColors,
                hasSpeed: config.hasSpeed,
                hasDistortion: config.hasDistortion,
                hasSwirl: config.hasSwirl,
                hasScale: config.hasScale,
                defaultParams: config.defaultParams,
              })),
            };
            break;
          case 'list_palettes':
            result = { palettes: colorPalettes };
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    return { jsonrpc: '2.0', id, result };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message: error.message,
      },
    };
  }
}

// Read stdin and process requests
let buffer = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  
  // Try to parse complete JSON-RPC messages
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);
    
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        const response = handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (e) {
        // Ignore parse errors for incomplete messages
      }
    }
  }
});

process.stderr.write('Gradient Studio MCP Server running on stdio\n');
