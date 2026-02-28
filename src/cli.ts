#!/usr/bin/env node

/**
 * Gradient Studio CLI
 * 
 * A CLI tool for generating gradients programmatically.
 * Usage:
 *   npx gradient-studio --colors "#ff0000,#00ff00" --mode mesh --output png
 *   npx gradient-studio --colors "#ff6b6b,#4ecdc4" --mode mesh --output css
 *   npx gradient-studio --colors "#667eea,#764ba2" --mode dotOrbit --output json
 */

import { readFileSync, writeFileSync } from 'fs';
import { stdout } from 'process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple argument parser
function parseArgs(args) {
  const result = {
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
    mode: 'meshGradient',
    output: 'json',
    speed: 0.5,
    scale: 1,
    distortion: 0.5,
    swirl: 0.3,
    width: 800,
    height: 600,
    colorsFromCss: '',
    cssFile: '',
    designSystem: '',
    help: false,
    version: false,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
    // Handle --option=value format
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      switch (key) {
        case '--colors':
        case '-c':
          result.colors = value.split(',').map(c => c.trim());
          break;
        case '--colors-from-css':
        case '--css-tokens':
          result.colorsFromCss = value;
          break;
        case '--css-file':
        case '--css':
          result.cssFile = value;
          break;
        case '--design-system':
        case '--ds':
          result.designSystem = value;
          break;
        case '--mode':
        case '-m':
          result.mode = value;
          break;
        case '--output':
        case '-o':
          result.output = value.toLowerCase();
          break;
        case '--speed':
        case '-s':
          result.speed = parseFloat(value);
          break;
        case '--scale':
          result.scale = parseFloat(value);
          break;
        case '--distortion':
          result.distortion = parseFloat(value);
          break;
        case '--swirl':
          result.swirl = parseFloat(value);
          break;
        case '--width':
          result.width = parseInt(value);
          break;
        case '--height':
          result.height = parseInt(value);
          break;
      }
      continue;
    }

    const next = args[i + 1];

    switch (arg) {
      case '--colors':
      case '-c':
        if (next) {
          // Collect all args until we hit a flag
          const colors = [];
          for (let j = i + 1; j < args.length; j++) {
            if (args[j].startsWith('-') && !args[j].startsWith('#')) break;
            colors.push(args[j]);
          }
          if (colors.length > 0) {
            result.colors = colors.join(',').split(',').map(c => c.trim());
            i += colors.length;
          }
        }
        break;
      case '--colors-from-css':
      case '--css-tokens':
        if (next) {
          // Collect all args until we hit a flag
          const tokens = [];
          for (let j = i + 1; j < args.length; j++) {
            if (args[j].startsWith('-')) break;
            tokens.push(args[j]);
          }
          if (tokens.length > 0) {
            result.colorsFromCss = tokens.join(' ');
            i += tokens.length;
          }
        }
        break;
      case '--design-system':
      case '--ds':
        if (next) {
          // Could be "blue" or "blue:100-900"
          const dsParts = [];
          for (let j = i + 1; j < args.length; j++) {
            if (args[j].startsWith('-')) break;
            dsParts.push(args[j]);
          }
          if (dsParts.length > 0) {
            result.designSystem = dsParts.join(' ');
            i += dsParts.length;
          }
        }
        break;
      case '--mode':
      case '-m':
        if (next && !next.startsWith('--')) {
          result.mode = next;
          i++;
        }
        break;
      case '--output':
      case '-o':
        if (next && !next.startsWith('--')) {
          result.output = next.toLowerCase();
          i++;
        }
        break;
      case '--speed':
      case '-s':
        if (next && !next.startsWith('--')) {
          result.speed = parseFloat(next);
          i++;
        }
        break;
      case '--scale':
        if (next && !next.startsWith('--')) {
          result.scale = parseFloat(next);
          i++;
        }
        break;
      case '--distortion':
        if (next && !next.startsWith('--')) {
          result.distortion = parseFloat(next);
          i++;
        }
        break;
      case '--swirl':
        if (next && !next.startsWith('--')) {
          result.swirl = parseFloat(next);
          i++;
        }
        break;
      case '--width':
        if (next && !next.startsWith('--')) {
          result.width = parseInt(next);
          i++;
        }
        break;
      case '--height':
        if (next && !next.startsWith('--')) {
          result.height = parseInt(next);
          i++;
        }
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--version':
      case '-v':
        result.version = true;
        break;
    }
  }

  return result;
}

