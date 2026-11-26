"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Finish = "silver" | "graphite" | "sand";

// l and k, when given, set the corner exactly: how far the curve reaches along each edge, and how far its handles pull in
type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  l?: number;
  k?: number;
};

// a rounded rect with squircle corners: each curve starts 1.6r from the corner with its handles pulled in
function smoothRect({ x, y, w, h, r, l: reach, k = 0.17 }: Rect) {
  const l = Math.min(reach ?? r * 1.6, w / 2, h / 2);
  const c = l * k;
  return [
    `M${x + l} ${y}H${x + w - l}`,
    `C${x + w - c} ${y} ${x + w} ${y + c} ${x + w} ${y + l}V${y + h - l}`,
    `C${x + w} ${y + h - c} ${x + w - c} ${y + h} ${x + w - l} ${y + h}H${x + l}`,
    `C${x + c} ${y + h} ${x} ${y + h - c} ${x} ${y + h - l}V${y + l}`,
    `C${x} ${y + c} ${x + c} ${y} ${x + l} ${y}Z`,
  ].join("");
}

function plainRect({ x, y, w, h, r }: Rect) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

// colours measured across the metal band of a real render, outer edge first, ending in the dark seam against the glass
const BANDS: Record<Finish, { rings: string[]; button: string[] }> = {
  silver: {
    rings: [
      "#7B7B79",
      "#9A9A99",
      "#AFAFAF",
      "#BBBBBB",
      "#D5D5D4",
      "#DBDBDA",
      "#E7E7E6",
      "#A0A09F",
      "#6A6A68",
      "#525252",
    ],
    button: ["#A2A2A1", "#DCDCDC", "#ABABAB", "#90908E", "#7B7B79"],
  },
  graphite: {
    rings: [
      "#2A2A2B",
      "#38383A",
      "#444446",
      "#4E4E50",
      "#626265",
      "#6A6A6D",
      "#7C7C80",
      "#4A4A4C",
      "#2A2A2B",
      "#1E1E1F",
    ],
    button: ["#4A4A4C", "#7C7C80", "#505053", "#3A3A3C", "#2A2A2B"],
  },
  sand: {
    rings: [
      "#857B6D",
      "#A39889",
      "#B8AD9D",
      "#C3B8A8",
      "#D9CFC1",
      "#DED5C8",
      "#EAE3D8",
      "#A69C8E",
      "#716759",
      "#5A5144",
    ],
    button: ["#A99E8F", "#E0D7CA", "#B2A797", "#968B7C", "#857B6D"],
  },
};
const RING_AT = [0.06, 0.17, 0.28, 0.4, 0.51, 0.62, 0.74, 0.83, 0.91, 0.97];

function between(outer: Rect, inner: Rect, f: number): Rect {
  const mix = (a: number, b: number) => a + (b - a) * f;
  return {
    x: mix(outer.x, inner.x),
    y: mix(outer.y, inner.y),
    w: mix(outer.w, inner.w),
    h: mix(outer.h, inner.h),
    r: mix(outer.r, inner.r),
    l:
      outer.l !== undefined && inner.l !== undefined
        ? mix(outer.l, inner.l)
        : undefined,
    k:
      outer.k !== undefined && inner.k !== undefined
        ? mix(outer.k, inner.k)
        : undefined,
  };
}

// the band is drawn as rings that follow the shape and then softened, so the ramp reads the same all the way round
function MetalBand({
  id,
  outer,
  inner,
  finish,
}: {
  id: string;
  outer: Rect;
  inner: Rect;
  finish: Finish;
}) {
  const t = inner.x - outer.x;
  return (
    <>
      <defs>
        <clipPath id={`${id}-band`}>
          <path
            d={`${smoothRect(outer)}${smoothRect(inner)}`}
            clipRule="evenodd"
          />
        </clipPath>
        <filter id={`${id}-blend`} x="-2%" y="-2%" width="104%" height="104%">
          <feGaussianBlur stdDeviation={t * 0.05} />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8 0.02"
            numOctaves="2"
            seed="7"
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.16 -0.02" />
        </filter>
      </defs>
      <g clipPath={`url(#${id}-band)`}>
        <path d={smoothRect(outer)} fill={BANDS[finish].rings[4]} />
        <g filter={`url(#${id}-blend)`}>
          {BANDS[finish].rings.map((color, i) => (
            <path
              key={i}
              d={smoothRect(between(outer, inner, RING_AT[i]))}
              fill="none"
              stroke={color}
              strokeWidth={t * 0.14}
            />
          ))}
        </g>
        <rect
          x={outer.x}
          y={outer.y}
          width={outer.w}
          height={outer.h}
          filter={`url(#${id}-grain)`}
        />
      </g>
    </>
  );
}

