export default function Home() {
  const features = [
    {
      title: "WhatsApp feedback",
      body: "Reach every guest where they already are. RepAI collects private feedback over WhatsApp minutes after they visit.",
    },
    {
      title: "AI-drafted replies",
      body: "Turn raw comments into on-brand responses. Approve, tweak, or auto-send — your reputation, your voice.",
    },
    {
      title: "More 5-star reviews",
      body: "Happy guests get nudged to Google. Unhappy ones reach you first, so problems get fixed instead of posted.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">
          Rep<span className="text-emerald-600 dark:text-emerald-400">AI</span>
        </span>
        <nav className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
          <a className="hover:text-zinc-900 dark:hover:text-zinc-50" href="#features">
            Features
          </a>
          <a
            className="rounded-full bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href="#get-started"
          >
            Get started
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="flex flex-col items-start gap-6 py-20 sm:py-28">
          <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            AI reputation management for restaurants
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Turn every guest into a five-star review.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            RepAI reaches your customers on WhatsApp, listens to their feedback,
            and uses AI to grow your Google rating — automatically.
          </p>
          <div id="get-started" className="flex flex-col gap-3 sm:flex-row">
            <a
              className="flex h-12 items-center justify-center rounded-full bg-emerald-600 px-6 font-medium text-white transition-colors hover:bg-emerald-500"
              href="#features"
            >
              Start collecting feedback
            </a>
            <a
              className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              href="#features"
            >
              See how it works
            </a>
          </div>
        </section>

        <section id="features" className="grid gap-6 pb-24 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-sm text-zinc-500">
        © {new Date().getFullYear()} RepAI. All rights reserved.
      </footer>
    </div>
  );
}
