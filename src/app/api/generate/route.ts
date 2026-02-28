import { NextRequest, NextResponse } from 'next/server';

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
  halftoneCmyk: {
    name: 'Halftone CMYK',
    defaultParams: {
      type: 'standard',
      scale: 1,
      dotSize: 0.5,
      contrast: 0.5,
      angleC: 15,
      angleM: 75,
      angleY: 0,
      angleK: 45,
      speed: 0.5,
    },
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
  imageDithering: {
    name: 'Image Dithering',
    defaultParams: {
      ditherType: 'floydSteinberg',
      paletteType: 'twoColor',
      colors: ['#000000', '#ffffff'],
      speed: 0.3,
      scale: 1,
    },
    hasColors: true,
    hasSpeed: true,
    hasScale: true,
  },
  paperTexture: {
    name: 'Paper Texture',
    defaultParams: {
      paperType: 'cardboard',
      grainIntensity: 0.5,
      fiberIntensity: 0.3,
      speed: 0.2,
      scale: 1,
    },
    hasSpeed: true,
    hasScale: true,
  },
  flutedGlass: {
    name: 'Fluted Glass',
    defaultParams: {
      distortionShape: 'vertical',
      gridShape: 'regular',
      distortion: 0.5,
      speed: 0.4,
      scale: 1,
    },
    hasSpeed: true,
    hasDistortion: true,
    hasScale: true,
  },
  water: {
    name: 'Water',
    defaultParams: {
      speed: 0.7,
      amplitude: 0.3,
      frequency: 2,
      scale: 1,
    },
    hasSpeed: true,
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
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function generateCSSGradient(colors: string[], mode: string) {
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

function generateSVG(params: { colors: string[]; mode: string; width: number; height: number }) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      colors = shaderConfigs.meshGradient.defaultParams.colors,
      mode = 'meshGradient',
      speed = 0.5,
      scale = 1,
      distortion = 0.5,
      swirl = 0.3,
      width = 800,
      height = 600,
      palette,
      outputFormat = 'json',
    } = body;

    // Validate mode
    if (!shaderConfigs[mode]) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid mode: ${mode}. Valid modes: ${Object.keys(shaderConfigs).join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Use palette if provided
    let finalColors = colors;
    if (palette && colorPalettes[palette]) {
      finalColors = colorPalettes[palette];
    }

    // Validate colors
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    for (const color of finalColors) {
      if (!colorRegex.test(color)) {
        return NextResponse.json(
          { success: false, error: `Invalid color: ${color}. Use hex format like #ff0000` },
          { status: 400 }
        );
      }
    }

    const config = shaderConfigs[mode];
    const result = {
      success: true,
      gradient: {
        colors: finalColors,
        mode,
        params: {
          speed,
          scale,
          distortion,
          swirl,
          ...config.defaultParams,
        },
        dimensions: { width, height },
      },
      css: {
        background: generateCSSGradient(finalColors, mode),
        backgroundImage: generateCSSGradient(finalColors, mode),
      },
      svg: generateSVG({ colors: finalColors, mode, width, height }),
      metadata: {
        version: '0.1.0',
        generatedAt: new Date().toISOString(),
        description: `A ${config.name} gradient with ${finalColors.length} colors`,
      },
    };

    // Format output
    switch (outputFormat) {
      case 'css':
        return NextResponse.json({
          success: true,
          css: result.css.background,
        });
      case 'svg':
        return NextResponse.json({
          success: true,
          svg: result.svg,
        });
      default:
        return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const palette = searchParams.get('palette');
  
  // Return available modes and palettes
  return NextResponse.json({
    availableModes: Object.entries(shaderConfigs).map(([key, config]) => ({
      id: key,
      name: config.name,
      hasColors: config.hasColors,
      hasSpeed: config.hasSpeed,
      hasDistortion: config.hasDistortion,
      hasSwirl: config.hasSwirl,
      hasScale: config.hasScale,
    })),
    availablePalettes: Object.entries(colorPalettes).map(([key, colors]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      colors,
    })),
    example: {
      colors: ['#ff6b6b', '#4ecdc4'],
      mode: 'meshGradient',
      speed: 0.5,
      outputFormat: 'json',
    },
  });
}
