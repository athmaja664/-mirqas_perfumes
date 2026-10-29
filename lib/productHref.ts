// One place that decides where a product card links to.
// "Silky Oudh" -> "/product/silky-oudh"

export const slugOf = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function productHref(p: { slug?: string; name: string }) {
  return `/product/${p.slug ?? slugOf(p.name)}`;
}