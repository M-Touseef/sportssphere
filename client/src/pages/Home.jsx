import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Instagram, Youtube } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const image = (name) => `/images/homepage/${name}`

function ArrowUpRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  )
}

function ArrowRight({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function Brand({ footer = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-3" aria-label="SportsSphere home">
      <img
        src={image('website-logo-header.png')}
        alt="SportsSphere"
        className={`${footer ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-xl'} border border-slate-100 bg-white object-cover`}
      />
      <div className={footer ? '' : 'hidden sm:block'}>
        <div className={`font-display font-extrabold leading-none tracking-[-0.04em] ${footer ? 'text-2xl text-white' : 'text-lg text-[#082b58]'}`}>
          Sports<span className={footer ? 'text-lime-400' : 'text-lime-600'}>Sphere</span>
        </div>
        <div className={`mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${footer ? 'text-white/40' : 'text-slate-400'}`}>
          Play / Train / Compete
        </div>
      </div>
    </Link>
  )
}

function Hero({ user }) {
  return (
    <header id="top" className="relative min-h-screen w-full overflow-hidden bg-[#051e46]">
      <div className="absolute inset-0">
        <img src={image('hero-badminton.jpg')} alt="Badminton player jumping for a powerful overhead shot" className="hero-photo h-full w-full object-cover object-[58%_center]" />
        <div className="hero-overlay absolute inset-0" />
        <div className="hero-grid absolute inset-0 opacity-60" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 items-center gap-10 px-6 pb-12 pt-32 md:px-10 md:pb-10 md:pt-32 lg:grid-cols-12">
        <div className="flex flex-col gap-5 pt-8 md:gap-3 lg:col-span-7 lg:pt-0 xl:col-span-6">
          <div className="glass flex w-fit items-center gap-2 rounded-full px-4 py-2 shadow-lg shadow-slate-950/10">
            <span className="ping-slow block h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs font-medium tracking-wide text-white">Live across 340+ courts</span>
          </div>
          <h1 className="font-display max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl xl:text-7xl">
            Play. Train. Win.<br /><span className="text-sky-400">All in one place.</span>
          </h1>
          <p className="max-w-xl text-base font-light leading-relaxed text-white/75 md:text-lg">
            Book a court, find the right coach, meet your next sparring partner, and enter tournaments from one connected platform.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 md:gap-4">
            <Link to="/courts" className="group flex items-center gap-3 rounded-full bg-sky-400 py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-xl shadow-sky-950/25 transition hover:bg-sky-300 md:gap-5 md:pl-7">
              Find a court
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-600 transition group-hover:translate-x-0.5"><ArrowRight /></span>
            </Link>
            <a href="#how-it-works" className="glass rounded-full px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white/20 md:px-7">See how it works</a>
          </div>
          <div className="mt-2 grid max-w-xl grid-cols-3 gap-3 border-t border-white/15 pt-5">
            {[['340+', 'Certified courts'], ['180+', 'Verified coaches'], ['12k+', 'Active players']].map(([value, label]) => (
              <div key={label}>
                <div className="font-display text-xl font-bold text-white md:text-2xl">{value}</div>
                <div className="mt-0.5 text-[11px] text-white/55 md:text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden flex-col gap-4 lg:col-span-4 lg:col-start-9 lg:mb-8 lg:flex lg:self-end xl:col-span-3 xl:col-start-10">
          <div className="hero-card ml-auto w-full max-w-sm rounded-3xl p-5 md:p-6">
            <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/60"><span className="h-px w-8 bg-sky-400" />Ready when you are</div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-white">Find a Sparring Partner</h3>
              <span className="rounded-full border border-sky-400/40 bg-sky-400/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">AI Matched</span>
            </div>
            <p className="mb-5 text-sm text-white/60">Matched by skill, location and schedule.</p>
            <div className="mb-5 grid grid-cols-2 gap-2">
              {[['Nearest court', '8 min away'], ['Open slots', '14 tonight']].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
                  <div className="mt-1 text-xs font-medium text-white">{value}</div>
                </div>
              ))}
            </div>
            <Link to={user ? '/app/sparring' : '/login'} className="block w-full rounded-xl bg-sky-400 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-sky-300">Find Match -&gt;</Link>
          </div>
          <Link to="/chatbot" className="hero-card ml-auto flex w-full max-w-sm items-center gap-4 rounded-3xl p-4 md:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/20 text-sky-400">AI</div>
            <div><div className="text-sm font-medium text-white">AI Badminton Assistant</div><div className="mt-0.5 text-xs text-white/55">Rules, techniques, and training tips</div></div>
            <span className="ml-auto text-white/50"><ArrowUpRight /></span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function PhotoCard({ id, number, imageName, alt, badge, badgeClass, icon, title, description, action, to, imagePosition = 'center' }) {
  return (
    <article id={id} className="feature-card group relative min-h-[472px] overflow-hidden rounded-[2rem] bg-slate-900 shadow-sm scroll-mt-24 lg:col-span-2">
      <img src={image(imageName)} alt={alt} style={{ objectPosition: imagePosition }} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/55 to-slate-950/10" />
      <div className="relative z-10 flex min-h-[472px] flex-col justify-between p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="glass-dark rounded-full px-3 py-1 text-xs font-medium text-white">{number}</span>
          <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}>{badge}</span>
        </div>
        <div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sky-400 text-white shadow-lg shadow-sky-950/30">{icon}</div>
          <h3 className="font-display mb-2 text-2xl font-semibold text-white">{title}</h3>
          <p className="mb-5 text-sm leading-relaxed text-white/65">{description}</p>
          <Link to={to} className="group/action flex w-full items-center justify-between border-t border-white/20 pt-4 text-sm font-semibold text-white">
            {action}<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 transition group-hover/action:translate-x-1"><ArrowRight size={15} /></span>
          </Link>
        </div>
      </div>
    </article>
  )
}

function Features({ user }) {
  return (
    <section id="features" className="relative overflow-hidden bg-slate-50 px-6 py-24 scroll-mt-24 md:px-16">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-1/2 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
      <div className="relative z-10 mb-14 text-center">
        <span className="mb-5 inline-block rounded-full border border-sky-200 px-4 py-1.5 text-xs font-medium tracking-wide text-sky-600">Everything You Need</span>
        <h2 className="font-display mb-4 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">From first serve to champion.</h2>
        <p className="mx-auto max-w-xl text-lg font-light leading-relaxed text-slate-500">Five connected tools built for every badminton player, from first session to tournament day.</p>
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
        <PhotoCard
          id="court-booking" number="01" imageName="indoor-badminton-court.jpg" alt="Indoor badminton court ready for booking"
          badge="Instant booking" badgeClass="border-sky-300/30 bg-sky-400/20 text-sky-200" icon="C"
          title="Book the right court." description="Explore nearby courts, compare live availability, and reserve your ideal time slot in a few taps." action="Browse courts" to="/courts"
        />
        <PhotoCard
          id="coach-booking" number="02" imageName="coaching-web.jpg" alt="Badminton coach holding a racket" imagePosition="55% center"
          badge="Verified experts" badgeClass="border-indigo-300/30 bg-indigo-400/20 text-indigo-100" icon="+"
          title="Train with confidence." description="Discover certified coaches, review their expertise, and book private or group sessions around your schedule." action="Meet the coaches" to="/coaches"
        />

        <article id="tournaments" className="feature-card group flex overflow-hidden rounded-[2rem] bg-slate-900 shadow-sm scroll-mt-24 md:col-span-2 lg:col-span-2 lg:flex-col">
          <div className="relative h-52 overflow-hidden">
            <img src={image('tournament-web.jpg')} alt="Shuttlecock flying above the net during a badminton tournament" className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            <span className="glass-dark absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-white">03</span>
            <span className="absolute right-4 top-4 rounded-full bg-sky-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Featured</span>
          </div>
          <div className="flex flex-1 flex-col justify-between p-6">
            <div><h3 className="font-display mb-2 text-xl font-semibold text-white">Tournament Management</h3><p className="text-sm leading-relaxed text-white/60">Create tournaments, register players, generate brackets, record results, and publish live leaderboards.</p></div>
            <Link to={user && ['admin', 'organizer'].includes(user.role) ? '/app/tournaments/create' : '/tournaments'} className="mt-6 block w-full rounded-xl bg-sky-400 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-sky-300">
              {user && ['admin', 'organizer'].includes(user.role) ? 'Create Tournament' : 'Explore Tournaments'} -&gt;
            </Link>
          </div>
        </article>

        <article className="feature-card group relative min-h-[320px] overflow-hidden rounded-[2rem] bg-slate-900 shadow-sm md:col-span-2 lg:col-span-4">
          <img src={image('sparring.webp')} alt="Badminton players competing in a doubles sparring match" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/10" />
          <div className="relative z-10 flex h-full max-w-md flex-col justify-between p-7 md:p-9">
            <div>
              <div className="mb-8 flex items-center justify-between gap-3"><span className="glass-dark rounded-full px-3 py-1 text-xs font-medium text-white">04</span><span className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/15 px-3 py-1.5 text-xs font-medium text-emerald-300"><span className="ping-slow h-2 w-2 rounded-full bg-emerald-400" />Players online</span></div>
              <h3 className="font-display mb-3 text-2xl font-semibold text-white md:text-3xl">Find your next challenge.</h3>
              <p className="max-w-sm text-sm leading-relaxed text-white/65">Match with players at your level by skill, location, and availability. Set up singles or doubles sessions in minutes.</p>
            </div>
            <Link to={user ? '/app/sparring' : '/login'} className="mt-8 w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-sky-100">Find a sparring partner -&gt;</Link>
          </div>
        </article>

        <article className="feature-card relative min-h-[320px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-950 to-slate-900 p-6 shadow-sm md:col-span-2 lg:col-span-2">
          <img src={image('chatbot-web.jpg')} alt="AI chatbot assistant" className="pointer-events-none absolute -bottom-[4%] -right-[12%] h-[88%] w-[72%] object-cover object-center opacity-35 mix-blend-screen" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-950 via-sky-950/90 to-transparent" />
          <div className="relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/20 text-xs font-bold text-sky-400">AI</div>
          <span className="relative z-10 mb-3 block text-xs font-medium tracking-wide text-white/40">05</span>
          <h3 className="font-display relative z-10 mb-2 max-w-[60%] text-xl font-semibold text-white">AI Badminton Assistant</h3>
          <p className="relative z-10 max-w-[60%] text-sm leading-relaxed text-white/60">Get instant answers on rules, techniques, equipment, fitness, and every platform feature.</p>
          <Link to="/chatbot" className="glass-dark relative z-10 mt-5 flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-sky-300"><span className="ping-slow h-2 w-2 rounded-full bg-emerald-400" />Ask AI anytime</Link>
        </article>
      </div>
    </section>
  )
}

const steps = [
  ['Create your profile', 'Set your skill level, location, and preferences so the platform can personalise your experience.'],
  ['Book, match, enter', 'Reserve a court, find a partner, schedule coaching, or register for a tournament from one screen.'],
  ['Play and improve', 'Show up, play, and track your progress with practical guidance after every session.'],
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-950 px-6 py-24 text-white scroll-mt-24 md:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div><div className="mb-4 h-[3px] w-10 rounded bg-sky-400" /><h2 className="font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">Get on court in<br /><span className="text-slate-400">three simple steps.</span></h2></div>
          <p className="max-w-xs text-base font-light leading-relaxed text-slate-400">No complicated setup. Start playing in minutes.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map(([title, description], index) => (
            <article key={title} className={`rounded-[2rem] p-8 ${index === 2 ? 'bg-sky-400' : 'border border-white/5 bg-slate-900 transition hover:border-sky-400/30'}`}>
              <div className={`font-display mb-6 flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold ${index === 2 ? 'border-white/30 bg-white/20 text-white' : 'border-sky-400/25 bg-sky-400/10 text-sky-400'}`}>{index + 1}</div>
              <h3 className="font-display mb-3 text-xl font-semibold">{title}</h3>
              <p className={`text-sm leading-relaxed ${index === 2 ? 'text-white/80' : 'text-slate-400'}`}>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const faqs = [
  ['Do I need an account to book a court?', 'Yes. A free account lets you book courts, join matchmaking, and track your history. Registration takes under a minute.'],
  ['How does sparring matchmaking work?', 'The platform matches players of a similar skill within your preferred distance and mutual availability.'],
  ['Can I host my own tournament?', 'Absolutely. Create the event, set entry rules, generate brackets, collect registrations, and publish results.'],
  ['Is the AI assistant available 24/7?', 'Yes. Ask about rules, technique, equipment, fitness, or any part of the platform whenever you need help.'],
]

function FaqAndCta({ user }) {
  const [openFaq, setOpenFaq] = useState(null)
  return (
    <section className="bg-white px-6 py-24 md:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 lg:grid-cols-2">
        <div>
          <div className="mb-4 h-[3px] w-10 rounded bg-sky-400" />
          <h2 className="font-display mb-8 text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map(([question, answer], index) => {
              const open = openFaq === index
              return (
                <article key={question} className="overflow-hidden rounded-2xl border border-gray-100">
                  <button type="button" className="flex w-full items-center justify-between px-6 py-4 text-left" aria-expanded={open} onClick={() => setOpenFaq(open ? null : index)}>
                    <span className="text-sm font-medium text-slate-900">{question}</span>
                    <span className={`text-xl leading-none text-gray-400 transition ${open ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {open && <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">{answer}</p>}
                </article>
              )
            })}
          </div>
        </div>

        <div id="signin" className="relative flex min-h-[430px] flex-col justify-between overflow-hidden rounded-[2rem] bg-slate-950 p-10 scroll-mt-24">
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sky-400">AI</div>
            <h2 className="font-display mb-3 text-3xl font-bold tracking-tight text-white">Ready to play?</h2>
            <p className="max-w-xs text-sm leading-relaxed text-white/55">Join SportsSphere free. Book your first court and start building your badminton network today.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={user ? '/app' : '/register'} className="rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-300">
                {user ? 'Go to dashboard' : 'Join free'}
              </Link>
              {!user && <Link to="/login" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Sign in</Link>}
            </div>
            {!user && <p className="mt-4 text-xs text-white/30">No credit card required. Free account forever.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function SocialIcon({ label, children }) {
  return <a href="#social" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white">{children}</a>
}

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#03142f] text-white">
      <div className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8 pt-16 md:px-10 md:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 pb-14 lg:grid-cols-12 lg:gap-10">
          <div className="col-span-2 lg:col-span-5">
            <Brand footer />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/55">One connected home for badminton players. Find courts, train with verified coaches, meet partners, and compete at your level.</p>
            <div className="mt-7 flex items-center gap-3">
              <SocialIcon label="Instagram"><Instagram size={18} strokeWidth={1.8} /></SocialIcon>
              <SocialIcon label="Facebook"><Facebook size={18} strokeWidth={1.8} /></SocialIcon>
              <SocialIcon label="YouTube"><Youtube size={19} strokeWidth={1.8} /></SocialIcon>
            </div>
          </div>
          <FooterLinks title="Platform" links={[['Book courts', '/courts'], ['Find coaches', '/coaches'], ['Tournaments', '/tournaments'], ['Matchmaking', '/app/sparring']]} />
          <FooterLinks title="Support" links={[['How it works', '#how-it-works'], ['Help centre', '/support'], ['Terms of service', '/terms'], ['AI assistant', '/chatbot']]} />
          <div className="col-span-2 lg:col-span-3">
            <h3 className="font-display mb-3 text-sm font-bold">Stay in the game</h3>
            <p className="mb-5 text-sm leading-relaxed text-white/45">Get court openings, tournament news, and practical training tips.</p>
            <form className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5" onSubmit={(event) => event.preventDefault()}>
              <input type="email" required aria-label="Email address" placeholder="Email address" className="min-w-0 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30" />
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-500 text-[#082b58] transition hover:bg-lime-400" aria-label="Subscribe"><ArrowRight /></button>
            </form>
            <p className="mt-3 text-[11px] text-white/25">Occasional updates. No noise.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 md:flex-row">
          <p className="text-xs text-white/35">Copyright 2026 SportsSphere. All rights reserved.</p>
          <div className="flex items-center gap-6"><Link to="/terms" className="text-xs text-white/35 transition hover:text-white">Terms</Link><Link to="/support" className="text-xs text-white/35 transition hover:text-white">Support</Link></div>
        </div>
      </div>
    </footer>
  )
}

function FooterLinks({ title, links }) {
  return (
    <div className="col-span-1 lg:col-span-2">
      <h3 className="font-display mb-5 text-sm font-bold">{title}</h3>
      <div className="flex flex-col gap-3.5">{links.map(([label, href]) => href.startsWith('/') ? <Link key={label} to={href} className="text-sm text-white/50 transition hover:text-sky-300">{label}</Link> : <a key={label} href={href} className="text-sm text-white/50 transition hover:text-sky-300">{label}</a>)}</div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="sports-home">
      <Hero user={user} />
      <main>
        <Features user={user} />
        <HowItWorks />
        <FaqAndCta user={user} />
      </main>
      <Footer />
    </div>
  )
}
