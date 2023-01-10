import Container from "../components/container";
import MoreStories from "../components/more-stories";
import HeroPost from "../components/hero-post";
import Intro from "../components/intro";
import Layout from "../components/layout";
import { getAllPosts } from "../lib/api";
import Head from "next/head";
import { CMS_NAME } from "../lib/constants";
import Post from "../interfaces/post";
import { Language } from "../components/footer";
import { useEffect } from "react";

type Props = {
  allPosts: Post[];
  languages: Language[];
  translations: Record<string, string>;
  currentLocale: string;
};

export default function Index({
  allPosts,
  languages,
  translations,
  currentLocale,
}: Props) {
  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);

  useEffect(() => {
    window.addEventListener('stackbitLocaleChanged', (event) => {
      const locale = (event as any)?.detail?.locale;
      console.log('Locale changed in Stackbit: ', locale);
      if (locale && translations[locale] && location.href !== translations[locale]) {
        location.href = translations[locale];
      }
    })
  }, [])

  return (
    <>
      <Layout
        currentLocale={currentLocale}
        translations={translations}
        languages={languages}
      >
        <Head>
          <title>{`Next.js Blog Example with ${CMS_NAME}`}</title>
        </Head>
        <Container>
          <Intro />
          {heroPost && (
            <HeroPost
              postId={heroPost.id}
              title={heroPost.title}
              coverImage={heroPost.coverImage}
              date={heroPost.date}
              author={heroPost.author}
              slug={heroPost.slug}
              excerpt={heroPost.excerpt}
            />
          )}
          {morePosts.length > 0 && <MoreStories posts={morePosts} />}
        </Container>
      </Layout>
    </>
  );
}

export const getStaticProps = async (context) => {
  const languageConfig = require("../studio/config/@sanity/document-internationalization.json");
  const languages = languageConfig.languages;
  const translations = languages.reduce((accum, curr) => {
    accum[curr.id] = "/" + curr.id;
    return accum;
  }, {});
  const currentLocale = context.params.locale?.[0] || languageConfig.base;
  const allPosts = await getAllPosts(
    currentLocale,
    currentLocale == languageConfig.base
  );
  return {
    props: {
      currentLocale,
      allPosts,
      languages,
      translations,
    },
  };
};

export async function getStaticPaths() {
  const languages =
    require("../studio/config/@sanity/document-internationalization.json").languages;
  return {
    paths: [{ id: "" }, ...languages].map((lang) => {
      return {
        params: {
          locale: [lang.id],
        },
      };
    }),
    fallback: false,
  };
}
