import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-base font-semibold whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-soft',
        donate: 'bg-accent text-primary hover:bg-[#d2b064]',
        outline: 'border-primary bg-background text-primary hover:bg-sand',
        secondary: 'bg-bead text-primary hover:bg-[#e6d9b4]',
        ghost: 'text-primary hover:bg-sand',
        inverse: 'border-sand bg-transparent text-sand hover:bg-sand/15',
        destructive: 'bg-destructive text-white hover:bg-[#8f1e18]',
        link: 'text-primary-soft underline underline-offset-4 hover:text-primary',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-12 px-7 text-lg',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
