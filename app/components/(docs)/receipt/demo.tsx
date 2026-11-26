"use client";

import Receipt from "@/components/pro/receipt";

export default function ReceiptDemo() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto p-6">
      <Receipt
        merchant={{ name: "Corner Café", address: "14 Mill Lane, Bristol" }}
        meta={["27 Nov 2026", "Card ···· 4242"]}
        items={[
          { label: "Flat white", price: 4.5, qty: 2, note: "Oat milk" },
          { label: "Almond croissant", price: 3.75 },
          { label: "Banana bread", price: 3.25 },
        ]}
        adjustments={[{ label: "Loyalty discount", amount: -1.5 }]}
        tax={{ label: "VAT", rate: 0.05 }}
        currency="GBP"
        locale="en-GB"
        footer="See you tomorrow"
        barcode="CC-20481127"
      />
      <p className="text-sm text-foreground/50">Press the button on the printer to print it again.</p>
    </div>
  );
}
