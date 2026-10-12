import { Download, FileText } from 'lucide-react'

import { Stagger, StaggerItem } from '@/components/motion'
import { documentTypeLabel, type DocumentItem } from '@/lib/about-data'

/** Downloadable PDFs from the documents collection. The caller hides the section when empty. */
export function DocumentList({ documents }: { documents: DocumentItem[] }) {
  return (
    <Stagger as="ul" className="grid gap-4 md:grid-cols-2">
      {documents.map((doc) => (
        <StaggerItem as="li" key={doc.id}>
          <a
            href={doc.url}
            download
            className="flex min-h-11 items-center gap-4 rounded-xl border border-border bg-white p-5 hover:border-primary-soft"
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-bead text-accent-ink">
              <FileText aria-hidden="true" className="size-6" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-serif text-lg font-bold text-primary">{doc.title}</span>
              <span className="text-sm text-ink">
                {documentTypeLabel(doc.type)}
                {doc.year ? `, ${doc.year}` : ''}, PDF
              </span>
            </span>
            <Download aria-hidden="true" className="size-5 shrink-0 text-primary-soft" />
            <span className="sr-only">Download {doc.title}</span>
          </a>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
