import { RAREUI_PETALS } from "@/components/logos";

const PIVOT_X = 131;
const PIVOT_Y = 136;
// a petal tip sits this far from the pivot, as a fraction of the flower radius
const REACH = 0.84;

// height map resolution relative to the canvas; it is blurred, so a quarter is plenty
export const HEIGHT_DOWNSCALE = 4;

const paths = () => RAREUI_PETALS.map((d) => new Path2D(d));

function drawFlower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  petals: Path2D[],
) {
  const k = (radius * REACH) / PIVOT_Y;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.translate(-PIVOT_X, -PIVOT_Y);
  ctx.fillStyle = "#fff";
  for (const petal of petals) ctx.fill(petal);
  ctx.restore();
}

function supportsFilter(ctx: CanvasRenderingContext2D) {
  ctx.filter = "blur(1px)";
  const ok = ctx.filter === "blur(1px)";
  ctx.filter = "none";
  return ok;
}

export type FlowerMaps = {
  mask: HTMLCanvasElement;
  height: HTMLCanvasElement;
  heightPad: number;
  bevel: number;
};

// the browser rasterizes the real petal curves at screen resolution, so edges are exact at any size
export function buildFlowerMaps(width: number, height: number, radius: number, bevel: number): FlowerMaps | null {
  const petals = paths();

  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const maskCtx = mask.getContext("2d");
  if (!maskCtx) return null;
  drawFlower(maskCtx, width / 2, height / 2, radius, petals);

  const lowBevel = bevel / HEIGHT_DOWNSCALE;
  // padding keeps the blur from fading the petals where they run off the canvas
  const pad = Math.ceil(lowBevel * 3);
  const lowW = Math.ceil(width / HEIGHT_DOWNSCALE) + pad * 2;
  const lowH = Math.ceil(height / HEIGHT_DOWNSCALE) + pad * 2;
  const heightMap = document.createElement("canvas");
  heightMap.width = lowW;
  heightMap.height = lowH;
  const heightCtx = heightMap.getContext("2d");
  if (!heightCtx) return null;

  const lowCx = pad + width / HEIGHT_DOWNSCALE / 2;
  const lowCy = pad + height / HEIGHT_DOWNSCALE / 2;
  const lowRadius = radius / HEIGHT_DOWNSCALE;

  if (supportsFilter(heightCtx)) {
    heightCtx.filter = `blur(${lowBevel}px)`;
    drawFlower(heightCtx, lowCx, lowCy, lowRadius, petals);
    heightCtx.filter = "none";
  } else {
    // no canvas filter (older safari): shrink then smooth back up, which reads as a soft blur
    const shrink = Math.max(1, lowBevel / 2);
    const tiny = document.createElement("canvas");
    tiny.width = Math.max(1, Math.round(lowW / shrink));
    tiny.height = Math.max(1, Math.round(lowH / shrink));
    const tinyCtx = tiny.getContext("2d");
    if (!tinyCtx) return null;
    drawFlower(tinyCtx, lowCx / shrink, lowCy / shrink, lowRadius / shrink, petals);
    heightCtx.imageSmoothingEnabled = true;
    heightCtx.imageSmoothingQuality = "high";
    heightCtx.drawImage(tiny, 0, 0, lowW, lowH);
  }

  return { mask, height: heightMap, heightPad: pad, bevel };
}
