import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./Reveal";
import { faqJsonLd } from "@/lib/seo";

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "How do I book a Bentota boat safari?",
    answer:
      "Use the booking form on this page, message us on WhatsApp at +94 776 838 289, call +94 767 498 169, or simply walk in at our Bentota dock. Online requests need no payment — our team confirms every booking personally.",
  },
  {
    question: "How long does the boat safari take?",
    answer:
      "Choose from 1-hour river and lagoon highlights, 2-hour mangrove and temple routes, 3-hour wildlife and mangrove tunnels, up to a 4-hour grand safari. Tell us how much time you have and we will match a route to it.",
  },
  {
    question: "What times do safaris run?",
    answer:
      "Scheduled departures run every day around sunrise (06:30–08:30) and sunset (17:00–19:00), when the river is calmest and the light is best. You can also request a preferred time and we will confirm boat availability.",
  },
  {
    question: "How many guests can join one booking?",
    answer:
      "Each booking takes up to 8 guests and our boats seat 8, so families and small groups travel comfortably. Larger parties can be split across boats — contact us and we will arrange it.",
  },
  {
    question: "What wildlife might we see?",
    answer:
      "The Bentota River corridor is home to river birds such as kingfishers, herons and cormorants, riverside monkeys, monitor lizards and occasionally crocodiles. Sightings depend on season and conditions, so nothing is ever guaranteed — that is part of a real safari.",
  },
  {
    question: "Is the safari suitable for children and elders?",
    answer:
      "Yes. The river is calm, the boats are stable and covered, and the pace is relaxed. Tell us your group composition when booking so the crew can look after everyone.",
  },
  {
    question: "What should I bring?",
    answer:
      "Sun protection, a hat, drinking water and a camera. Wear light clothing and footwear you don't mind getting a splash on. Everything else — safety equipment and local guidance — is provided.",
  },
  {
    question: "Where does the safari start and how do I find you?",
    answer:
      "Safaris depart from our dock on the Bentota River. Tap Get Directions in the Find Us section for turn-by-turn navigation, or message us on WhatsApp and we will guide you in.",
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer:
      "Yes. Cancellations made with advance notice are free of charge. To reschedule, reply to your confirmation or contact us with your booking reference and preferred new date.",
  },
  {
    question: "How much does a Bentota boat safari cost?",
    answer:
      "Rates depend on duration and group size. Message us on WhatsApp at +94 776 838 289 or send an enquiry through the contact section for current prices — no online payment is taken at booking time.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" aria-labelledby="faq-heading" className="section-pad scroll-mt-20 bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-accent-strong">
            Good to know
          </p>
          <h2
            id="faq-heading"
            className="font-serif text-4xl font-light leading-[1.06] tracking-tight sm:text-5xl"
          >
            Bentota Boat Safari FAQs
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
            Straight answers about booking, durations, wildlife, and visiting with family.
          </p>
        </Reveal>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-serif text-xl font-light tracking-tight sm:text-2xl">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-accent-strong transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-3xl pb-6 text-sm leading-7 text-muted-foreground sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
