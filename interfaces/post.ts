import type Author from './author'

type PostType = {
  id: string
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
  locale?: string
}

export default PostType
