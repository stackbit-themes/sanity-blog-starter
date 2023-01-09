import type Author from './author'

type PostType = {
  _id: string
  slug: string
  title: string
  date: string
  coverImage: string
  author: Author
  excerpt: string
  ogImage: {
    url: string
  }
  content: string
  translations?: Record<string, string>
  __i18n_lang?: string
}

export default PostType
