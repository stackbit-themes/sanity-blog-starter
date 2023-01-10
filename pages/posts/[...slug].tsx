import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Container from '../../components/container'
import PostBody from '../../components/post-body'
import Header from '../../components/header'
import PostHeader from '../../components/post-header'
import Layout from '../../components/layout'
import { getPostBySlug, getAllPosts, getTranslations } from '../../lib/api'
import PostTitle from '../../components/post-title'
import Head from 'next/head'
import { CMS_NAME } from '../../lib/constants'
import markdownToHtml from '../../lib/markdownToHtml'
import type PostType from '../../interfaces/post'
import { Language } from '../../components/footer'
import { useEffect } from 'react'

type Props = {
  post: PostType
  languages: Language[]
  translations: Record<string, string>
  currentLocale: string
}

export default function Post({ post, languages, translations, currentLocale }: Props) {
  const router = useRouter()
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }
  useEffect(() => {
    window.addEventListener('stackbitLocaleChanged', (event) => {
      const locale = event?.detail?.locale;
      console.log('Locale changed in Stackbit: ', locale);
      if (locale && translations[locale] && location.href !== translations[locale]) {
        location.href = translations[locale];
      }
    })
  }, [])
  return (
    <Layout languages={languages} translations={translations} currentLocale={currentLocale}>
      <Container>
        <Header homeUrl={'/' + currentLocale} />
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article className="mb-32" data-sb-object-id={post._id}>
              <Head>
                <title>
                  {`${post.title} | Next.js Blog Example with ${CMS_NAME}`}
                </title>
                {post.ogImage && <meta property="og:image" content={post.ogImage.url} />}
              </Head>
              <PostHeader
                title={post.title}
                coverImage={post.coverImage}
                date={post.date}
                author={post.author}
              />
              <PostBody content={post.content} />
            </article>
          </>
        )}
      </Container>
    </Layout>
  )
}

type Params = {
  params: {
    slug: string[]
  }
}

export async function getStaticProps({ params }: Params) {
  const post = await getPostBySlug(params.slug.join('/'))
  const content = await markdownToHtml(post.content || '')
  const languageConfig = require('../../studio/config/@sanity/document-internationalization.json');
  return {
    props: {
      currentLocale: post.__i18n_lang || languageConfig.base,
      languages: languageConfig.languages,
      post: {
        ...post,
        content
      },
      translations: await getTranslations(post)
    },
  }
}

export async function getStaticPaths() {
  const posts = await getAllPosts()

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug.split('/').filter(Boolean),
        },
      }
    }),
    fallback: false,
  }
}
