import {
  HandHelping,
  Heart,
  ShieldCheck,
  Scale,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { HoverLift, Stagger, StaggerItem } from '@/components/motion'

/** Icon for each core value. A value an editor adds later falls back to a star. */
const VALUE_ICONS: Record<string, LucideIcon> = {
  integrity: ShieldCheck,
  accountability: Scale,
  inclusivity: Users,
  compassion: Heart,
  empowerment: Sparkles,
  service: HandHelping,
}

/** Large card for the vision and the mission. */
export function FeatureCard({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-border bg-white p-7">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-accent">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h3 className="font-serif text-2xl font-bold text-primary">{label}</h3>
      <p className="text-lg text-ink">{children}</p>
    </div>
  )
}

export function ValueList({
  values,
}: {
  values: Array<{ title: string; description?: string | null }>
}) {
  return (
    <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {values.map((value) => {
        const Icon = VALUE_ICONS[value.title.toLowerCase()] ?? Star
        return (
          <StaggerItem as="li" key={value.title}>
            <div className="flex h-full items-start gap-4 rounded-xl border border-border bg-white p-5">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-bead text-accent-ink">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h3 className="font-serif text-xl font-bold text-primary">{value.title}</h3>
                {value.description && <p className="mt-1 text-ink">{value.description}</p>}
              </div>
            </div>
          </StaggerItem>
        )
      })}
    </Stagger>
  )
}

/** Numbered grid for the constitutional objectives. */
export function ObjectivesGrid({ objectives }: { objectives: string[] }) {
  return (
    <Stagger as="ol" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {objectives.map((text, index) => (
        <StaggerItem as="li" key={text}>
          <HoverLift className="h-full rounded-xl">
            <div className="flex h-full gap-4 rounded-xl border border-border bg-white p-5">
              <span
                aria-hidden="true"
                className="font-serif text-4xl leading-none font-bold text-accent-ink"
              >
                {index + 1}
              </span>
              <p className="text-lg text-ink">
                <span className="sr-only">Objective {index + 1}: </span>
                {text}
              </p>
            </div>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

/** Steps for "Our approach", joined by a gold line on wide screens. */
export function ApproachSteps({ steps }: { steps: string[] }) {
  return (
    <Stagger as="ol" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <StaggerItem as="li" key={step}>
          <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-white p-5">
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-full bg-primary font-serif text-lg font-bold text-primary-foreground"
            >
              {index + 1}
            </span>
            <p className="text-ink">
              <span className="sr-only">Step {index + 1}: </span>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
