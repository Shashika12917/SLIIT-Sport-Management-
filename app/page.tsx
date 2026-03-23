import Link from "next/link";

const colors = {
  navy: "#11144C",
  teal: "#3A9679",
  amber: "#FABC60",
  coral: "#E16262",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: colors.navy }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:py-24">
          {/* Left: text */}
          <div className="space-y-6 text-slate-50 lg:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colors.teal }}
              />
              SLIIT · Sports Event Management
            </div>

            <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              The home for every{" "}
              <span style={{ color: colors.amber }}>SLIIT CAMPUS</span> sports event.
            </h1>

            <p className="max-w-xl text-sm text-slate-200 sm:text-base">
              Plan, schedule, and track internal university sports events from
              one place. Reduce manual errors, avoid venue clashes, and keep
              students and staff in sync.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:shadow-md"
                style={{ backgroundColor: colors.teal }}
              >
                Go to Dashboard
              </Link>

              <a
                href="#upcoming"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-50/90 hover:bg-white/5"
              >
                View upcoming events
              </a>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 text-xs text-slate-200/80">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: colors.teal }}
                />
                Conflict‑aware scheduling
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: colors.amber }}
                />
                Role‑based management
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: colors.coral }}
                />
                Built for SLIIT
              </div>
            </div>
          </div>

          {/* Right: abstract card stack */}
          <div className="relative flex justify-center lg:w-1/2">
            <div className="relative mt-4 h-72 w-full max-w-md">
              <div
                className="absolute inset-0 rounded-3xl opacity-40 blur-3xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.teal}, ${colors.coral})`,
                }}
              />
              <div className="relative flex h-full flex-col justify-between rounded-3xl bg-slate-950/70 p-6 ring-1 ring-white/10 backdrop-blur">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Today at SLIIT
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-50">
                    Sports event overview
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  <MiniEventRow
                    color={colors.teal}
                    name="Inter‑Faculty Football"
                    venue="Main Ground"
                    time="16:00"
                  />
                  <MiniEventRow
                    color={colors.amber}
                    name="Freshers' Athletics Meet"
                    venue="Track"
                    time="09:00"
                  />
                  <MiniEventRow
                    color={colors.coral}
                    name="Staff vs Students Cricket"
                    venue="Secondary Ground"
                    time="18:30"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Managed by event_management@sem.lk</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5">
                    Internal use only
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              Built for SLIIT sports coordinators
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Everything you need to run internal tournaments, friendlies, and
              training sessions without spreadsheet chaos.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            accent={colors.teal}
            title="Create & update events"
            body="Capture event name, date, venue, and sport type in seconds with a clean, guided form."
          />
          <FeatureCard
            accent={colors.amber}
            title="Smart date validation"
            body="Detect duplicate events for the same venue and day to avoid clashes and confusion."
          />
          <FeatureCard
            accent={colors.coral}
            title="Upcoming events at a glance"
            body="See what’s happening this week across all SLIIT sports from one calendar‑first view."
          />
          <FeatureCard
            accent={colors.navy}
            title="Role‑based access"
            body="Limit sensitive changes to event managers while letting students and staff stay informed."
          />
        </div>
      </section>

      {/* UPCOMING TEASER */}
      <section
        id="upcoming"
        className="border-t bg-white/60"
        style={{ borderTopColor: colors.teal }}
      >
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">
                Upcoming SLIIT sports events
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Powered by your internal event management dashboard. Data shown
                here is just a preview.
              </p>
            </div>

            <Link
              href="/dashboard/event-management"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Open event management
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Faculty Futsal League",
                date: "July 24",
                venue: "Indoor Arena",
              },
              {
                name: "Badminton Open",
                date: "August 3",
                venue: "Main Hall",
              },
              {
                name: "Annual Sports Day",
                date: "September 10",
                venue: "SLIIT Grounds",
              },
            ].map((event) => (
              <div
                key={event.name}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Internal event
                </p>
                <h3 className="mt-2 text-sm font-semibold">{event.name}</h3>
                <p className="mt-1 text-xs text-slate-600">
                  {event.date} · {event.venue}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-slate-500 sm:flex-row">
          <span>© SLIIT Sports Event Management</span>
          <span>Made for internal use within SLIIT, Sri Lanka.</span>
        </div>
      </footer>
    </main>
  );
}

type FeatureCardProps = {
  accent: string;
  title: string;
  body: string;
};

function FeatureCard({ accent, title, body }: FeatureCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
      />
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs text-slate-600">{body}</p>
    </div>
  );
}

type MiniEventRowProps = {
  color: string;
  name: string;
  venue: string;
  time: string;
};

function MiniEventRow({ color, name, venue, time }: MiniEventRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="h-8 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div>
          <p className="text-xs font-medium text-slate-50">{name}</p>
          <p className="text-[11px] text-slate-300">
            {venue} · {time}
          </p>
        </div>
      </div>
      <span className="text-[11px] text-slate-300">SLIIT</span>
    </div>
  );
}