function showHelp() {
  const help = `
Gradient Studio CLI v0.1.0

A CLI tool for generating gradients programmatically.

Usage:
  gradient-studio [options]

Options:
  -c, --colors <colors>    Comma-separated list of hex colors (default: "#ff6b6b,#4ecdc4,#45b7d1,#96ceb4,#ffeaa7")
  --colors-from-css=<tokens> 
                          Parse colors from CSS custom properties
                          Format: --colors-from-css="--blue-1,#fdfdfe --blue-9,#3d63dd"
                          Note: Use = syntax when values start with --
  --css-file=<path>        Read colors from a CSS file with custom properties
                          Extracts all --token: #hex values from :root {}
  --design-system=<name>   Use built-in design system colors
                          Format: --design-system=blue:100-900
                          Available: blue, slate, emerald, rose, violet, amber, cyan, fuchsia
  -m, --mode <mode>        Gradient mode (default: meshGradient)
                          Available modes:
                            - meshGradient
                            - dotOrbit
                            - dotGrid
                            - warp
                            - halftone
                            - halftoneCmyk
                            - heatmap
                            - liquidMetal
                            - grainGradient
                            - staticMeshGradient
                            - staticRadialGradient
  -o, --output <format>   Output format: png, css, json (default: json)
  -s, --speed <value>     Animation speed 0-2 (default: 0.5)
  --scale <value>         Scale factor (default: 1)
  --distortion <value>    Distortion amount 0-1 (default: 0.5)
  --swirl <value>         Swirl amount 0-1 (default: 0.3)
  --width <pixels>        Output width (default: 800)
  --height <pixels>       Output height (default: 600)
  -h, --help              Show this help message
  -v, --version           Show version number

Examples:
  # Generate a mesh gradient with custom colors
  gradient-studio --colors "#ff0000,#00ff00" --mode meshGradient --output json

  # Generate CSS output
  gradient-studio --colors "#667eea,#764ba2" --mode grainGradient --output css

  # Generate with animation
  gradient-studio --mode dotOrbit --speed 1.2 --output json

  # Use design system colors (use = syntax)
  gradient-studio --design-system=blue:100-900 --output css
  gradient-studio --ds=violet --mode grainGradient --output json

  # Parse CSS custom properties (use = syntax when values start with --)
  gradient-studio --colors-from-css="--blue-1,#fdfdfe --blue-9,#3d63dd"
  gradient-studio --css-tokens="100:#fdfdfe 500:#3d63dd 900:#1e3a8a"

  # Read colors from a CSS file
  gradient-studio --css-file=./tokens.css --output json

  # Output to file
  gradient-studio --colors "#ff6b6b,#4ecdc4" --output json > gradient.json

For more information, visit: https://github.com/gradient-studio/cli
`;
  console.log(help);
}

function showVersion() {
  console.log('Gradient Studio CLI v0.1.0');
}

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Built-in design system tokens
const designSystems = {
  // Tailwind CSS-like blue scale
  blue: {
    name: 'Blue',
    tokens: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
  // Slate
  slate: {
    name: 'Slate',
    tokens: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },
  // Emerald
  emerald: {
    name: 'Emerald',
    tokens: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
  },
  // Rose
  rose: {
    name: 'Rose',
    tokens: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
      950: '#4c0519',
    },
  },
  // Violet
  violet: {
    name: 'Violet',
    tokens: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
  },
  // Amber
  amber: {
    name: 'Amber',
    tokens: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
  },
  // Cyan
  cyan: {
    name: 'Cyan',
    tokens: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
    },
  },
  // Fuchsia
  fuchsia: {
    name: 'Fuchsia',
    tokens: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e',
    },
  },
  // Custom user-defined prefix (for --colors-from-css)
  custom: {
    name: 'Custom',
    tokens: {},
  },
};

