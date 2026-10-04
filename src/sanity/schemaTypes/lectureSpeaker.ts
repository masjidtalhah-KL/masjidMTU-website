import { defineField, defineType } from "sanity";

export const lectureSpeaker = defineType({
  name: "lectureSpeaker", title: "Penceramah (internal)", type: "document", readOnly: true,
  description: "Reusable Penceramah profiles. Library editing and publication remain disabled in this phase.",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required().max(160) }),
    defineField({ name: "photo", title: "Portrait (optional)", type: "editorialImage" }),
    defineField({ name: "defaultTopic", title: "Default topic / kitab (optional)", type: "string", validation: (r) => r.max(160) }),
    defineField({ name: "isActive", title: "Active", type: "boolean", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "name", subtitle: "defaultTopic", media: "photo" }, prepare: ({ title, subtitle, media }) => ({ title: title || "New Penceramah", subtitle, media }) },
});
