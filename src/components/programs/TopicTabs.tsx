'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type TopicList = { value: string; label: string; topics: string[] }

/**
 * The mentorship topic lists as tabs (Primary school, High school). Tabs are keyboard operable:
 * arrow keys move between them and the panel follows.
 */
export function TopicTabs({ lists }: { lists: TopicList[] }) {
  return (
    <Tabs defaultValue={lists[0].value}>
      <TabsList aria-label="Mentorship topics by school level" className="h-auto min-h-12 p-1">
        {lists.map((list) => (
          <TabsTrigger
            key={list.value}
            value={list.value}
            className="min-h-11 px-5 text-base font-semibold"
          >
            {list.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {lists.map((list) => (
        <TabsContent key={list.value} value={list.value} className="mt-6">
          <ol className="grid gap-3 sm:grid-cols-2">
            {list.topics.map((topic, index) => (
              <li
                key={topic}
                className="flex items-start gap-4 rounded-xl border border-border bg-white p-4"
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-2xl leading-none font-bold text-accent-ink"
                >
                  {index + 1}
                </span>
                <span className="text-ink">
                  <span className="sr-only">Topic {index + 1}: </span>
                  {topic}
                </span>
              </li>
            ))}
          </ol>
        </TabsContent>
      ))}
    </Tabs>
  )
}
