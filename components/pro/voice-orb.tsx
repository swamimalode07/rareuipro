"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type VoiceOrbState = "idle" | "listening" | "speaking";

type VoiceOrbColors = [string, string, string];

type VoiceOrbProps = React.ComponentProps<"button"> & {
  state?: VoiceOrbState;
  level?: number;
  colors?: VoiceOrbColors;
  onStart?: () => void;
  onStop?: () => void;
  onInterrupt?: () => void;
};

const LABELS: Record<VoiceOrbState, string> = {
  idle: "Start talking",
  listening: "Stop listening",
  speaking: "Interrupt",
};

const DEFAULT_COLORS: VoiceOrbColors = ["#F59BFF", "#B05CFF", "#7F8CFF"];

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uSpin;
uniform float uVoice;
uniform float uAwake;
uniform float uSpeak;
uniform float uPixel;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;

mat3 turn(float yaw, float tilt) {
  float cy = cos(yaw), sy = sin(yaw), ct = cos(tilt), st = sin(tilt);
  return mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy)
       * mat3(1.0, 0.0, 0.0, 0.0, ct, st, 0.0, -st, ct);
}

// two wavy bands of light wrapped around the sphere
float bands(vec3 n, float t, float ripple, float width) {
  float f1 = n.y + 0.38 * sin(n.x * 2.6 + n.z * 1.4 + t * 0.6) * ripple;
  float f2 = n.x * 0.8 - n.y * 0.6 + 0.3 * sin(n.z * 3.1 - t * 0.5) * ripple;
  return exp(-f1 * f1 / width) + 0.3 * exp(-f2 * f2 / (width * 0.7));
}

