'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import {
  MeshGradient,
  DotOrbit,
  DotGrid,
  Warp,
  HalftoneDots,
  HalftoneCmyk,
  Heatmap,
  LiquidMetal,
  ImageDithering,
  PaperTexture,
  FlutedGlass,
  Water,
  GrainGradient,
  StaticMeshGradient,
  StaticRadialGradient,
} from '@paper-design/shaders-react';
import { ShaderSizingParams, ShaderMotionParams } from '@paper-design/shaders';

// Types for saved gradients
interface SavedGradient {
  id: string;
  shaderType: ShaderType;
  params: Record<string, any>;
  name: string;
  createdAt: number;
  likes: number;
}

// Local storage helpers
const STORAGE_KEYS = {
  SAVED_GRADIENTS: 'gradient-studio-saved',
  LIKED_IDS: 'gradient-studio-liked',
};

function getSavedGradients(): SavedGradient[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEYS.SAVED_GRADIENTS);
  return saved ? JSON.parse(saved) : [];
}

function saveGradient(gradient: SavedGradient): void {
  const existing = getSavedGradients();
  const updated = [gradient, ...existing];
  localStorage.setItem(STORAGE_KEYS.SAVED_GRADIENTS, JSON.stringify(updated));
}

function removeGradient(id: string): void {
  const existing = getSavedGradients();
  const updated = existing.filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVED_GRADIENTS, JSON.stringify(updated));
}

function getLikedIds(): string[] {
  if (typeof window === 'undefined') return [];
  const liked = localStorage.getItem(STORAGE_KEYS.LIKED_IDS);
  return liked ? JSON.parse(liked) : [];
}

function toggleLike(id: string): boolean {
  const liked = getLikedIds();
  const isLiked = liked.includes(id);
  
  if (isLiked) {
    const updated = liked.filter(likedId => likedId !== id);
    localStorage.setItem(STORAGE_KEYS.LIKED_IDS, JSON.stringify(updated));
    return false;
  } else {
    const updated = [...liked, id];
    localStorage.setItem(STORAGE_KEYS.LIKED_IDS, JSON.stringify(updated));
    return true;
  }
}

function updateLikes(id: string, delta: number): void {
  const existing = getSavedGradients();
  const updated = existing.map(g => 
    g.id === id ? { ...g, likes: g.likes + delta } : g
  );
  localStorage.setItem(STORAGE_KEYS.SAVED_GRADIENTS, JSON.stringify(updated));
}

// Shader type definitions
type ShaderType = 
  | 'meshGradient'
  | 'dotOrbit'
  | 'dotGrid'
  | 'warp'
  | 'halftone'
  | 'halftoneCmyk'
  | 'heatmap'
  | 'liquidMetal'
  | 'imageDithering'
  | 'paperTexture'
  | 'flutedGlass'
  | 'water'
  | 'grainGradient'
  | 'staticMeshGradient'
  | 'staticRadialGradient';

interface ShaderConfig {
  name: string;
  component: React.FC<any>;
  defaultParams: Record<string, any>;
  hasColors: boolean;
  hasSpeed: boolean;
  hasDistortion: boolean;
  hasSwirl: boolean;
  hasScale: boolean;
  hasGrain: boolean;
  params: string[];
}

// Common sizing params
const defaultSizing: ShaderSizingParams = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  fit: 'contain',
};

