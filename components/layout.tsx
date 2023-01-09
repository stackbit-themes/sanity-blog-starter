import Footer, { Language } from './footer'
import Meta from './meta'

type Props = {
  preview?: boolean
  children: React.ReactNode
  languages?: Language[]
  translations?: Record<string, string>
  currentLocale?: string
}

const Layout = ({ languages, children, translations, currentLocale }: Props) => {
  return (
    <>
      <Meta />
      <div className="min-h-screen">
        <main>{children}</main>
      </div>
      <Footer currentLocale={currentLocale} languages={languages} translations={translations}/>
    </>
  )
}

export default Layout
