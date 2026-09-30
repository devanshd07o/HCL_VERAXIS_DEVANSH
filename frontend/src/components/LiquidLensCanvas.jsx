import React, { useEffect, useRef } from "react";

export default function LiquidLensCanvas({ isHovered, mousePos, theme = "dark" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const vsSource = `#version 300 es
    precision highp float;
    in vec2 aPosition;
    out vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl.Position = vec4(aPosition, 0.0, 1.0);
    }`;

    // Pure Optical Liquid Glass Fragment Shader (Apple WWDC Fluid Material)
    // 100% Optically Clear Center (Zero Text Obstruction), Liquid Organic Rim Refraction & Mouse Prism Caustics
    const fsSource = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform float uTime;
    uniform float uDark;
    uniform float uDpr;

    // Continuous Organic Liquid Droplet SDF (Zero Hard Corners)
    float getLiquidSdf(vec2 p, vec2 center, vec2 halfSize) {
      vec2 pRel = p - center;
      
      // Super-oval power 2.5: continuous liquid curvature without a single rigid corner
      float nx = abs(pRel.x) / max(halfSize.x, 1.0);
      float ny = abs(pRel.y) / max(halfSize.y, 1.0);
      float baseDist = pow(pow(nx, 2.5) + pow(ny, 2.5), 1.0 / 2.5) - 1.0;

      // Gentle capillary surface tension wave
      float angle = atan(pRel.y, pRel.x);
      float wave = sin(angle * 4.0 + uTime * 1.2) * 0.012
                 + cos(angle * 6.0 - uTime * 1.5) * 0.008;

      // Surface tension pull toward cursor
      vec2 toMouse = (uMouse - p) / uResolution;
      float mouseDist = length(toMouse);
      float stretch = exp(-mouseDist * mouseDist * 36.0) * 0.025 * (0.6 + uHover);

      return baseDist - wave - stretch;
    }

    // Droplet meniscus height profile
    float getLiquidDomeHeight(float d, float peakHeight) {
      if (d >= 0.0) return 0.0;
      float x = clamp(-d * 4.0, 0.0, 1.0);
      return peakHeight * sqrt(1.0 - (1.0 - x) * (1.0 - x));
    }

    void main() {
      vec2 p = gl_FragCoord.xy;
      vec2 center = uResolution * 0.5;
      vec2 halfSize = center - vec2(2.5 * uDpr);

      float d = getLiquidSdf(p, center, halfSize);

      // Outside liquid contour: completely transparent
      if (d > 0.0) {
        fragColor = vec4(0.0);
        return;
      }

      float peakHeight = 16.0 * uDpr;
      float h = getLiquidDomeHeight(d, peakHeight);

      // Central differences surface normals
      vec2 eps = vec2(1.5, 0.0);
      float h_L = getLiquidDomeHeight(getLiquidSdf(p - eps.xy, center, halfSize), peakHeight);
      float h_R = getLiquidDomeHeight(getLiquidSdf(p + eps.xy, center, halfSize), peakHeight);
      float h_D = getLiquidDomeHeight(getLiquidSdf(p - eps.yx, center, halfSize), peakHeight);
      float h_U = getLiquidDomeHeight(getLiquidSdf(p + eps.yx, center, halfSize), peakHeight);

      vec2 gradH = vec2(h_R - h_L, h_U - h_D) * 0.5;
      vec3 N = normalize(vec3(-gradH * 2.8, 1.0));

      // Meniscus perimeter intensity (1.0 at curved liquid edge, 0.0 at center)
      float rimFactor = clamp(-d * 6.0, 0.0, 1.0);
      float edgeIntensity = pow(1.0 - rimFactor, 2.2);

      // Dynamic cursor lighting
      vec2 mouseNorm = uMouse / uResolution;
      vec2 fragNorm = p / uResolution;
      vec3 lightDir = normalize(vec3(mouseNorm - fragNorm, 0.28 + 0.2 * uHover));
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfDir = normalize(lightDir + viewDir);

      // Sharp wet specular glint
      float wetSpec = pow(max(dot(N, halfDir), 0.0), 128.0) * (1.2 + 0.8 * uHover);

      // Ambient top specular gleam
      vec3 fixedDir = normalize(vec3(-0.35, 0.6, 0.8));
      vec3 fixedHalf = normalize(fixedDir + viewDir);
      float fixedSpec = pow(max(dot(N, fixedHalf), 0.0), 200.0) * 0.7;

      // Real Chromatic Dispersion Prism (Apple Refractive Spectrum)
      float fluidAngle = atan(N.y, N.x) + uTime * 0.2;
      vec3 prismCol;
      prismCol.r = 0.5 + 0.5 * cos(fluidAngle + 0.000);
      prismCol.g = 0.5 + 0.5 * cos(fluidAngle + 2.094);
      prismCol.b = 0.5 + 0.5 * cos(fluidAngle + 4.188);

      // Fresnel reflection (n = 1.52)
      float cosTheta = max(N.z, 0.0);
      float fresnel = 0.043 + 0.957 * pow(1.0 - cosTheta, 5.0);

      // If in center of the liquid: ONLY pure specular glints, ZERO color cast (100% clear text)
      if (edgeIntensity < 0.04) {
        float centerGleam = (wetSpec + fixedSpec) * 0.25;
        fragColor = vec4(vec3(1.0) * centerGleam, centerGleam);
        return;
      }

      // Edge Optical Composition: Pristine liquid refraction with rainbow prism fringe
      vec3 col = prismCol * edgeIntensity * 0.70;
      col += vec3(wetSpec + fixedSpec);
      col += vec3(fresnel * 0.35);

      // Alpha: pure and glassy, fading out toward center
      float alpha = edgeIntensity * 0.42 + (wetSpec * 0.3);
      fragColor = vec4(col * alpha, alpha);
    }`;

    function createShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Shader error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    const positionLoc = gl.getAttribLocation(program, "aPosition");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResLoc = gl.getUniformLocation(program, "uResolution");
    const uMouseLoc = gl.getUniformLocation(program, "uMouse");
    const uHoverLoc = gl.getUniformLocation(program, "uHover");
    const uTimeLoc = gl.getUniformLocation(program, "uTime");
    const uDarkLoc = gl.getUniformLocation(program, "uDark");
    const uDprLoc = gl.getUniformLocation(program, "uDpr");

    let animId = null;
    let startTime = performance.now();
    let currentHover = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;

    function render(now) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const targetHover = isHovered ? 1.0 : 0.0;
      currentHover += (targetHover - currentHover) * 0.12;

      const targetMX = (mousePos.x || rect.width * 0.5) * dpr;
      const targetMY = (rect.height - (mousePos.y || rect.height * 0.5)) * dpr;
      smoothMouseX += (targetMX - smoothMouseX) * 0.15;
      smoothMouseY += (targetMY - smoothMouseY) * 0.15;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(uResLoc, width, height);
      gl.uniform2f(uMouseLoc, smoothMouseX, smoothMouseY);
      gl.uniform1f(uHoverLoc, currentHover);
      gl.uniform1f(uTimeLoc, (now - startTime) / 1000);
      gl.uniform1f(uDarkLoc, theme === "dark" ? 1.0 : 0.0);
      gl.uniform1f(uDprLoc, dpr);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      gl.deleteBuffer(quadBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [isHovered, mousePos, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-full z-0 overflow-hidden"
    />
  );
}
