import { defineArrayMember, defineField, defineType } from "sanity";
import { validatePublicUrl } from "./fields";

export const blockContent = defineType({
  name: "blockContent", title: "Kandungan artikel", type: "array",
  of: [defineArrayMember({
    type: "block",
    styles: [{ title: "Perenggan", value: "normal" }, { title: "Subtajuk", value: "h2" }, { title: "Subtajuk kecil", value: "h3" }],
    lists: [{ title: "Senarai", value: "bullet" }, { title: "Senarai bernombor", value: "number" }],
    marks: {
      decorators: [{ title: "Tebal", value: "strong" }, { title: "Condong", value: "em" }],
      annotations: [{
        name: "link", title: "Pautan", type: "object",
        fields: [defineField({ name: "href", title: "URL", type: "url", validation: (rule) => rule.required().uri({ scheme: ["http", "https"], allowRelative: true, allowCredentials: false }).custom(validatePublicUrl) })],
      }],
    },
  })],
});

/** Profile sections keep paragraph structure; page headings remain in the approved UI. */
export const paragraphText = defineType({
  name: "paragraphText", title: "Perenggan", type: "array",
  of: [defineArrayMember({
    type: "block", styles: [{ title: "Perenggan", value: "normal" }], lists: [],
    marks: { decorators: [{ title: "Tebal", value: "strong" }, { title: "Condong", value: "em" }], annotations: [] },
  })],
});