// Shader configurations
const shaderConfigs: Record<ShaderType, ShaderConfig> = {
  meshGradient: {
    name: 'Mesh Gradient',
    component: MeshGradient,
    defaultParams: {
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      distortion: 0.5,
      swirl: 0.3,
      grainMixer: 0.2,
      grainOverlay: 0.1,
      speed: 0.5,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: true,
    hasSwirl: true,
    hasScale: true,
    hasGrain: true,
    params: ['distortion', 'swirl', 'grainMixer', 'grainOverlay'],
  },
  dotOrbit: {
    name: 'Dot Orbit',
    component: DotOrbit,
    defaultParams: {
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
      dotCount: 20,
      dotSize: 0.4,
      spacing: 2.5,
      speed: 0.8,
      orbitSpeed: 1.2,
      chaos: 0.3,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['dotCount', 'dotSize', 'spacing', 'orbitSpeed', 'chaos'],
  },
  dotGrid: {
    name: 'Dot Grid',
    component: DotGrid,
    defaultParams: {
      colors: ['#ffffff', '#cccccc'],
      shape: 'circle',
      spacing: 20,
      dotSize: 0.5,
      speed: 0.3,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['shape', 'spacing', 'dotSize'],
  },
  warp: {
    name: 'Warp',
    component: Warp,
    defaultParams: {
      colors: ['#ee9ca7', '#ffdde1', '#8ec5fc', '#e0c3fc'],
      pattern: 'checks',
      distortion: 0.6,
      swirl: 0.4,
      softness: 0.5,
      speed: 0.7,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: true,
    hasSwirl: true,
    hasScale: true,
    hasGrain: false,
    params: ['pattern', 'distortion', 'swirl', 'softness'],
  },
  halftone: {
    name: 'Halftone',
    component: HalftoneDots,
    defaultParams: {
      colors: ['#000000', '#ffffff'],
      type: 'standard',
      grid: 'square',
      scale: 1,
      dotSize: 0.5,
      contrast: 0.5,
      speed: 0.5,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['type', 'grid', 'dotSize', 'contrast'],
  },
  halftoneCmyk: {
    name: 'Halftone CMYK',
    component: HalftoneCmyk,
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
      ...defaultSizing,
    },
    hasColors: false,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['type', 'dotSize', 'contrast', 'angleC', 'angleM', 'angleY', 'angleK'],
  },
  heatmap: {
    name: 'Heatmap',
    component: Heatmap,
    defaultParams: {
      colors: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'],
      speed: 0.6,
      intensity: 0.7,
      scale: 1,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['intensity'],
  },
  liquidMetal: {
    name: 'Liquid Metal',
    component: LiquidMetal,
    defaultParams: {
      shape: 'sphere',
      speed: 0.8,
      reflection: 0.6,
      distortion: 0.4,
      ...defaultSizing,
    },
    hasColors: false,
    hasSpeed: true,
    hasDistortion: true,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['shape', 'reflection', 'distortion'],
  },
  imageDithering: {
    name: 'Image Dithering',
    component: ImageDithering,
    defaultParams: {
      ditherType: 'floydSteinberg',
      paletteType: 'twoColor',
      colors: ['#000000', '#ffffff'],
      speed: 0.3,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['ditherType', 'paletteType'],
  },
  paperTexture: {
    name: 'Paper Texture',
    component: PaperTexture,
    defaultParams: {
      paperType: 'cardboard',
      grainIntensity: 0.5,
      fiberIntensity: 0.3,
      speed: 0.2,
      ...defaultSizing,
    },
    hasColors: false,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: true,
    params: ['paperType', 'grainIntensity', 'fiberIntensity'],
  },
  flutedGlass: {
    name: 'Fluted Glass',
    component: FlutedGlass,
    defaultParams: {
      distortionShape: 'vertical',
      gridShape: 'regular',
      distortion: 0.5,
      speed: 0.4,
      ...defaultSizing,
    },
    hasColors: false,
    hasSpeed: true,
    hasDistortion: true,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['distortionShape', 'gridShape', 'distortion'],
  },
  water: {
    name: 'Water',
    component: Water,
    defaultParams: {
      speed: 0.7,
      amplitude: 0.3,
      frequency: 2,
      ...defaultSizing,
    },
    hasColors: false,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: false,
    params: ['amplitude', 'frequency'],
  },
  grainGradient: {
    name: 'Grain Gradient',
    component: GrainGradient,
    defaultParams: {
      colors: ['#ff9a9e', '#fecfef', '#a18cd1', '#fbc2eb'],
      shape: 'linear',
      grainAmount: 0.3,
      speed: 0.5,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: true,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: true,
    params: ['shape', 'grainAmount'],
  },
  staticMeshGradient: {
    name: 'Static Mesh Gradient',
    component: StaticMeshGradient,
    defaultParams: {
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
      distortion: 0.3,
      swirl: 0.2,
      grainMixer: 0.1,
      grainOverlay: 0.05,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: false,
    hasDistortion: true,
    hasSwirl: true,
    hasScale: true,
    hasGrain: true,
    params: ['distortion', 'swirl', 'grainMixer', 'grainOverlay'],
  },
  staticRadialGradient: {
    name: 'Static Radial Gradient',
    component: StaticRadialGradient,
    defaultParams: {
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      focalX: 0.5,
      focalY: 0.5,
      radius: 1,
      grainMixer: 0.1,
      grainOverlay: 0.05,
      ...defaultSizing,
    },
    hasColors: true,
    hasSpeed: false,
    hasDistortion: false,
    hasSwirl: false,
    hasScale: true,
    hasGrain: true,
    params: ['focalX', 'focalY', 'radius', 'grainMixer', 'grainOverlay'],
  },
};

// Predefined color palettes
const colorPalettes: Record<string, string[]> = {
  sunset: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'],
  ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#03045e'],
  forest: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
  neon: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'],
  pastel: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff'],
  monochrome: ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff'],
  fire: ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00'],
  aurora: ['#00ff87', '#60efff', '#ff00ff', '#bd00ff', '#00ff00'],
  custom: [],
};

export default function GradientStudio() {
  const [selectedShader, setSelectedShader] = useState<ShaderType>('meshGradient');
  const [params, setParams] = useState<Record<string, any>>(shaderConfigs.meshGradient.defaultParams);
  const [activePalette, setActivePalette] = useState<string>('sunset');
  const [showControls, setShowControls] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [savedGradients, setSavedGradients] = useState<SavedGradient[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [isMobile, setIsMobile] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch swipe-up gesture detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || !isMobile) return;
    
    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current - currentY;
    
    // Swipe up threshold (50px)
    if (diff > 50) {
      setShowcaseOpen(true);
      touchStartY.current = null;
    }
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
  }, []);

  // Load saved data on mount
  useEffect(() => {
    setSavedGradients(getSavedGradients());
    setLikedIds(getLikedIds());
  }, []);

  const config = shaderConfigs[selectedShader];
  const ShaderComponent = config.component;

  const handleShaderChange = useCallback((shader: ShaderType) => {
    setSelectedShader(shader);
    setParams(shaderConfigs[shader].defaultParams);
  }, []);

  const updateParam = useCallback((key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePaletteChange = useCallback((palette: string) => {
    setActivePalette(palette);
    if (palette !== 'custom' && colorPalettes[palette]) {
      updateParam('colors', colorPalettes[palette]);
    }
  }, [updateParam]);

  const handleColorChange = useCallback((index: number, color: string) => {
    const newColors = [...(params.colors || [])];
    newColors[index] = color;
    updateParam('colors', newColors);
    setActivePalette('custom');
  }, [params.colors, updateParam]);

  const addColor = useCallback(() => {
    if (params.colors && params.colors.length < 10) {
      updateParam('colors', [...params.colors, '#ffffff']);
    }
  }, [params.colors, updateParam]);

  const removeColor = useCallback((index: number) => {
    if (params.colors && params.colors.length > 2) {
      const newColors = params.colors.filter((_: any, i: number) => i !== index);
      updateParam('colors', newColors);
    }
  }, [params.colors, updateParam]);

  const resetParams = useCallback(() => {
    setParams(config.defaultParams);
    setActivePalette('sunset');
  }, [config]);

  const saveToShowcase = useCallback(() => {
    const gradient: SavedGradient = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shaderType: selectedShader,
      params: { ...params },
      name: `${config.name} - ${new Date().toLocaleDateString()}`,
      createdAt: Date.now(),
      likes: 0,
    };
    saveGradient(gradient);
    setSavedGradients(getSavedGradients());
  }, [selectedShader, params, config]);

  const handleDeleteGradient = useCallback((id: string) => {
    removeGradient(id);
    setSavedGradients(getSavedGradients());
  }, []);

  const handleLike = useCallback((id: string) => {
    const wasLiked = toggleLike(id);
    if (wasLiked) {
      updateLikes(id, -1);
    } else {
      updateLikes(id, 1);
    }
    setLikedIds(getLikedIds());
    setSavedGradients(getSavedGradients());
  }, []);

  const loadGradient = useCallback((gradient: SavedGradient) => {
    setSelectedShader(gradient.shaderType);
    setParams(gradient.params);
    setShowcaseOpen(false);
  }, []);

  const sortedGradients = useCallback(() => {
    const sorted = [...savedGradients];
    if (sortBy === 'popular') {
      return sorted.sort((a, b) => b.likes - a.likes);
    }
    return sorted.sort((a, b) => b.createdAt - a.createdAt);
  }, [savedGradients, sortBy]);

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Shader Preview */}
      <div 
        className="flex-1 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ShaderComponent
          {...params}
          width="100%"
          height="100%"
        />
        
        {/* Shader Name Overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
          <h1 className="text-lg font-semibold">{config.name}</h1>
          <button
            onClick={saveToShowcase}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Save to Showcase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button
            onClick={() => setShowcaseOpen(true)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="View Showcase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Button - visible only on mobile */}
        <Drawer.Root open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} direction="bottom">
          <Drawer.Trigger asChild>
            <button
              className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-lg hover:bg-black/70 transition-colors md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/50 z-40 md:hidden" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 h-[85vh] rounded-t-[10px] bg-zinc-800 border-t border-zinc-700 md:hidden">
              <Drawer.Handle className="mx-auto mb-4 h-1 w-12 rounded-full bg-zinc-600" />
              
              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                <Drawer.Title className="text-lg font-semibold">Controls</Drawer.Title>
              </div>

              {/* Scrollable Controls Content */}
              <div className="p-4 space-y-6 pb-20 overflow-y-auto max-h-full">
                {/* Shader Selector */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Shader</label>
                  <select
                    value={selectedShader}
                    onChange={(e) => handleShaderChange(e.target.value as ShaderType)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(shaderConfigs).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.name}</option>
                    ))}
                  </select>
                </div>

                {/* Colors Section */}
                {config.hasColors && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Colors</label>
                    
                    {/* Color Palettes - scrollable on mobile */}
                    <div className="flex flex-wrap gap-1 mb-3 max-h-24 overflow-y-auto">
                      {Object.keys(colorPalettes).filter(p => p !== 'custom').map(palette => (
                        <button
                          key={palette}
                          onClick={() => handlePaletteChange(palette)}
                          className={`px-2 py-1 text-xs rounded ${
                            activePalette === palette 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          }`}
                        >
                          {palette}
                        </button>
                      ))}
                    </div>

                    {/* Color Pickers - scrollable */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {params.colors?.map((color: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => handleColorChange(index, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={color}
                            onChange={(e) => handleColorChange(index, e.target.value)}
                            className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm font-mono"
                          />
                          {params.colors!.length > 2 && (
                            <button
                              onClick={() => removeColor(index)}
                              className="text-zinc-400 hover:text-red-400"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {params.colors && params.colors.length < 10 && (
                        <button
                          onClick={addColor}
                          className="w-full py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded"
                        >
                          + Add Color
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Speed Control */}
                {config.hasSpeed && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Speed: {(params.speed || 0).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.01"
                      value={params.speed || 0}
                      onChange={(e) => updateParam('speed', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Scale Control */}
                {config.hasScale && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Scale: {(params.scale || 1).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.01"
                      value={params.scale || 1}
                      onChange={(e) => updateParam('scale', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Distortion Control */}
                {config.hasDistortion && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Distortion: {(params.distortion || 0).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.distortion || 0}
                      onChange={(e) => updateParam('distortion', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Swirl Control */}
                {config.hasSwirl && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Swirl: {(params.swirl || 0).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.swirl || 0}
                      onChange={(e) => updateParam('swirl', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Grain Controls */}
                {config.hasGrain && (
                  <>
                    {params.grainMixer !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Grain Mixer: {(params.grainMixer || 0).toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={params.grainMixer || 0}
                          onChange={(e) => updateParam('grainMixer', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                    {params.grainOverlay !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Grain Overlay: {(params.grainOverlay || 0).toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={params.grainOverlay || 0}
                          onChange={(e) => updateParam('grainOverlay', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Shader-specific controls */}
                {config.params.map(param => {
                  if (['speed', 'scale', 'distortion', 'swirl', 'grainMixer', 'grainOverlay'].includes(param)) {
                    return null;
                  }
                  
                  return (
                    <div key={param}>
                      <label className="block text-sm font-medium text-zinc-400 mb-2 capitalize">
                        {param}: {typeof params[param] === 'number' ? params[param]?.toFixed(2) : params[param]}
                      </label>
                      {typeof config.defaultParams[param] === 'number' ? (
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.01"
                          value={params[param] || 0}
                          onChange={(e) => updateParam(param, parseFloat(e.target.value))}
                          className="w-full"
                        />
                      ) : (
                        <select
                          value={params[param] || ''}
                          onChange={(e) => updateParam(param, e.target.value)}
                          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="circle">Circle</option>
                          <option value="square">Square</option>
                          <option value="diamond">Diamond</option>
                          <option value="triangle">Triangle</option>
                        </select>
                      )}
                    </div>
                  );
                })}

                {/* Reset Button */}
                <button
                  onClick={resetParams}
                  className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Desktop Toggle Controls Button - hidden on mobile */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-lg hover:bg-black/70 transition-colors hidden md:block"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 066 2.573c.94 1.54300-1.-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar - hidden on mobile */}
      {showControls && (
        <div className="hidden md:block relative w-80 bg-zinc-800 border-l border-zinc-700">
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-700">
            <h2 className="text-lg font-semibold">Controls</h2>
          </div>

          {/* Scrollable Controls Content */}
          <div className="p-4 space-y-6 pb-4 overflow-y-auto max-h-screen">
            {/* Shader Selector */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Shader</label>
              <select
                value={selectedShader}
                onChange={(e) => handleShaderChange(e.target.value as ShaderType)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(shaderConfigs).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.name}</option>
                ))}
              </select>
            </div>

            {/* Colors Section */}
            {config.hasColors && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Colors</label>
                
                {/* Color Palettes */}
                <div className="flex flex-wrap gap-1 mb-3 max-h-24 overflow-y-auto">
                  {Object.keys(colorPalettes).filter(p => p !== 'custom').map(palette => (
                    <button
                      key={palette}
                      onClick={() => handlePaletteChange(palette)}
                      className={`px-2 py-1 text-xs rounded ${
                        activePalette === palette 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      {palette}
                    </button>
                  ))}
                </div>

                {/* Color Pickers */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {params.colors?.map((color: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm font-mono"
                      />
                      {params.colors!.length > 2 && (
                        <button
                          onClick={() => removeColor(index)}
                          className="text-zinc-400 hover:text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {params.colors && params.colors.length < 10 && (
                    <button
                      onClick={addColor}
                      className="w-full py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded"
                    >
                      + Add Color
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Speed Control */}
            {config.hasSpeed && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Speed: {(params.speed || 0).toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={params.speed || 0}
                  onChange={(e) => updateParam('speed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Scale Control */}
            {config.hasScale && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Scale: {(params.scale || 1).toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.01"
                  value={params.scale || 1}
                  onChange={(e) => updateParam('scale', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Distortion Control */}
            {config.hasDistortion && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Distortion: {(params.distortion || 0).toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.distortion || 0}
                  onChange={(e) => updateParam('distortion', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Swirl Control */}
            {config.hasSwirl && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Swirl: {(params.swirl || 0).toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.swirl || 0}
                  onChange={(e) => updateParam('swirl', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Grain Controls */}
            {config.hasGrain && (
              <>
                {params.grainMixer !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Grain Mixer: {(params.grainMixer || 0).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.grainMixer || 0}
                      onChange={(e) => updateParam('grainMixer', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                {params.grainOverlay !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Grain Overlay: {(params.grainOverlay || 0).toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.grainOverlay || 0}
                      onChange={(e) => updateParam('grainOverlay', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </>
            )}

            {/* Shader-specific controls */}
            {config.params.map(param => {
              if (['speed', 'scale', 'distortion', 'swirl', 'grainMixer', 'grainOverlay'].includes(param)) {
                return null;
              }
              
              return (
                <div key={param}>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 capitalize">
                    {param}: {typeof params[param] === 'number' ? params[param]?.toFixed(2) : params[param]}
                  </label>
                  {typeof config.defaultParams[param] === 'number' ? (
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.01"
                      value={params[param] || 0}
                      onChange={(e) => updateParam(param, parseFloat(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <select
                      value={params[param] || ''}
                      onChange={(e) => updateParam(param, e.target.value)}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="diamond">Diamond</option>
                      <option value="triangle">Triangle</option>
                    </select>
                  )}
                </div>
              );
            })}

            {/* Reset Button */}
            <button
              onClick={resetParams}
              className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Showcase Drawer */}
      <Drawer.Root open={showcaseOpen} onOpenChange={setShowcaseOpen} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Drawer.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-zinc-800 border-l border-zinc-700 flex flex-col">
            <Drawer.Handle className="mx-auto my-4 h-1 w-12 rounded-full bg-zinc-600" />
            
            {/* Showcase Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <Drawer.Title className="text-lg font-semibold">Showcase</Drawer.Title>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
                  className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            {/* Gradient Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              {sortedGradients().length === 0 ? (
                <div className="text-center text-zinc-400 py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No saved gradients yet</p>
                  <p className="text-sm mt-2">Click the upload button to save your first gradient!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {sortedGradients().map((gradient) => {
                    const ShaderComp = shaderConfigs[gradient.shaderType].component;
                    const isLiked = likedIds.includes(gradient.id);
                    
                    return (
                      <div 
                        key={gradient.id}
                        className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-zinc-900"
                        onClick={() => loadGradient(gradient)}
                      >
                        <ShaderComp
                          {...gradient.params}
                          width="100%"
                          height="100%"
                        />
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                          <span className="text-xs text-white text-center truncate w-full">
                            {gradient.name}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(gradient.id);
                              }}
                              className={`p-1.5 rounded-full transition-colors ${
                                isLiked 
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            <span className="text-xs text-white">{gradient.likes}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGradient(gradient.id);
                              }}
                              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
