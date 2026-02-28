'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { GradientMode } from '@/lib/gradient';

interface GradientCanvasProps {
  mode: GradientMode;
  colors: string[];
  animate: boolean;
  speed: number;
  noise: number;
  seed: number;
}

// OKLCh color space functions in GLSL
const oklchGLSL = `
// Convert sRGB to linear RGB
vec3 srgbToLinear(vec3 srgb) {
  bvec3 cutoff = lessThan(srgb, vec3(0.04045));
  return mix(srgb / 12.92, pow((srgb + 0.055) / 1.055, vec3(2.4)), cutoff);
}

// Convert linear RGB to sRGB
vec3 linearToSrgb(vec3 linear) {
  bvec3 cutoff = lessThan(linear, vec3(0.0031308));
  return mix(linear * 12.92, 1.055 * pow(linear, vec3(1.0 / 2.4)) - 0.055, cutoff);
}

// Convert linear RGB to OKLab
vec3 linearToOklab(vec3 linear) {
  float l = 0.4122214708 * linear.r + 0.5363325363 * linear.g + 0.0514459929 * linear.b;
  float m = 0.2119034982 * linear.r + 0.6806995451 * linear.g + 0.1073969566 * linear.b;
  float s = 0.0883024619 * linear.r + 0.2817188376 * linear.g + 0.6299787005 * linear.b;
  return vec3(l, m, s);
}

// Convert OKLab to linear RGB
vec3 oklabToLinear(vec3 oklab) {
  float l = oklab.x;
  float m = oklab.y;
  float s = oklab.z;
  float r = l + 0.3963377774 * m + 0.2158037573 * s;
  float g = l - 0.1055613458 * m - 0.0638541728 * s;
  float b = l - 0.0894841775 * m - 1.2914855480 * s;
  return vec3(r, g, b);
}

// Mix colors in OKLCh space - perceptually uniform!
vec3 mixOklch(vec3 c1, vec3 c2, float t) {
  // Convert to OKLab
  vec3 ok1 = linearToOklab(c1);
  vec3 ok2 = linearToOklab(c2);
  
  // Interpolate in OKLab
  vec3 ok = mix(ok1, ok2, t);
  
  // Convert back to linear RGB
  return oklabToLinear(ok);
}
`;