// Parse CSS custom properties from string
// Format: "--blue-1,#fdfdfe --blue-9,#3d63dd" or "token:hex token:hex"
function parseCssTokens(input) {
  const tokens = {};
  const pairs = input.split(/\s+/);
  
  for (const pair of pairs) {
    // Match format: --token-name,#hex or token-name,#hex or token:hex
    const match = pair.match(/^--?([a-zA-Z0-9-]+),?(.+)$/);
    if (match) {
      const [, name, value] = match;
      // Check if value is a hex color
      if (value.match(/^#?[0-9a-fA-F]{3,6}$/)) {
        const hex = value.startsWith('#') ? value : `#${value}`;
        tokens[name] = hex;
      }
    }
  }
  
  return tokens;
}

// Parse CSS file and extract custom properties
function parseCssFile(cssContent) {
  const tokens = {};
  
  // Match :root or html { ... } blocks
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/i) || 
                    cssContent.match(/html\s*\{([^}]+)\}/i) ||
                    cssContent.match(/\[data-theme[^\]]*\]\s*\{([^}]+)\}/i);
  
  const blockContent = rootMatch ? rootMatch[1] : cssContent;
  
  // Match --token: value; or --token: value;
  const tokenRegex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+)/g;
  let match;
  
  while ((match = tokenRegex.exec(blockContent)) !== null) {
    const [, name, value] = match;
    const trimmedValue = value.trim();
    
    // Check if it's a hex color
    if (trimmedValue.match(/^#[0-9a-fA-F]{3,6}$/)) {
      tokens[name] = trimmedValue;
    }
    // Check for rgb/rgba
    else if (trimmedValue.match(/^rgba?\(/i)) {
      tokens[name] = trimmedValue;
    }
  }
  
  return tokens;
}

// Get colors from design system
function getColorsFromDesignSystem(designSystemName, tokenRange = null) {
  const ds = designSystems[designSystemName.toLowerCase()];
  
  if (!ds) {
    // Try to find partial match
    const matches = Object.keys(designSystems).filter(k => 
      k.includes(designSystemName.toLowerCase()) || 
      designSystems[k].name.toLowerCase().includes(designSystemName.toLowerCase())
    );
    
    if (matches.length > 0) {
      return getColorsFromDesignSystem(matches[0], tokenRange);
    }
    return null;
  }
  
  let colors = [];
  const tokens = ds.tokens;
  
  if (tokenRange) {
    // Format: "1-12" or "50-900" or "1,5,9"
    if (tokenRange.includes('-')) {
      const [start, end] = tokenRange.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        if (tokens[i]) colors.push(tokens[i]);
      }
    } else if (tokenRange.includes(',')) {
      const indices = tokenRange.split(',').map(Number);
      colors = indices.map(i => tokens[i]).filter(Boolean);
    }
  } else {
    // Default: use mid-range tokens (roughly 100-700)
    const defaultIndices = [100, 200, 300, 400, 500, 600, 700];
    colors = defaultIndices.map(i => tokens[i]).filter(Boolean);
  }
  
  return colors.length > 0 ? colors : null;
}

// Expand token references to actual colors
// e.g., ["--blue-100", "--blue-500", "--blue-900"] with tokens { "--blue-100": "#...", ... }
function expandTokenReferences(colors, tokens) {
  return colors.map(c => {
    // Check if it's a token reference
    if (c.startsWith('--') && tokens[c]) {
      return tokens[c];
    }
    // Check if it's a direct token name without --
    if (tokens[`--${c}`]) {
      return tokens[`--${c}`];
    }
    // Check if it's a number that might be an index
    const num = parseInt(c);
    if (!isNaN(num) && tokens[num]) {
      return tokens[num];
    }
    // Return as-is (might be a direct hex color)
    return c;
  });
}

// Generate CSS gradient from colors
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
      // meshGradient, warp, etc - use a conic gradient for visual interest
      return `conic-gradient(from 0deg at 50% 50%, ${cssColors.join(', ')})`;
  }
}

