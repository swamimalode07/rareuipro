import { BrowserWindow, Laptop, Phone, Tablet } from "@/components/pro/device-mockups";

type Device = "Phone" | "Laptop" | "Tablet" | "Browser";

export default function MockupDemo({ device }: { device: Device }) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      {device === "Phone" && <Phone className="w-[260px]" />}
      {device === "Laptop" && <Laptop className="w-full max-w-[640px]" />}
      {device === "Tablet" && <Tablet className="w-full max-w-[520px]" />}
      {device === "Browser" && <BrowserWindow className="w-full max-w-[640px]" />}
    </div>
  );
}