// Simplex noise
const noiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Voronoi for caustics
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float voronoi(vec2 p, float time) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash22(n + g);
      o = 0.5 + 0.5 * sin(time * 0.5 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      md = min(md, d);
    }
  }
  return sqrt(md);
}
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uNoise;
  uniform int uMode;
  uniform float uSeed;
  varying vec2 vUv;
  
  ${oklchGLSL}
  ${noiseGLSL}
  
  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.3;
    vec3 col = uColor1;
    
    // Mesh mode - Domain warping + IDW (like makegradient)
    if (uMode == 0) {
      // Domain warping
      vec2 q = vec2(fbm(uv + t * 0.1), fbm(uv + vec2(1.7, 9.2) + t * 0.08));
      vec2 r = vec2(fbm(uv + 4.0 * q + t * 0.15), fbm(uv + 4.0 * q + vec2(8.3, 2.8) + t * 0.12));
      float f = fbm(uv + 0.5 * r);
      
      // Blend in OKLCh
      col = mixOklch(uColor1, uColor2, f * 0.5 + 0.5);
      col = mixOklch(col, uColor3, f * f * 0.5);
    }
    // Aurora - Sine waves
    else if (uMode == 1) {
      float wave = sin(uv.x * 6.28 + t) * 0.5 + 0.5;
      wave += sin(uv.x * 12.56 + t * 1.5) * 0.25;
      wave = wave / 1.25;
      
      col = mixOklch(uColor1, uColor2, wave * 0.7 + uv.y * 0.3);
      col = mixOklch(col, uColor3, sin(uv.y * 6.28 - t * 0.7) * 0.3 + 0.5);
    }
    // Deep Sea - Voronoi caustics
    else if (uMode == 2) {
      float v1 = voronoi(uv * 4.0, t);
      float v2 = voronoi(uv * 6.0, t + 1.0);
      float caustic = v1 * v2;
      
      col = mixOklch(uColor1, uColor2, caustic);
      col = mixOklch(col, uColor3, pow(caustic, 0.5));
    }
    // Galaxy - Flowing noise
    else if (uMode == 3) {
      float n = fbm(uv * 3.0 + t * 0.2);
      col = mixOklch(uColor1, uColor2, n * 0.5 + 0.5);
      col = mixOklch(col, uColor3, fbm(uv * 5.0 - t * 0.1) * 0.5 + 0.3);
    }
    // Neon - Sharp lines
    else if (uMode == 4) {
      float line1 = smoothstep(0.03, 0.0, abs(sin(uv.x * 10.0 + t) * 0.3 + uv.y - 0.5));
      float line2 = smoothstep(0.03, 0.0, abs(sin(uv.y * 8.0 - t * 0.8) * 0.25 + uv.x - 0.5));
      col = uColor1 * line1 + uColor2 * line2 + uColor3 * 0.15;
    }
    // Bokeh - Soft circles
    else if (uMode == 5) {
      col = uColor1 * 0.3 + uColor2 * 0.2;
      for(float i = 0.0; i < 4.0; i++) {
        vec2 pos = vec2(sin(t * 0.4 + i * 1.6) * 0.35 + 0.5, cos(t * 0.3 + i * 2.0) * 0.35 + 0.5);
        float d = length(uv - pos);
        col += uColor3 * smoothstep(0.12, 0.02, d) * 0.35;
      }
    }
    // Fire - Upward flow
    else if (uMode == 6) {
      float n = fbm(uv * 4.0 + vec2(0.0, -t * 0.8));
      col = mixOklch(uColor1, uColor2, 1.0 - uv.y + n * 0.4);
      col = mixOklch(col, uColor3, pow(1.0 - uv.y, 1.5) * n);
    }
    // Ice - Crystalline
    else if (uMode == 7) {
      float n = snoise(uv * 6.0 + t * 0.15);
      col = mixOklch(uColor1, uColor2, uv.y + n * 0.15);
      col = mixOklch(col, uColor3, abs(snoise(uv * 8.0 - t * 0.1)) * 0.5 + 0.2);
    }
    // Candy - Swirl
    else if (uMode == 8) {
      vec2 center = uv - 0.5;
      float angle = atan(center.y, center.x);
      float dist = length(center);
      float swirl = sin(angle * 3.0 + dist * 6.0 - t * 2.0);
      col = mixOklch(uColor1, uColor2, swirl * 0.5 + 0.5);
      col = mixOklch(col, uColor3, dist * 1.2);
    }
    // Holographic - Iridescence
    else if (uMode == 9) {
      vec2 center = uv - 0.5;
      float angle = atan(center.y, center.x);
      float dist = length(center);
      float irid = sin(angle * 2.5 + t + dist * 8.0);
      col = mixOklch(uColor1, uColor2, irid * 0.5 + 0.5);
      col = mixOklch(col, uColor3, uv.x + snoise(uv * 3.0 + t * 0.1) * 0.2);
    }
    // Radiant - Sun rays
    else if (uMode == 10) {
      vec2 center = uv - 0.5;
      float dist = length(center);
      float angle = atan(center.y, center.x);
      float rays = sin(angle * 5.0 + t) * (1.0 - dist) * 0.6 + 0.4;
      col = mixOklch(uColor1, uColor2, rays);
      col = mixOklch(col, uColor3, 1.0 - dist);
    }
    // Kaleidoscope
    else if (uMode == 11) {
      vec2 center = uv - 0.5;
      float angle = atan(center.y, center.x);
      float dist = length(center);
      float a = mod(angle * 5.0 + t * 0.4, 6.28) / 6.28 - 0.5;
      col = mixOklch(uColor1, uColor2, abs(a) * 2.0);
      col = mixOklch(col, uColor3, dist + snoise(uv * 4.0) * 0.15);
    }
    // Liquid - Flow
    else if (uMode == 12) {
      float n = fbm(uv * 3.0 + t * 0.25);
      col = mixOklch(uColor1, uColor2, n * 0.5 + 0.5);
      col = mixOklch(col, uColor3, sin(n * 6.28 + t) * 0.25 + 0.5);
    }
    // Spectrum - Rainbow
    else if (uMode == 13) {
      float n = snoise(uv * 3.5 + t * 0.2);
      col = mixOklch(uColor1, uColor2, sin(uv.x * 6.28 + n) * 0.5 + 0.5);
      col = mixOklch(col, uColor3, sin(uv.y * 6.28 - n + t * 0.3) * 0.5 + 0.5);
    }
    // Grainy - Texture
    else if (uMode == 14) {
      float n = fbm(uv * 5.0);
      col = mixOklch(uColor1, uColor2, n * 0.5 + 0.5);
      col = mixOklch(col, uColor3, snoise(uv * 40.0) * uNoise);
    }
    // Noise
    else {
      float n = snoise(uv * 15.0 + t * 0.5);
      col = mixOklch(uColor1, uColor2, n * 0.5 + 0.5);
      col = mixOklch(col, uColor3, uNoise);
    }
    
    // Tone mapping
    col = pow(col, vec3(0.9));
    col = col * 0.92 + 0.08;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

