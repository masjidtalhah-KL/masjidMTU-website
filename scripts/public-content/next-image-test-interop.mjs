import React from "react";
import { createRequire } from "node:module";
const Image = createRequire(import.meta.url)("next/image").default;
// Run the real Next Image component with correct CommonJS interop in the offline Jiti harness.
export default function NextImageInterop(props) { return React.createElement(Image, props); }
