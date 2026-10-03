// Test-only CSS interop; production always uses the real scoped stylesheet.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith("generator.module.css")) return nextResolve(new URL("./styles-test-interop.mjs", import.meta.url).href, context);
  return nextResolve(specifier, context);
}