void main() {
  vec2 p = (vUv * 2.0 - 1.0) * 1.25;
  float r = length(p);
  float a = atan(p.y, p.x);
  float t = uTime;
  float hear = uVoice * (1.0 - uSpeak);
  float say = uVoice * uSpeak;

  vec3 hue = mix(uA, uB, 0.5 + 0.5 * sin(a + t * 0.3));
  hue = mix(hue, uC, smoothstep(0.2, 1.0, 0.5 + 0.5 * sin(a - 2.4 - t * 0.2)));

  float inside = 1.0 - smoothstep(1.0 - uPixel, 1.0 + uPixel, r);
  float z = sqrt(max(1.0 - r * r, 0.0));

  // the far side shows through faintly, so it reads as a glass sphere
  mat3 m = turn(uSpin, 0.45 + 0.1 * sin(t * 0.2));
  float ripple = 1.0 + 1.6 * hear + 0.6 * say;
  float width = 0.02 + 0.03 * hear + 0.015 * say;
  float light = bands(m * vec3(p, z), t, ripple, width) * (0.5 + 0.5 * z)
              + bands(m * vec3(p, -z), t, ripple, width) * 0.3;

  // listening lights the edge, speaking lights the centre
  float fresnel = pow(1.0 - z, 2.6 - 0.9 * hear);
  float rimLight = 0.8 + 0.2 * sin(a * 2.0 + t * 0.8);
  float core = exp(-r * r / (0.05 + 0.25 * say)) * (0.1 + say) * uSpeak;

  vec3 col = vec3(0.012, 0.004, 0.025) * z;
  col += hue * light * (0.35 + 0.3 * uAwake + 0.5 * hear + 0.7 * say);
  col += mix(hue, vec3(1.0), 0.2) * fresnel * rimLight * (0.95 + 0.3 * uAwake + hear - 0.25 * uSpeak);
  col += mix(uB, vec3(1.0), 0.4) * core;
  col *= inside;

  float glow = exp(-max(r - 1.0, 0.0) * 10.0) * smoothstep(1.25, 1.02, r) * (1.0 - inside);
  col += hue * glow * (0.45 + 0.6 * hear + 0.2 * say);

  col = 1.0 - exp(-col * 1.35);
  gl_FragColor = vec4(col, max(inside, max(col.r, max(col.g, col.b))));
}`;

type OrbFrame = {
  time: number;
  spin: number;
  voice: number;
  awake: number;
  speak: number;
  colors: number[][];
};

function hexToRgb(hex: string) {
  const v = hex.replace("#", "");
  const n = parseInt(v.length === 3 ? v.replace(/./g, "$&$&") : v, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function createOrbRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true });
  if (!gl) return null;
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const scalars = {
    time: uniform("uTime"),
    spin: uniform("uSpin"),
    voice: uniform("uVoice"),
    awake: uniform("uAwake"),
    speak: uniform("uSpeak"),
  };
  const colors = [uniform("uA"), uniform("uB"), uniform("uC")];
  const pixel = uniform("uPixel");

  return {
    resize() {
      const size = Math.round(
        canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2),
      );
      if (size === 0 || canvas.width === size) return;
      canvas.width = size;
      canvas.height = size;
      gl.viewport(0, 0, size, size);
      // about two device pixels of antialiasing on the sphere's edge
      gl.uniform1f(pixel, 5 / size);
    },
    draw(frame: OrbFrame) {
      if (gl.isContextLost()) return;
      for (const key of Object.keys(scalars) as (keyof typeof scalars)[]) {
        gl.uniform1f(scalars[key], frame[key]);
      }
      frame.colors.forEach((rgb, i) => gl.uniform3fv(colors[i], rgb));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

function VoiceOrb({
  state = "idle",
  level = 0,
  colors = DEFAULT_COLORS,
  onStart,
  onStop,
  onInterrupt,
  onClick,
  className,
  ...props
}: VoiceOrbProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = React.useState(false);
  const rgb = React.useMemo(() => colors.map(hexToRgb), [colors]);
  const latest = React.useRef({ state, level, rgb, reduceMotion });

  React.useEffect(() => {
    latest.current = {
      state,
      level: Math.min(1, Math.max(0, level)),
      rgb,
      reduceMotion,
    };
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = canvas && createOrbRenderer(canvas);
    if (!canvas || !renderer) {
      setUnsupported(true);
      return;
    }

    renderer.resize();
    const resizer = new ResizeObserver(renderer.resize);
    resizer.observe(canvas);

    let visible = true;
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    watcher.observe(canvas);

    const frame: OrbFrame = {
      time: 0,
      spin: 0,
      voice: 0,
      awake: 0,
      speak: 0,
      colors: latest.current.rgb,
    };
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;

      const { state, level, rgb, reduceMotion } = latest.current;
      const motion = reduceMotion ? 0 : dt;
      const awake = state === "idle" ? 0 : 1;
      const speaking = state === "speaking" ? 1 : 0;

      frame.voice += (level * awake - frame.voice) * 0.2;
      frame.awake += (awake - frame.awake) * 0.06;
      frame.speak += (speaking - frame.speak) * 0.06;
      frame.time += motion;
      frame.spin +=
        motion *
        (speaking ? -1 : 1) *
        (0.2 + 0.3 * frame.awake + 0.9 * frame.voice);
      frame.colors = rgb;
      renderer.draw(frame);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizer.disconnect();
      watcher.disconnect();
      renderer.dispose();
    };
  }, []);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (state === "idle") onStart?.();
    else if (state === "listening") onStop?.();
    else onInterrupt?.();
  }

  return (
    <button
      type="button"
      data-slot="voice-orb"
      data-state={state}
      aria-label={LABELS[state]}
      onClick={handleClick}
      className={cn(
        "relative size-32 cursor-pointer rounded-full outline-none transition-transform duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {unsupported ? (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, #0a0210 55%, ${colors[1]} 92%, ${colors[0]})`,
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[12.5%] size-[125%]"
        />
      )}
    </button>
  );
}

// reads the microphone while active and returns its loudness from 0 to 1
function useMicLevel(active: boolean) {
  const [level, setLevel] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | undefined;
    let context: AudioContext | undefined;

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        context.createMediaStreamSource(media).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);

        const read = () => {
          analyser.getByteTimeDomainData(samples);
          let sum = 0;
          for (const v of samples) sum += ((v - 128) / 128) ** 2;
          setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 5));
          raf = requestAnimationFrame(read);
        };
        read();
      })
      // a denied or missing mic leaves the level at 0
      .catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      context?.close();
    };
  }, [active]);

  return active ? level : 0;
}

export {
  VoiceOrb,
  useMicLevel,
  type VoiceOrbColors,
  type VoiceOrbProps,
  type VoiceOrbState,
};
export default VoiceOrb;
