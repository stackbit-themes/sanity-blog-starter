const languageConfig = require("../config/@sanity/document-internationalization.json");

export default {
  supportedLanguages: languageConfig.languages,
  defaultLanguages: [languageConfig.base],
  documentTypes: ["author"],
  filterField: (enclosingType, field, selectedLanguageIds) =>
    !enclosingType.name.startsWith("locale") ||
    selectedLanguageIds.includes(field.name.replace("_", "-")),
};
