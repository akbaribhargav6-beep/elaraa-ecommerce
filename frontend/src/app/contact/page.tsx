'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { Footer } from '@/components/layout/Footer';

const EMPTY = { name: '', email: '', phone: '', subject: 'Bridal & Bespoke', message: '' };

// Placeholder contact details — swap these for ELARAA's real phone/email
// whenever you have them; nothing else needs to change. Deliberately no
// fabricated street address or map pin — "Jamnagar, Gujarat" only.
const CONTACT_INFO = {
  phone: '+91 92134 73062',
  email: 'customer@elaraaluxes.com',
  whatsappUrl: 'https://wa.me/919213473062',
  city: 'Jamnagar, Gujarat',
};

const TOPICS = ['Bridal & Bespoke', 'Custom Engraving', 'Online Order', 'Bulk & Corporate Gifting', 'Atelier Visit', 'Press & Collaboration'];

const CONTACT_CARDS = [
  {
    icon: '📞',
    eyebrow: 'Direct Client Line',
    title: CONTACT_INFO.phone,
    body: 'Monday to Saturday, 10:00 AM to 7:30 PM IST',
    action: { label: 'Call Number', href: `tel:${CONTACT_INFO.phone.replace(/\s/g, '')}` },
  },
  {
    icon: '✉️',
    eyebrow: 'Client Care & Orders',
    title: CONTACT_INFO.email,
    body: 'Replies within 1 to 2 business days',
    action: { label: 'Compose Email', href: `mailto:${CONTACT_INFO.email}` },
  },
  {
    icon: '💬',
    eyebrow: 'Instant WhatsApp',
    title: 'Styling Assistance',
    body: 'Message our concierge desk directly',
    action: { label: 'Chat on WhatsApp', href: `${CONTACT_INFO.whatsappUrl}?text=Hello%20ELARAA%2C%20I%20would%20like%20to%20inquire%20about%20your%20jewellery.` },
  },
  {
    icon: '📍',
    eyebrow: 'Flagship Atelier',
    title: CONTACT_INFO.city,
    body: 'Fine fashion jewellery, made with care',
    action: { label: 'Get in Touch', href: '#inquiry-form' },
  },
];

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/contact', form);
      setDone(true);
      setForm(EMPTY);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="pt-28" />

      {/* HERO */}
      <section className="relative pb-16 sm:pb-20 px-6 md:px-16 text-center" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #F8F5F0 50%, rgba(239,233,222,.5) 100%)', borderBottom: '1px solid rgba(43,38,32,.08)' }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80" style={{ border: '1px solid rgba(201,166,107,.3)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-[11px] font-medium tracking-wider uppercase">Concierge Desk Active · Response Under 15 Mins</span>
            </div>
          </RevealOnScroll>
          <RevealOnScroll><Eyebrow className="tracking-[.4em]">The Atelier Experience</Eyebrow></RevealOnScroll>
          <RevealOnScroll as="div">
            <h1 className="serif text-4xl sm:text-6xl font-light leading-[1.1]">
              We Welcome Your <em className="not-italic" style={{ color: 'var(--gold-deep)' }}>Inquiry</em>
            </h1>
          </RevealOnScroll>
          <RevealOnScroll as="div">
            <p className="text-sm sm:text-base opacity-70 leading-relaxed">
              Whether you're looking for the perfect everyday piece, need assistance choosing the right jewellery, or have questions about your order, our dedicated client advisors are always ready to assist you.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="px-6 md:px-16 -mt-8 relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CONTACT_CARDS.map((c) => (
            <RevealOnScroll key={c.title} className="bg-white p-6 shadow-sm flex flex-col justify-between" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
              <div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-lg" style={{ background: 'rgba(168,130,61,.1)' }}>{c.icon}</div>
                <p className="eyebrow text-[10px] mb-1">{c.eyebrow}</p>
                <h3 className="serif text-xl font-medium mb-1">{c.title}</h3>
                <p className="text-xs opacity-60">{c.body}</p>
              </div>
              <a
                href={c.action.href}
                target={c.action.href.startsWith('http') ? '_blank' : undefined}
                rel={c.action.href.startsWith('http') ? 'noopener' : undefined}
                className="text-xs font-medium tracking-wider uppercase underline underline-offset-4 hover:opacity-70 transition-opacity pt-6 inline-block"
                style={{ color: 'var(--gold-deep)' }}
              >
                {c.action.label} →
              </a>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* FORM + ATELIER INFO */}
      <section id="inquiry-form" className="px-6 md:px-16 py-20 sm:py-28 max-w-7xl mx-auto scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Form */}
          <RevealOnScroll className="lg:col-span-7 space-y-8 bg-white/70 p-6 sm:p-10" style={{ border: '1px solid rgba(43,38,32,.1)' }}>
            <div>
              <Eyebrow className="mb-2">Personal Service</Eyebrow>
              <h2 className="serif text-3xl sm:text-4xl font-light">Send an Editorial Inquiry</h2>
              <p className="text-xs sm:text-sm opacity-60 mt-2">Select a topic below so we can connect you with the right specialist.</p>
            </div>

            {done ? (
              <p className="text-sm opacity-70 py-10 text-center">Thanks, we&apos;ll get back to you shortly.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest opacity-60 mb-2.5 font-medium">Inquiry Category</label>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => update('subject', topic)}
                        className="text-xs px-3.5 py-2 font-medium transition-colors"
                        style={
                          form.subject === topic
                            ? { background: 'var(--gold-deep)', color: 'var(--ivory)' }
                            : { background: 'white', border: '1px solid rgba(43,38,32,.15)' }
                        }
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest opacity-60 mb-1.5 font-medium">Full Name *</label>
                    <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" className="w-full px-4 py-3 text-sm bg-white border outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest opacity-60 mb-1.5 font-medium">Email Address *</label>
                    <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 text-sm bg-white border outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest opacity-60 mb-1.5 font-medium">Phone / WhatsApp</label>
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" className="w-full px-4 py-3 text-sm bg-white border outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest opacity-60 mb-1.5 font-medium">Message & Vision Details *</label>
                  <textarea required rows={5} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Tell us about the piece, style preference, or appointment timeline..." className="w-full px-4 py-3 text-sm bg-white border outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                </div>

                <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                  <button type="submit" disabled={loading} className="btn-luxury btn-gold-solid min-h-[48px] w-full sm:w-auto justify-center">
                    <span>{loading ? 'Sending…' : 'Submit Concierge Inquiry →'}</span>
                  </button>
                  <p className="text-[11px] opacity-50 italic">🔒 Strictly confidential. We respect your privacy.</p>
                </div>
              </form>
            )}
          </RevealOnScroll>

          {/* Atelier info */}
          <div className="lg:col-span-5 space-y-8">
            <RevealOnScroll className="p-6 sm:p-8 space-y-6" style={{ background: 'var(--cream)', border: '1px solid rgba(43,38,32,.1)' }}>
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
                <div>
                  <p className="eyebrow text-[10px]">Atelier Hours</p>
                  <h3 className="serif text-2xl">Visit Our Gallery</h3>
                </div>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: '#d1fae5', color: '#065f46' }}>Open Today</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
                  <span className="font-medium">Monday to Saturday</span>
                  <span className="opacity-70">10:00 AM to 5:00 PM IST</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
                  <span className="font-medium">Sunday </span>
                  <span className="opacity-70">By Appointment Only</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Virtual Concierge</span>
                  <span className="opacity-70">24/7 Global Desk</span>
                </div>
              </div>
              <a href={`${CONTACT_INFO.whatsappUrl}?text=I%20would%20like%20to%20schedule%20a%20private%20atelier%20visit`} target="_blank" rel="noopener" className="btn-luxury btn-gold w-full justify-center min-h-[44px]">
                <span>Book Private Appointment</span>
              </a>
            </RevealOnScroll>

            <RevealOnScroll className="bg-white/80 p-6 sm:p-8 space-y-4" style={{ border: '1px solid rgba(43,38,32,.1)' }}>
              <p className="eyebrow text-[10px]">The ELARAA Promise</p>
              <h3 className="serif text-2xl">Bespoke Jewellery Experience</h3>
              <ul className="space-y-3.5 text-sm">
                {[
                  { title: 'Premium Anti-Tarnish Protection', body: 'Crafted with advanced anti-tarnish technology to preserve its brilliant shine through everyday wear.' },
                  { title: 'Made for Everyday Elegance', body: 'Lightweight, skin friendly, and exceptionally comfortable designed to complement your style from morning to night.' },
                  { title: 'Water & Sweat Resistant', body: 'Wear it confidently through your daily routine. Our jewellery is built to resist water, sweat, and everyday exposure while maintaining its luxurious finish.' },
                ].map((s) => (
                  <li key={s.title} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 font-bold" style={{ background: 'rgba(168,130,61,.15)', color: 'var(--gold-deep)' }}>✓</span>
                    <div>
                      <strong className="block font-medium">{s.title}</strong>
                      <span className="opacity-60 text-xs">{s.body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </RevealOnScroll>

            <RevealOnScroll as="div" className="p-6 space-y-3 shadow-xl" style={{ background: 'linear-gradient(135deg, #17140F, #2B2620)', color: 'var(--ivory)' }}>
              <div className="text-3xl serif leading-none" style={{ color: 'var(--gold)' }}>&ldquo;</div>
              <p className="serif italic text-base sm:text-lg leading-relaxed opacity-90">
                Jewellery should feel like poetry in motion, personal, weightless, and created for effortless style.
              </p>
              <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,.15)' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--gold)' }}>Founder - Elaraa Luxes</p>
                  <p className="text-[10px] opacity-50">Jamnagar, India</p>
                </div>
                <span className="text-xs tracking-widest opacity-40 uppercase serif">✦ ELARAA ✦</span>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
