type InfoPageProps = {
  title: string
  description: string
  sections: Array<{ title: string; body: string }>
}

export function InfoPage({ title, description, sections }: InfoPageProps) {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground text-lg mb-10">{description}</p>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