// Generate SVG from gradient params
function generateSVG(params) {
  const { colors, mode, width, height, speed, scale, distortion, swirl } = params;
  
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
      
    default: // meshGradient, warp, etc
      const meshStops = colors.map((c, i) => {
        const angle = (i / colors.length) * 360;
        return `<stop offset="0%" stop-color="${c}" />`;
      }).join('\n        ');
      gradientDef = `
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        ${meshStops}
    </linearGradient>`;
      backgroundStyle = 'url(#grad)';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${gradientDef}
    </defs>
    <rect width="100%" height="100%" fill="${backgroundStyle}" />
</svg>`;

  return svg;
}

// Generate gradient configuration object
function generateGradientConfig(params) {
  const { colors, mode, speed, scale, distortion, swirl, width, height } = params;
  
  return {
    success: true,
    gradient: {
      colors,
      mode,
      params: {
        speed,
        scale,
        distortion,
        swirl,
      },
      dimensions: {
        width,
        height,
      },
    },
    // CSS output
    css: {
      background: generateCSSGradient(colors, mode),
      backgroundImage: generateCSSGradient(colors, mode),
    },
    // SVG representation
    svg: generateSVG(params),
    // Metadata
    metadata: {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      description: `A ${mode} gradient with ${colors.length} colors`,
    },
  };
}

function generatePNGPlaceholder(params) {
  // For actual PNG generation, you'd use a canvas library
  // This returns a data URL that represents the gradient
  const { colors, width, height } = params;
  
  // Create a simple SVG data URL as a placeholder
  const svg = generateSVG(params);
  const base64 = Buffer.from(svg).toString('base64');
  
  return {
    success: true,
    format: 'svg-as-png-placeholder',
    dataUrl: `data:image/svg+xml;base64,${base64}`,
    note: 'For true PNG output, use the API endpoint with canvas rendering',
    gradient: generateGradientConfig(params),
  };
}

// Main function
function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.version) {
    showVersion();
    process.exit(0);
  }

  // Validate mode
  const validModes = [
    'meshGradient', 'dotOrbit', 'dotGrid', 'warp', 'halftone',
    'halftoneCmyk', 'heatmap', 'liquidMetal', 'grainGradient',
    'staticMeshGradient', 'staticRadialGradient'
  ];
  
  if (!validModes.includes(args.mode)) {
    console.error(`Error: Invalid mode "${args.mode}"`);
    console.log(`Valid modes: ${validModes.join(', ')}`);
    process.exit(1);
  }

  // Handle design system colors
  let finalColors = args.colors;
  let tokensUsed = null;

  if (args.designSystem) {
    // Parse design system name and optional range
    // Format: "blue:100-900" or "blue" or "blue,1,5,9"
    const [dsName, range] = args.designSystem.split(':');
    const dsColors = getColorsFromDesignSystem(dsName, range || '100-700');
    
    if (dsColors) {
      finalColors = dsColors;
      console.error(`Using design system "${dsName}" with ${finalColors.length} colors`);
    } else {
      console.error(`Error: Unknown design system "${dsName}". Available: ${Object.keys(designSystems).filter(k => k !== 'custom').join(', ')}`);
      process.exit(1);
    }
  }

  // Handle CSS file
  if (args.cssFile) {
    try {
      const cssContent = readFileSync(args.cssFile, 'utf-8');
      const parsedTokens = parseCssFile(cssContent);
      const tokenNames = Object.keys(parsedTokens);
      
      if (tokenNames.length > 0) {
        tokensUsed = parsedTokens;
        // Sort tokens numerically by extracting the number suffix (e.g., blue-1, blue-2 -> 1, 2)
        tokenNames.sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        finalColors = tokenNames.map(name => parsedTokens[name]);
        console.error(`Parsed ${tokenNames.length} color tokens from CSS file: ${args.cssFile}`);
      } else {
        console.error('Error: No valid color tokens found in CSS file');
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error reading CSS file: ${err.message}`);
      process.exit(1);
    }
  }

  // Handle CSS tokens (inline)
  if (args.colorsFromCss) {
    const parsedTokens = parseCssTokens(args.colorsFromCss);
    const tokenNames = Object.keys(parsedTokens);
    
    if (tokenNames.length > 0) {
      tokensUsed = parsedTokens;
      // Extract colors from tokens in order
      finalColors = tokenNames.map(name => parsedTokens[name]);
      console.error(`Parsed ${tokenNames.length} color tokens from CSS`);
    } else {
      console.error('Error: No valid color tokens found in --colors-from-css');
      process.exit(1);
    }
  }

  // Validate colors
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  for (const color of finalColors) {
    if (!colorRegex.test(color)) {
      console.error(`Error: Invalid color "${color}". Use hex format like #ff0000`);
      process.exit(1);
    }
  }

  // Generate the gradient configuration
  const gradientConfig = generateGradientConfig({
    colors: finalColors,
    mode: args.mode,
    speed: args.speed,
    scale: args.scale,
    distortion: args.distortion,
    swirl: args.swirl,
    width: args.width,
    height: args.height,
  });

  // Add source information to output
  if (tokensUsed || args.designSystem) {
    gradientConfig.source = {
      ...(args.designSystem && { designSystem: args.designSystem }),
      ...(tokensUsed && { cssTokens: tokensUsed }),
    };
  }

  // Output based on format
  switch (args.output) {
    case 'json':
      stdout.write(JSON.stringify(gradientConfig, null, 2));
      break;
      
    case 'css':
      console.log(`/* Gradient Studio - ${args.mode} */
${args.designSystem ? `/* Design System: ${args.designSystem} */` : ''}
${tokensUsed ? `/* CSS Tokens: ${Object.keys(tokensUsed).join(', ')} */` : ''}
.gradient {
  background: ${gradientConfig.css.background};
  background-image: ${gradientConfig.css.backgroundImage};
}`);
      break;
      
    case 'png':
      const pngData = generatePNGPlaceholder({
        colors: finalColors,
        mode: args.mode,
        speed: args.speed,
        scale: args.scale,
        distortion: args.distortion,
        swirl: args.swirl,
        width: args.width,
        height: args.height,
      });
      stdout.write(JSON.stringify(pngData, null, 2));
      break;
      
    default:
      console.error(`Error: Invalid output format "${args.output}"`);
      console.log('Valid formats: json, css, png');
      process.exit(1);
  }
}

main();