function ButtonGradient({
  id,
  finish,
  flip = false,
}: {
  id: string;
  finish: Finish;
  flip?: boolean;
}) {
  const stops = BANDS[finish].button;
  return (
    <linearGradient
      id={id}
      x1={flip ? "1" : "0"}
      y1="0"
      x2={flip ? "0" : "1"}
      y2="0"
    >
      {stops.map((color, i) => (
        <stop key={i} offset={i / (stops.length - 1)} stopColor={color} />
      ))}
    </linearGradient>
  );
}

// black glass between metal and screen, with the soft lift that fades in from the metal edge
function Bezel({
  id,
  outer,
  screen,
  glow,
}: {
  id: string;
  outer: Rect;
  screen: Rect;
  glow: number;
}) {
  return (
    <>
      <defs>
        <clipPath id={`${id}-glass`}>
          <path
            d={`${smoothRect(outer)}${smoothRect(screen)}`}
            clipRule="evenodd"
          />
        </clipPath>
        <filter id={`${id}-soft`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={glow * 0.35} />
        </filter>
      </defs>
      <path
        d={`${smoothRect(outer)}${smoothRect(screen)}`}
        fill="#000000"
        fillRule="evenodd"
      />
      <g clipPath={`url(#${id}-glass)`}>
        <path
          d={smoothRect(outer)}
          fill="none"
          stroke="#303030"
          strokeWidth={glow}
          filter={`url(#${id}-soft)`}
        />
      </g>
    </>
  );
}

function Lens({ id }: { id: string }) {
  return (
    <radialGradient id={id} cx="0.4" cy="0.4" r="0.6">
      <stop offset="0" stopColor="#2B3A63" />
      <stop offset="0.5" stopColor="#0E1220" />
      <stop offset="1" stopColor="#050507" />
    </radialGradient>
  );
}

function useSvgId() {
  return React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

type MockupProps = React.ComponentProps<"div"> & {
  size: [number, number];
  screen: Rect;
  frame: React.ReactNode;
  label: string;
};

// the svg frame sits on top with a hole where the screen is; content underneath shows through and stays interactive
function Mockup({
  size: [w, h],
  screen,
  frame,
  label,
  className,
  style,
  children,
  ...props
}: MockupProps) {
  const pct = (value: number, of: number) => `${(value / of) * 100}%`;
  const radius = screen.r * 0.9;
  return (
    <div
      className={cn("relative", className)}
      style={{ aspectRatio: `${w} / ${h}`, ...style }}
      {...props}
    >
      <div
        className="absolute overflow-hidden bg-white"
        style={{
          left: pct(screen.x, w),
          top: pct(screen.y, h),
          width: pct(screen.w, w),
          height: pct(screen.h, h),
          borderRadius: `${pct(radius, screen.w)} / ${pct(radius, screen.h)}`,
        }}
      >
        {children}
      </div>
      <svg
        data-mockup={label}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={label}
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        {frame}
      </svg>
    </div>
  );
}

function StatusBar({ time, tone }: { time: string; tone: "dark" | "light" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[8%] items-center justify-between px-[8%] pt-[1%] [container-type:inline-size]",
        tone === "dark" ? "text-black" : "text-white",
      )}
    >
      <span className="w-[18cqw] text-center text-[4.4cqw] font-semibold tabular-nums tracking-tight">
        {time}
      </span>
      <span className="flex items-center gap-[1.4cqw]">
        <svg viewBox="0 0 18 12" className="h-[3.2cqw]" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" className="h-[3.2cqw]" fill="currentColor">
          <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.3A10.6 10.6 0 0 0 8 .6C5.2.6 2.6 1.7.8 3.5L2 4.8a8.8 8.8 0 0 1 6-2.4Zm0 3.6c1.4 0 2.7.5 3.6 1.4l1.3-1.3A7 7 0 0 0 8 4.2a7 7 0 0 0-4.9 1.9l1.3 1.3C5.3 6.5 6.6 6 8 6Zm0 3.5c.6 0 1.2.2 1.6.6L8 11.8 6.4 10.1c.4-.4 1-.6 1.6-.6Z" />
        </svg>
        <svg viewBox="0 0 27 13" className="h-[3.4cqw]" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="23"
            height="12"
            rx="3.8"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect
            x="2.5"
            y="2.5"
            width="19"
            height="8"
            rx="2.2"
            fill="currentColor"
          />
          <path
            d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z"
            fill="currentColor"
            fillOpacity="0.45"
          />
        </svg>
      </span>
    </div>
  );
}

