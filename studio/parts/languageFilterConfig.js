export default {
  supportedLanguages: [
    { id: "en", title: "English" },
    { id: "es", title: "Spanish" },
    { id: "fr", title: "French" }
  ],
  defaultLanguages: ["en"],
  documentTypes: ["author"],
  filterField: (enclosingType, field, selectedLanguageIds) =>
    !enclosingType.name.startsWith("locale") ||
    selectedLanguageIds.includes(field.name),
};
