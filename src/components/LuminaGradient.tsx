'use client';

import { useEffect, useRef } from 'react';

// Lumina Gradient - Extended with controls

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform float uNoiseStrength;
uniform float uMode;
uniform float uScale;
uniform float uComplexity;
uniform float uDistortion;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
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

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float voronoi(vec2 p, float time) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float m = 1.0;
  for(int j=-1; j<=1; j++) {
    for(int i=-1; i<=1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.5 * sin(time + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      m = min(m, d);
    }
  }
  return sqrt(m);
}

vec3 hueShift(vec3 color, float shift) {
  vec3 k = vec3(0.57735);
  float cosAngle = cos(shift);
  float sinAngle = sin(shift);
  return color * cosAngle + vec3(
    k.y * color.z - k.z * color.y,
    k.z * color.x - k.x * color.z,
    k.x * color.y - k.y * color.x
  ) * sinAngle + k * dot(k, color) * (1.0 - cosAngle);
}

vec3 vibranceBoost(vec3 c, float amount) {
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float sat = (maxC > 0.001) ? (maxC - minC) / maxC : 0.0;
  float boost = amount * (1.0 - sat);
  return mix(vec3(luma), c, 1.0 + boost);
}

void main() {
  vec2 uv = vUv;
  float time = uTime * 0.2;
  float scale = uScale;
  float complexity = uComplexity;
  float distortion = uDistortion;
  vec3 color = vec3(0.0);
  
  // MODE 0: MESH
  if (uMode < 0.5) {
    float noiseScale = 1.5 * scale;
    float warpStrength = 0.2 * distortion;
    float moveScale = 0.1;
    float falloff = 0.1;
    float n = snoise(vec2(uv.x * noiseScale + time, uv.y * noiseScale - time));
    vec2 warpedUv = uv + vec2(n * warpStrength);
    vec2 p0 = vec2(0.5, 0.5);
    vec2 p1 = vec2(0.2, 0.2) + vec2(sin(time * 0.5) * moveScale, cos(time * 0.6) * moveScale);
    vec2 p2 = vec2(0.8, 0.2) + vec2(cos(time * 0.7) * moveScale, sin(time * 0.4) * moveScale);
    vec2 p3 = vec2(0.2, 0.8) + vec2(sin(time * 0.3) * moveScale, cos(time * 0.5) * moveScale);
    vec2 p4 = vec2(0.8, 0.8) + vec2(cos(time * 0.4) * moveScale, sin(time * 0.6) * moveScale);
    float w0 = 1.0 / (length(warpedUv - p0) * length(warpedUv - p0) + falloff);
    float w1 = 1.0 / (length(warpedUv - p1) * length(warpedUv - p1) + falloff);
    float w2 = 1.0 / (length(warpedUv - p2) * length(warpedUv - p2) + falloff);
    float w3 = 1.0 / (length(warpedUv - p3) * length(warpedUv - p3) + falloff);
    float w4 = 1.0 / (length(warpedUv - p4) * length(warpedUv - p4) + falloff);
    float total = w0 + w1 + w2 + w3 + w4;
    color = (uColor1 * w0 + uColor2 * w1 + uColor3 * w2 + uColor4 * w3 + uColor5 * w4) / total;
  }
  // MODE 1: AURORA
  else if (uMode > 0.5 && uMode < 1.5) {
    float f = snoise(vec2(uv.x * 1.2 * scale + time * 0.1, uv.y * 0.5)) * 0.5 + snoise(vec2(uv.x * 2.5 * scale - time * 0.15, uv.y * 0.8 + time * 0.05)) * 0.25;
    float dy = uv.y + f * 0.15 * distortion;
    float band1 = smoothstep(0.0, 0.35, dy) * smoothstep(0.65, 0.25, dy);
    float band2 = smoothstep(0.15, 0.50, dy) * smoothstep(0.80, 0.40, dy);
    float band3 = smoothstep(0.30, 0.60, dy) * smoothstep(0.90, 0.55, dy);
    float band4 = smoothstep(0.45, 0.70, dy) * smoothstep(1.0, 0.65, dy);
    float shimmer = snoise(vec2(uv.x * 3.0 + time * 0.4, uv.y * 1.5 - time * 0.1)) * 0.5 + 0.5;
    shimmer = shimmer * 0.6 + 0.4;
    float moveScale = 0.2; float falloff = 0.3;
    vec2 wUv = uv + vec2(f * 0.1);
    vec2 p0 = vec2(0.5, 0.5);
    vec2 p1 = vec2(0.2, 0.3) + vec2(sin(time * 0.3) * moveScale, cos(time * 0.4) * moveScale);
    vec2 p2 = vec2(0.8, 0.3) + vec2(cos(time * 0.5) * moveScale, sin(time * 0.3) * moveScale);
    vec2 p3 = vec2(0.2, 0.7) + vec2(sin(time * 0.2) * moveScale, cos(time * 0.3) * moveScale);
    vec2 p4 = vec2(0.8, 0.7) + vec2(cos(time * 0.3) * moveScale, sin(time * 0.4) * moveScale);
    float bw0 = 1.0 / (length(wUv - p0) * length(wUv - p0) + falloff);
    float bw1 = 1.0 / (length(wUv - p1) * length(wUv - p1) + falloff);
    float bw2 = 1.0 / (length(wUv - p2) * length(wUv - p2) + falloff);
    float bw3 = 1.0 / (length(wUv - p3) * length(wUv - p3) + falloff);
    float bw4 = 1.0 / (length(wUv - p4) * length(wUv - p4) + falloff);
    float bTotal = bw0 + bw1 + bw2 + bw3 + bw4;
    vec3 baseGrad = (uColor1*bw0 + uColor2*bw1 + uColor3*bw2 + uColor4*bw3 + uColor5*bw4) / bTotal;
    vec3 auroraGlow = uColor2 * band1 * shimmer * 0.6 + uColor3 * band2 * shimmer * 0.5 + uColor4 * band3 * shimmer * 0.45 + uColor5 * band4 * shimmer * 0.4;
    float vFade = smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.75, uv.y);
    color = baseGrad * 0.6 + auroraGlow * vFade + baseGrad * auroraGlow * 0.5;
  }
  // MODE 2: GRAINY
  else if (uMode > 1.5 && uMode < 2.5) {
    float noiseScale = 1.5 * scale;
    float warpStrength = 0.2 * distortion;
    float falloff = 0.1;
    float n = snoise(vec2(uv.x * noiseScale + time, uv.y * noiseScale - time));
    vec2 warpedUv = uv + vec2(n * warpStrength);
    vec2 p0 = vec2(0.5, 0.5);
    vec2 p1 = vec2(0.2, 0.2) + vec2(sin(time * 0.5) * 0.1, cos(time * 0.6) * 0.1);
    vec2 p2 = vec2(0.8, 0.2) + vec2(cos(time * 0.7) * 0.1, sin(time * 0.4) * 0.1);
    vec2 p3 = vec2(0.2, 0.8) + vec2(sin(time * 0.3) * 0.1, cos(time * 0.5) * 0.1);
    vec2 p4 = vec2(0.8, 0.8) + vec2(cos(time * 0.4) * 0.1, sin(time * 0.6) * 0.1);
    float w0 = 1.0 / (length(warpedUv - p0) * length(warpedUv - p0) + falloff);
    float w1 = 1.0 / (length(warpedUv - p1) * length(warpedUv - p1) + falloff);
    float w2 = 1.0 / (length(warpedUv - p2) * length(warpedUv - p2) + falloff);
    float w3 = 1.0 / (length(warpedUv - p3) * length(warpedUv - p3) + falloff);
    float w4 = 1.0 / (length(warpedUv - p4) * length(warpedUv - p4) + falloff);
    float total = w0 + w1 + w2 + w3 + w4;
    vec3 smoothGrad = (uColor1 * w0 + uColor2 * w1 + uColor3 * w2 + uColor4 * w3 + uColor5 * w4) / total;
    
    float grainTime = time * 0.3;
    vec2 grainDrift = vec2(sin(grainTime * 0.7) * 30.0 + grainTime * 8.0, cos(grainTime * 0.5) * 25.0 + grainTime * 5.0);
    vec2 animatedCoord = gl_FragCoord.xy + grainDrift;
    float cellSizeLg = 200.0 * scale;
    vec2 cellCoord = floor(animatedCoord / cellSizeLg);
    vec2 cellFrac = fract(animatedCoord / cellSizeLg);
    float cellRand1 = fract(sin(dot(cellCoord, vec2(127.1, 311.7))) * 43758.5453);
    vec3 chosenColor = uColor1;
    if (cellRand1 > 0.2 && cellRand1 <= 0.4) chosenColor = uColor2;
    else if (cellRand1 > 0.4 && cellRand1 <= 0.6) chosenColor = uColor3;
    else if (cellRand1 > 0.6 && cellRand1 <= 0.8) chosenColor = uColor4;
    else if (cellRand1 > 0.8) chosenColor = uColor5;
    vec3 stippleColor = mix(chosenColor, smoothGrad, 0.5);
    vec2 dotCenter = vec2(fract(sin(dot(cellCoord, vec2(269.5, 183.3))) * 43758.5453), fract(sin(dot(cellCoord, vec2(419.2, 371.9))) * 43758.5453));
    float dotRadius = 0.2 + cellRand1 * 0.15;
    float dist = length(cellFrac - dotCenter);
    float dotMask = smoothstep(dotRadius, dotRadius - 0.05, dist);
    color = mix(smoothGrad, stippleColor, dotMask * 0.3);
  }
  // MODE 3: DEEP SEA
  else if (uMode > 2.5 && uMode < 3.5) {
    float swell = snoise(vec2(uv.x * 1.5 * scale + time * 0.3, uv.y * 1.0 - time * 0.2));
    vec3 baseColor = mix(uColor1, uColor2, swell * 0.5 + 0.5);
    baseColor = mix(baseColor, uColor5, uv.y * 0.6);
    float v = voronoi(uv * 4.0 * scale, time * 0.8);
    float caustic = pow(1.0 - v, 4.0);
    color = baseColor + uColor3 * caustic * 0.8;
    float v2 = voronoi(uv * 6.0 * scale + vec2(time), time * 1.2);
    color += uColor4 * pow(1.0 - v2, 3.0) * 0.4;
    float dist = distance(uv, vec2(0.5));
    color *= (1.0 - dist * 0.6);
  }
  // MODE 4: HOLOGRAPHIC
  else if (uMode > 3.5 && uMode < 4.5) {
    float hMoveScale = 0.15 * distortion; float hFalloff = 0.15;
    vec2 hp0 = vec2(0.5, 0.5);
    vec2 hp1 = vec2(0.2, 0.25) + vec2(sin(time * 0.4) * hMoveScale, cos(time * 0.5) * hMoveScale);
    vec2 hp2 = vec2(0.8, 0.25) + vec2(cos(time * 0.6) * hMoveScale, sin(time * 0.35) * hMoveScale);
    vec2 hp3 = vec2(0.2, 0.75) + vec2(sin(time * 0.25) * hMoveScale, cos(time * 0.45) * hMoveScale);
    vec2 hp4 = vec2(0.8, 0.75) + vec2(cos(time * 0.35) * hMoveScale, sin(time * 0.55) * hMoveScale);
    float hw0 = 1.0 / (length(uv - hp0) * length(uv - hp0) + hFalloff);
    float hw1 = 1.0 / (length(uv - hp1) * length(uv - hp1) + hFalloff);
    float hw2 = 1.0 / (length(uv - hp2) * length(uv - hp2) + hFalloff);
    float hw3 = 1.0 / (length(uv - hp3) * length(uv - hp3) + hFalloff);
    float hw4 = 1.0 / (length(uv - hp4) * length(uv - hp4) + hFalloff);
    float hTotal = hw0 + hw1 + hw2 + hw3 + hw4;
    vec3 holoBase = (uColor1*hw0 + uColor2*hw1 + uColor3*hw2 + uColor4*hw3 + uColor5*hw4) / hTotal;
    float filmNoise1 = snoise(uv * 3.0 * scale + vec2(time * 0.06, time * 0.04));
    float filmNoise2 = snoise(uv * 5.5 * scale - vec2(time * 0.08, -time * 0.05));
    float opd = (uv.x * 4.0 + uv.y * 3.0) * 1.8 + filmNoise1 * 2.2 + filmNoise2 * 1.1;
    vec3 thinFilm;
    thinFilm.r = sin(opd * 6.28) * 0.5 + 0.5;
    thinFilm.g = sin(opd * 6.28 + 2.094) * 0.5 + 0.5;
    thinFilm.b = sin(opd * 6.28 + 4.189) * 0.5 + 0.5;
    vec3 filmShifted = hueShift(holoBase, opd * 1.8 + time * 0.25);
    vec3 filmColor = mix(filmShifted, thinFilm, 0.35);
    float patchNoise = snoise(uv * 2.5 * scale + vec2(time * 0.1, time * 0.08)) * 0.5 + 0.5;
    float intensity = smoothstep(0.2, 0.8, patchNoise);
    float viewAngle = abs(dot(normalize(vec3(uv - 0.5, 0.8)), vec3(0.0, 0.0, 1.0)));
    float fresnel = pow(1.0 - viewAngle, 1.8);
    float filmStrength = intensity * (fresnel * 0.5 + 0.5) * 0.55;
    color = mix(holoBase, filmColor, filmStrength);
  }
  // MODE 5: RADIAL
  else if (uMode > 4.5 && uMode < 5.5) {
    vec2 center = uv - 0.5;
    float dist = length(center) * scale;
    float angle = atan(center.y, center.x);
    float wave = sin(angle * 6.0 * complexity + dist * 10.0 - time * 2.0) * 0.5 + 0.5;
    float rings = sin(dist * 15.0 - time * 3.0) * 0.5 + 0.5;
    color = mix(uColor1, uColor2, wave);
    color = mix(color, uColor3, rings);
    color = mix(color, uColor4, 1.0 - dist * 0.5);
    float glow = exp(-dist * 3.0);
    color += uColor5 * glow * 0.5;
  }
  // MODE 6: COSMIC
  else if (uMode > 5.5 && uMode < 6.5) {
    float stars = 0.0;
    for(float i = 1.0; i < 4.0; i++) {
      vec2 starUv = uv * (100.0 + i * 50.0) * scale;
      vec2 starId = floor(starUv);
      vec2 starF = fract(starUv) - 0.5;
      float starRand = fract(sin(dot(starId, vec2(12.9898, 78.233))) * 43758.5453);
      if(starRand > 0.97 - distortion * 0.02) {
        float twinkle = sin(time * 3.0 + starRand * 6.28) * 0.5 + 0.5;
        stars += smoothstep(0.1, 0.0, length(starF)) * twinkle;
      }
    }
    float nebula = fbm(uv * 3.0 * scale + time * 0.05) * 0.5 + 0.5;
    nebula = pow(nebula, complexity);
    vec3 nebulaColor = mix(uColor1, uColor2, nebula);
    nebulaColor = mix(nebulaColor, uColor3, pow(nebula, 2.0));
    color = nebulaColor + vec3(stars) * uColor4;
    float vig = 1.0 - length(uv - 0.5) * 0.8;
    color *= vig;
  }
  // MODE 7: PLASMA
  else if (uMode > 6.5 && uMode < 7.5) {
    float p1 = sin(uv.x * 10.0 * scale + time);
    float p2 = sin(uv.y * 10.0 * scale + time);
    float p3 = sin((uv.x + uv.y) * 10.0 * scale + time);
    float p4 = sin(sqrt(uv.x*uv.x + uv.y*uv.y) * 10.0 * scale + time);
    float plasma = (p1 + p2 + p3 + p4) * 0.25 * 0.5 + 0.5;
    plasma = pow(plasma, complexity);
    color = mix(uColor1, uColor2, plasma);
    color = mix(color, uColor3, sin(plasma * 6.28) * 0.5 + 0.5);
    color = mix(color, uColor4, sin(plasma * 12.56 + time) * 0.3 + 0.5);
    float lines = sin(atan(uv.y - 0.5, uv.x - 0.5) * 20.0 + plasma * 10.0 - time * 5.0);
    lines = smoothstep(0.9, 1.0, abs(lines));
    color += uColor5 * lines * 0.3 * distortion;
  }
  // MODE 8: TERRAIN
  else if (uMode > 7.5 && uMode < 8.5) {
    float terrain = fbm(uv * 4.0 * scale + vec2(0.0, -time * 0.1));
    float h = terrain * 0.5 + 0.5;
    if(h < 0.3) color = mix(uColor1, uColor2, h / 0.3);
    else if(h < 0.6) color = mix(uColor2, uColor3, (h - 0.3) / 0.3);
    else color = mix(uColor3, uColor4, (h - 0.6) / 0.4);
    float contour = fract(h * 10.0 * complexity);
    contour = smoothstep(0.02, 0.0, abs(contour - 0.5));
    color = mix(color, uColor5, contour * 0.2);
  }
  // MODE 9: BEAM
  else if (uMode > 8.5 && uMode < 9.5) {
    vec2 center = vec2(0.5, 1.0);
    vec2 toUv = uv - center;
    float angle = atan(toUv.y, toUv.x);
    float dist = length(toUv);
    float beam1 = smoothstep(0.15, 0.0, abs(sin(angle * 3.0 * complexity + time * 0.5) * 0.3 * distortion + dist - 0.3));
    float beam2 = smoothstep(0.1, 0.0, abs(sin(angle * 5.0 * complexity - time * 0.3) * 0.2 + dist - 0.5));
    float beam3 = smoothstep(0.12, 0.0, abs(sin(angle * 7.0 * complexity + time * 0.4) * 0.25 + dist - 0.7));
    float fade = 1.0 - smoothstep(0.0, 1.0, dist);
    color = uColor1 * beam1 * fade * 0.8 + uColor2 * beam2 * fade * 0.6 + uColor3 * beam3 * fade * 0.4;
    float glow = exp(-dist * 2.0);
    color += uColor4 * glow * 0.5;
  }
  // MODE 10: NOISE
  else {
    float n = fbm(uv * 5.0 * scale + time * 0.1);
    n = n * 0.5 + 0.5;
    n = pow(n, complexity);
    color = mix(uColor1, uColor2, n);
    color = mix(color, uColor3, snoise(uv * 20.0 * scale) * 0.5 + 0.5);
  }
  
  color = vibranceBoost(color, 0.3);
  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * uNoiseStrength;
  gl_FragColor = vec4(color, 1.0);
}
`;

const modeMap: Record<string, number> = {
  mesh: 0,
  aurora: 1,
  grainy: 2,
  'deep-sea': 3,
  holographic: 4,
  radial: 5,
  cosmic: 6,
  plasma: 7,
  terrain: 8,
  beam: 9,
  noise: 10
};

interface LuminaGradientProps {
  colors?: string[];
  mode?: string;
  noiseStrength?: number;
  speed?: number;
  scale?: number;
  complexity?: number;
  distortion?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ];
}

export default function LuminaGradient({ 
  colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
  mode = 'mesh',
  noiseStrength = 0.2,
  speed = 1,
  scale = 1,
  complexity = 1,
  distortion = 1
}: LuminaGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const speedRef = useRef(speed);

  // Keep speed ref updated without triggering re-renders
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, preserveDrawingBuffer: true });
    if (!gl) return;
    glRef.current = gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    programRef.current = program;
    gl.useProgram(program);

    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, 'uv');
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const rgbColors = colors.map(c => hexToRgb(c));
    while (rgbColors.length < 5) rgbColors.push([0, 0, 0]);

    const colorLocs = [
      gl.getUniformLocation(program, 'uColor1'),
      gl.getUniformLocation(program, 'uColor2'),
      gl.getUniformLocation(program, 'uColor3'),
      gl.getUniformLocation(program, 'uColor4'),
      gl.getUniformLocation(program, 'uColor5'),
    ];
    colorLocs.forEach((loc, i) => gl.uniform3fv(loc, rgbColors[i]));

    gl.uniform1f(gl.getUniformLocation(program, 'uNoiseStrength'), noiseStrength);
    gl.uniform1f(gl.getUniformLocation(program, 'uMode'), modeMap[mode] ?? 0);
    gl.uniform1f(gl.getUniformLocation(program, 'uScale'), scale);
    gl.uniform1f(gl.getUniformLocation(program, 'uComplexity'), complexity);
    gl.uniform1f(gl.getUniformLocation(program, 'uDistortion'), distortion);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.01 * speedRef.current;
      gl.uniform1f(gl.getUniformLocation(program, 'uTime'), timeRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
    };
  }, [colors, mode, noiseStrength, scale, complexity, distortion, speed]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