const PHONE = {
  size: [1350, 2760] as [number, number],
  screen: { x: 72, y: 69, w: 1206, h: 2621, r: 122, l: 216, k: 0.34 },
};

type PhoneProps = React.ComponentProps<"div"> & {
  finish?: Finish;
  statusBar?: boolean;
  statusBarTone?: "dark" | "light";
  time?: string;
};

function Phone({
  finish = "silver",
  statusBar = false,
  statusBarTone = "dark",
  time = "9:41",
  className,
  children,
  ...props
}: PhoneProps) {
  const id = useSvgId();
  // corner shapes fitted to a real render, so the curves match it to within a pixel
  const outer = { x: 25, y: 22, w: 1300, h: 2715, r: 165, l: 256, k: 0.38 };
  const bezel = { x: 47, y: 41, w: 1256, h: 2677, r: 152, l: 220, k: 0.42 };
  const left = [
    [580, 125],
    [797, 203],
    [1054, 203],
  ];
  return (
    <Mockup
      data-slot="phone"
      size={PHONE.size}
      screen={PHONE.screen}
      label="Phone"
      className={cn(
        "w-[300px] drop-shadow-[0_24px_28px_rgb(0_0_0/0.16)]",
        className,
      )}
      frame={
        <>
          <defs>
            <ButtonGradient id={`${id}-button`} finish={finish} />
            <ButtonGradient id={`${id}-button-r`} finish={finish} flip />
            <Lens id={`${id}-lens`} />
          </defs>
          {left.map(([y, h]) => (
            <rect
              key={y}
              x="16"
              y={y}
              width="14"
              height={h}
              rx="5"
              fill={`url(#${id}-button)`}
            />
          ))}
          <rect
            x="1320"
            y="867"
            width="14"
            height="321"
            rx="5"
            fill={`url(#${id}-button-r)`}
          />
          <MetalBand id={id} outer={outer} inner={bezel} finish={finish} />
          <Bezel id={id} outer={bezel} screen={PHONE.screen} glow={20} />
          <rect
            x="491"
            y="111"
            width="367"
            height="108"
            rx="54"
            fill="#000000"
          />
          <circle cx="804" cy="165" r="30" fill="#050505" />
          <circle cx="804" cy="165" r="15" fill={`url(#${id}-lens)`} />
        </>
      }
      {...props}
    >
      {children}
      {statusBar && <StatusBar time={time} tone={statusBarTone} />}
    </Mockup>
  );
}

const LAPTOP = {
  size: [1928, 1166] as [number, number],
  screen: { x: 198, y: 29, w: 1532, h: 996, r: 10 },
};

type LaptopProps = React.ComponentProps<"div"> & {
  notch?: boolean;
};

// profile measured down the front edge of the base: a lit top face that rolls into shadow and catches light again underneath
const BASE_STOPS: [number, string][] = [
  [0, "#E8E8EA"],
  [0.06, "#DBDCDD"],
  [0.15, "#DDDEE0"],
  [0.35, "#D8D9D9"],
  [0.45, "#CFD0D1"],
  [0.52, "#B5B6B6"],
  [0.6, "#A6A7A8"],
  [0.68, "#9A9B9C"],
  [0.72, "#929395"],
  [0.78, "#97989A"],
  [0.83, "#9B9C9E"],
  [0.88, "#ACAEAF"],
  [0.93, "#C8C8CA"],
  [0.96, "#D6D7D9"],
  [1, "#B7B8BA"],
];

