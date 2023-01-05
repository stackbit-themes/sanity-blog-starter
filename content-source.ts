import path from "path";
import {
  ContentSourceOptions,
  SanityContentSource,
} from "@stackbit/cms-sanity";
import * as ContentSourceTypes from "@stackbit/types";

export class LocalizedSanityContentSource extends SanityContentSource {
  private languageFile: string;

  constructor(options: ContentSourceOptions & { languageFile: string }) {
    super(options);
    this.languageFile = path.join(options.rootPath, options.languageFile);
  }

  async getLocales(): Promise<ContentSourceTypes.Locale[]> {
    const languageConfig = require(this.languageFile);
    const languages = languageConfig.languages;
    return languages.map((lang, i) => {
      return {
        default:
          (languageConfig.base && languageConfig.base === lang.id) || i === 0,
        code: lang.id,
      };
    });
  }
}
