import Link from 'next/link'

const entries = [
  {
    href: '/about-me',
    title: '关于我',
    description: '名字、近况，还有正在做的事',
    icon: 'i-mingcute-user-3-fill',
  },
  {
    href: '/about-site',
    title: '关于本站',
    description: '这个博客是怎么搭起来的',
    icon: 'i-mingcute-planet-fill',
  },
]

export default function AboutPage() {
  return (
    <div>
      <header className="prose prose-p:my-2">
        <h1>关于</h1>
        <h3>哇！谢谢你愿意来了解我~</h3>
      </header>

      <main className="mt-10 grid grid-cols-2 gap-12">
        {entries.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="group flex flex-col items-center gap-4 text-center md:grid md:grid-cols-[4rem_1fr] md:text-left"
          >
            <span className="grid size-16 place-items-center rounded-2xl bg-accent/10 text-2xl text-accent transition duration-200 group-hover:shadow-out-sm group-hover:-translate-y-2">
              <i className={entry.icon} />
            </span>
            <span className="flex flex-col gap-2">
              <h4 className="m-0 text-balance p-0 text-center font-medium md:text-left">
                {entry.title}
              </h4>
              <span className="line-clamp-2 text-balance text-center text-sm text-base-content/80 md:text-left">
                {entry.description}
              </span>
            </span>
          </Link>
        ))}
      </main>
    </div>
  )
}