const modeToIndex: Record<GradientMode, number> = {
  mesh: 0,
  aurora: 1,
  'deep-sea': 2,
  galaxy: 3,
  neon: 4,
  bokeh: 5,
  fire: 6,
  ice: 7,
  candy: 8,
  holographic: 9,
  radiant: 10,
  kaleidoscope: 11,
  liquid: 12,
  spectrum: 13,
  grainy: 14,
  noise: 15,
};

function GradientPlane({ mode, colors, animate, speed, noise, seed }: GradientCanvasProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const speedRef = useRef(speed);
  const animateRef = useRef(animate);
  
  // Keep refs updated without triggering re-renders
  useMemo(() => {
    speedRef.current = speed;
  }, [speed]);
  
  useMemo(() => {
    animateRef.current = animate;
  }, [animate]);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(colors[0] || '#8b5cf6') },
    uColor2: { value: new THREE.Color(colors[1] || '#ec4899') },
    uColor3: { value: new THREE.Color(colors[2] || '#3b82f6') },
    uNoise: { value: noise || 0.05 },
    uMode: { value: 0 },
    uSeed: { value: seed || 0 }
  }), []);
  
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    const mat = materialRef.current;
    
    if (animateRef.current) {
      mat.uniforms.uTime.value += delta * speedRef.current;
    }
    
    if (colors[0]) mat.uniforms.uColor1.value.set(colors[0]);
    if (colors[1]) mat.uniforms.uColor2.value.set(colors[1]);
    if (colors[2]) mat.uniforms.uColor3.value.set(colors[2]);
    
    mat.uniforms.uMode.value = modeToIndex[mode] ?? 0;
    mat.uniforms.uNoise.value = noise;
    mat.uniforms.uSeed.value = seed;
  });
  
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

export default function WebGLGradient({ 
  mode, 
  colors, 
  animate, 
  speed, 
  noise,
  seed
}: GradientCanvasProps) {
  const [webglError] = useState(false);
  
  const safeColors = [
    colors[0] || '#8b5cf6',
    colors[1] || '#ec4899', 
    colors[2] || '#3b82f6'
  ];
  
  const gradientStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -2,
    background: `linear-gradient(135deg, ${safeColors[0]}, ${safeColors[1]}, ${safeColors[2]})`
  };
  
  const animatedStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    background: `linear-gradient(135deg, ${safeColors[0]}, ${safeColors[1]}, ${safeColors[2]})`,
    backgroundSize: '400% 400%',
    animation: animate ? 'gradientShift 8s ease infinite' : 'none',
  };

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <div style={gradientStyle} />
      <div style={animatedStyle} />
      
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Canvas
          gl={{ 
            antialias: false, 
            alpha: true,
            failIfMajorPerformanceCaveat: false,
            powerPreference: 'high-performance'
          }}
          dpr={1}
          camera={{ position: [0, 0, 1] }}
          style={{ width: '100%', height: '100%' }}
        >
          <GradientPlane 
            mode={mode} 
            colors={safeColors} 
            animate={animate} 
            speed={speed} 
            noise={noise}
            seed={seed}
          />
        </Canvas>
      </div>
    </>
  );
}
