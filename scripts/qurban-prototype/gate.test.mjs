import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
// Execute the actual transpiled server component, with only UI imports stubbed.
// No web service, environment file or database client is imported.
const compiled = ts.transpileModule(readFileSync("src/app/%5F%5Freview/qurban/page.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function render(env) {
  const compiledModule = { exports: {} };
  const context = vm.createContext({ module: compiledModule, exports: compiledModule.exports, URL,
    process: { env },
    require(name) {
      if (name === "next/navigation") return { notFound() { throw new Error("404"); } };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
      if (name === "@/components/public/public-page-layout") return { PublicPageLayout: "public-shell" };
      if (name === "./prototype") return { default: "dummy-ui" };
      if (name === "./prototype.css") return {};
      throw new Error("Unexpected integration import: " + name);
    },
  });
  vm.runInContext(compiled, context);
  return compiledModule.exports.default();
}
for (const [environment, flag, allowed] of [
  ["development", "1", true], ["development", undefined, false], ["development", "0", false],
  ["development", "true", false], ["development", " 1", false],
  ["production", "1", false], ["production", undefined, false], ["test", "1", false],
]) {
  test("actual page gate: " + environment + ", flag=" + String(flag), () => {
    const env = { NODE_ENV: environment, QURBAN_PROTOTYPE: flag };
    if (allowed) assert.equal(render(env).type, "public-shell");
    else assert.throws(() => render(env), /^Error: 404$/);
  });
}
for (const [setting, expected] of [
  [undefined, undefined],
  ["https://chat.whatsapp.com/DEMOREVIEWONLY", "https://chat.whatsapp.com/DEMOREVIEWONLY"],
  ["javascript:alert(1)", undefined],
  ["https://example.test/invite", undefined],
  ["http://chat.whatsapp.com/DEMO", undefined],
  ["https://user:password@chat.whatsapp.com/DEMO", undefined],
  ["https://chat.whatsapp.com/DEMO?tracking=1", undefined],
  ["not-a-url", undefined],
]) {
  test("optional local group setting: " + String(setting), () => {
    const shell = render({ NODE_ENV: "development", QURBAN_PROTOTYPE: "1", QURBAN_PROTOTYPE_VOLUNTEER_WHATSAPP_GROUP_URL: setting });
    assert.equal(shell.props.children.props.volunteerWhatsappGroupUrl, expected);
  });
}

// Render the actual success components without navigating any external invite.
// Browser tests cover the public form; the state stub starts this isolated render at success.
for (const groupUrl of [undefined, "https://chat.whatsapp.com/DEMOREVIEWONLY"]) {
  test("actual volunteer success markup, group " + (groupUrl ? "configured" : "absent"), () => {
    const ui = ts.transpileModule(readFileSync("src/app/%5F%5Freview/qurban/prototype.tsx", "utf8") + "\nexport { VolunteerForm };", {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const compiledModule = { exports: {} };
    let stateIndex = 0;
    const context = vm.createContext({ module: compiledModule, exports: compiledModule.exports,
      require(name) {
        if (name === "react/jsx-runtime") return require(name);
        if (name === "react") return {
          useEffect() {}, useRef() { return { current: null }; },
          useState(initial) { stateIndex++; return [stateIndex === 7 ? "VOL-DEMO-TEST" : typeof initial === "function" ? initial() : initial, () => {}]; },
        };
        throw new Error("Unexpected UI integration: " + name);
      },
    });
    vm.runInContext(ui, context);
    const element = compiledModule.exports.VolunteerForm({ home() {}, whatsappGroupUrl: groupUrl });
    const html = require("react-dom/server").renderToStaticMarkup(element);
    assert.match(html, /Pendaftaran sukarelawan dummy berjaya/);
    assert.match(html, /Jangan lupa sertai group WhatsApp rasmi sukarelawan/);
    if (groupUrl) {
      assert.match(html, /href="https:\/\/chat.whatsapp.com\/DEMOREVIEWONLY"/);
      assert.match(html, /Sertai Group WhatsApp Sukarelawan/);
      assert.doesNotMatch(html, /Pautan group WhatsApp belum dibuka/);
    } else {
      assert.match(html, /Pautan group WhatsApp belum dibuka oleh urus setia./);
      assert.match(html, /Pihak masjid akan menyediakan group apabila hampir dengan tarikh program./);
      assert.doesNotMatch(html, /chat.whatsapp.com/);
    }
  });
}
