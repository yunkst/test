import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/locale'
import { LoginForm } from './login-form'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/login'>): Promise<Metadata> {
  const { lang } = await params
  return { title: getDictionary(lang).login.title }
}

export default async function LoginPage({ params }: PageProps<'/[lang]/login'>) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = getDictionary(lang)

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          {dict.login.heading}
        </h1>
        <p className="mb-6 text-sm text-zinc-600">{dict.login.subtitle}</p>
        <LoginForm lang={lang} dict={dict} />
      </div>
    </main>
  )
}