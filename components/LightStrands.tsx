// the light strands signature from DESIGN.md; the parent sets --strands-surface to its own background
export default function LightStrands() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(130%_115%_at_0%_100%,#000_35%,transparent_80%)]">
      {/* a wide wash and a hot core sweep up from the bottom-left corner; a low beam runs along the floor */}
      <div className="absolute bottom-0 left-0 h-[55%] w-[150%] origin-bottom-left -translate-x-[12%] translate-y-[38%] -rotate-[42deg] bg-[linear-gradient(90deg,#FFE2C4_0%,#FF9A52_12%,#FC4C01_30%,rgba(252,76,1,0.45)_50%,transparent_75%)] blur-[34px]" />
      <div className="absolute bottom-0 left-0 h-[40%] w-[120%] origin-bottom-left -translate-x-[6%] translate-y-[30%] -rotate-[12deg] bg-[linear-gradient(90deg,#FFB878_0%,#FC4C01_22%,rgba(200,50,0,0.55)_45%,transparent_72%)] blur-[30px]" />
      <div className="absolute bottom-0 left-0 h-[18%] w-[110%] origin-bottom-left -translate-x-[4%] translate-y-[20%] -rotate-[40deg] bg-[linear-gradient(90deg,#FFF5EA_0%,#FFC08A_10%,#FF7A2A_26%,rgba(252,76,1,0.2)_55%,transparent_78%)] blur-[14px]" />
      {/* fine strands along the main beam, so it reads as light through fibre rather than a blob */}
      <div className="absolute bottom-0 left-0 h-[55%] w-[150%] origin-bottom-left -translate-x-[12%] translate-y-[38%] -rotate-[42deg] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_6px)] [mask-image:linear-gradient(90deg,#000_0%,rgba(0,0,0,0.5)_30%,transparent_60%)] blur-[0.6px]" />
      {/* keeps the top of the surface, where the copy sits, clean */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--strands-surface)_28%,transparent_62%)]" />
    </div>
  );
}
