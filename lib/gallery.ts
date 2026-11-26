// repeats the items we have until a grid has `count` cards; layout scaffolding until the catalog fills up
export function fillForLayout<T>(items: T[], count: number): T[] {
  if (items.length === 0 || items.length >= count) return items;
  return Array.from({ length: count }, (_, i) => items[i % items.length]);
}
