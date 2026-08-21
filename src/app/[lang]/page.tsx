import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  const dict = getDictionary(lang)

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="max-w-md text-4xl font-bold tracking-tight">
        {dict.home.title}
      </h1>
      <p className="max-w-md text-base leading-7 text-zinc-600">
        {dict.home.subtitle}
      </p>
      <Link
        href={`/${lang}/login`}
        className="rounded bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        {dict.home.cta}
      </Link>
    </main>
  )
}