function Laptop({ notch = true, className, children, ...props }: LaptopProps) {
  const id = useSvgId();
  const lid = "M205 0H1723Q1759 0 1759 36V1085H169V36Q169 0 205 0Z";
  const bezel =
    "M205.5 4.5H1722.5Q1754.5 4.5 1754.5 36.5V1085H173.5V36.5Q173.5 4.5 205.5 4.5Z";
  const base =
    "M6 1085H1922Q1928 1085 1928 1091V1121C1928 1140 1916 1155 1874 1155H54C12 1155 0 1140 0 1121V1091Q0 1085 6 1085Z";
  // the finger scoop: straight sides that curve into a wide, soft bottom
  const lip =
    "M797 1087H1130C1130 1099 1126 1109 1112 1109H815C801 1109 797 1099 797 1087Z";
  return (
    <Mockup
      data-slot="laptop"
      size={LAPTOP.size}
      screen={LAPTOP.screen}
      label="Laptop"
      className={cn(
        "w-[720px] drop-shadow-[0_24px_24px_rgb(0_0_0/0.14)]",
        className,
      )}
      frame={
        <>
          <defs>
            <linearGradient id={`${id}-chin`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#282928" />
              <stop offset="1" stopColor="#131312" />
            </linearGradient>
            <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
              {BASE_STOPS.map(([offset, color]) => (
                <stop key={offset} offset={offset} stopColor={color} />
              ))}
            </linearGradient>
            <linearGradient id={`${id}-ends`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#000000" stopOpacity="0.05" />
              <stop offset="0.025" stopColor="#000000" stopOpacity="0.24" />
              <stop offset="0.12" stopColor="#000000" stopOpacity="0.2" />
              <stop offset="0.3" stopColor="#000000" stopOpacity="0.06" />
              <stop offset="0.45" stopColor="#000000" stopOpacity="0" />
              <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
              <stop offset="0.7" stopColor="#000000" stopOpacity="0.06" />
              <stop offset="0.88" stopColor="#000000" stopOpacity="0.2" />
              <stop offset="0.975" stopColor="#000000" stopOpacity="0.24" />
              <stop offset="1" stopColor="#000000" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <filter
              id={`${id}-glint-blur`}
              x="-50%"
              y="-10%"
              width="200%"
              height="120%"
            >
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#EAEAEA" />
              <stop offset="0.45" stopColor="#F5F5F5" />
              <stop offset="1" stopColor="#FBFBFB" />
            </linearGradient>
            <linearGradient id={`${id}-lip-walls`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3A3A3A" stopOpacity="0.75" />
              <stop offset="0.012" stopColor="#3A3A3A" stopOpacity="0.4" />
              <stop offset="0.035" stopColor="#3A3A3A" stopOpacity="0" />
              <stop offset="0.965" stopColor="#3A3A3A" stopOpacity="0" />
              <stop offset="0.988" stopColor="#3A3A3A" stopOpacity="0.4" />
              <stop offset="1" stopColor="#3A3A3A" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#AAABAC" />
              <stop offset="0.3" stopColor="#D1D2D3" />
              <stop offset="0.55" stopColor="#C7C8C9" />
              <stop offset="0.8" stopColor="#DDDEDF" />
              <stop offset="1" stopColor="#787979" />
            </linearGradient>
            <linearGradient id={`${id}-pad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#222221" />
              <stop offset="0.2" stopColor="#4A4A4A" />
              <stop offset="0.7" stopColor="#464645" />
              <stop offset="1" stopColor="#353635" />
            </linearGradient>
            <filter id={`${id}-brush`} x="0" y="0" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="2"
                seed="3"
              />
              <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.52  0 0 0 0.55 -0.2" />
            </filter>
            <clipPath id={`${id}-base-clip`}>
              <path d={base} />
            </clipPath>
            <Lens id={`${id}-lens`} />
          </defs>

          <path d={`${lid}${bezel}`} fill="#C4C5C7" fillRule="evenodd" />
          <path d={bezel} fill="none" stroke="#8E8F90" strokeWidth="1.5" />
          <path
            d={`${bezel}${plainRect(LAPTOP.screen)}`}
            fill="#070607"
            fillRule="evenodd"
          />
          {notch && (
            <>
              <path
                d="M870 29H1058V52Q1058 62 1048 62H880Q870 62 870 52Z"
                fill="#070607"
              />
              <circle cx="964" cy="37" r="6" fill="#141414" />
              <circle cx="964" cy="37" r="3" fill={`url(#${id}-lens)`} />
            </>
          )}
          <rect
            x="173.5"
            y="1041"
            width="1581"
            height="44"
            fill={`url(#${id}-chin)`}
          />

          <path d={base} fill={`url(#${id}-base)`} />
          <g clipPath={`url(#${id}-base-clip)`}>
            <rect
              x="0"
              y="1085"
              width="1928"
              height="70"
              filter={`url(#${id}-brush)`}
            />
            <rect
              x="0"
              y="1085"
              width="1928"
              height="70"
              fill={`url(#${id}-ends)`}
            />
            {/* where the base turns the corner it catches the light in a soft vertical streak */}
            <rect
              x="10"
              y="1088"
              width="22"
              height="44"
              rx="8"
              fill={`url(#${id}-glint)`}
              filter={`url(#${id}-glint-blur)`}
            />
            <rect
              x="1896"
              y="1088"
              width="22"
              height="44"
              rx="8"
              fill={`url(#${id}-glint)`}
              filter={`url(#${id}-glint-blur)`}
            />
          </g>
          <path d={lip} fill={`url(#${id}-lip)`} />
          <path d={lip} fill={`url(#${id}-lip-walls)`} />
          <path d="M169 1086H1759" stroke="#2A2A2A" strokeWidth="2" />
          {[107, 1698].map((x) => (
            <g key={x}>
              <path
                d={`M${x + 4} 1165H${x + 119}L${x + 116} 1160H${x + 7}Z`}
                fill={`url(#${id}-pad)`}
              />
              <path
                d={`M${x} 1155H${x + 123}L${x + 121} 1160H${x + 2}Z`}
                fill={`url(#${id}-ring)`}
              />
            </g>
          ))}
        </>
      }
      {...props}
    >
      {children}
    </Mockup>
  );
}

type TabletProps = React.ComponentProps<"div"> & {
  finish?: Finish;
  orientation?: "landscape" | "portrait";
};

function Tablet({
  finish = "silver",
  orientation = "landscape",
  className,
  children,
  ...props
}: TabletProps) {
  const id = useSvgId();
  const landscape = orientation === "landscape";
  const [w, h] = landscape ? [1000, 700] : [700, 1000];
  const outer = { x: 0, y: 0, w, h, r: 56 };
  const bezel = { x: 8, y: 8, w: w - 16, h: h - 16, r: 48 };
  const screen = { x: 34, y: 34, w: w - 68, h: h - 68, r: 22 };
  return (
    <Mockup
      data-slot="tablet"
      size={[w, h]}
      screen={screen}
      label="Tablet"
      className={cn(
        landscape ? "w-[560px]" : "w-[400px]",
        "drop-shadow-[0_24px_28px_rgb(0_0_0/0.16)]",
        className,
      )}
      frame={
        <>
          <defs>
            <Lens id={`${id}-lens`} />
          </defs>
          <MetalBand id={id} outer={outer} inner={bezel} finish={finish} />
          <Bezel id={id} outer={bezel} screen={screen} glow={10} />
          <circle cx={w / 2} cy="21" r="4.5" fill={`url(#${id}-lens)`} />
        </>
      }
      {...props}
    >
      {children}
    </Mockup>
  );
}

const BROWSER = {
  size: [1200, 760] as [number, number],
  screen: { x: 1, y: 53, w: 1198, h: 706, r: 13 },
};

type BrowserWindowProps = React.ComponentProps<"div"> & {
  url?: string;
};

function BrowserWindow({
  url = "rareui.com",
  className,
  children,
  ...props
}: BrowserWindowProps) {
  const id = useSvgId();
  return (
    <Mockup
      data-slot="browser-window"
      size={BROWSER.size}
      screen={BROWSER.screen}
      label="Browser window"
      className={cn(
        "w-[720px] drop-shadow-[0_20px_30px_rgb(0_0_0/0.18)]",
        className,
      )}
      frame={
        <>
          <defs>
            <clipPath id={`${id}-window`}>
              <path d={plainRect({ x: 0, y: 0, w: 1200, h: 760, r: 14 })} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-window)`}>
            <path d={`M0 0H1200V53H0Z`} fill="#F5F5F7" />
            <path d="M0 52.5H1200" stroke="#000000" strokeOpacity="0.08" />
          </g>
          <path
            d={plainRect({ x: 0.5, y: 0.5, w: 1199, h: 759, r: 13.5 })}
            fill="none"
            stroke="#000000"
            strokeOpacity="0.1"
          />
          <circle cx="28" cy="26.5" r="6.5" fill="#FF5F57" />
          <circle cx="50" cy="26.5" r="6.5" fill="#FEBC2E" />
          <circle cx="72" cy="26.5" r="6.5" fill="#28C840" />
          <rect
            x="420"
            y="13"
            width="360"
            height="27"
            rx="8"
            fill="#000000"
            fillOpacity="0.05"
          />
          <text
            x="600"
            y="31"
            textAnchor="middle"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontSize="13"
            fill="#6E6E73"
          >
            {url}
          </text>
        </>
      }
      {...props}
    >
      {children}
    </Mockup>
  );
}

export { Phone, Laptop, Tablet, BrowserWindow, type Finish };
