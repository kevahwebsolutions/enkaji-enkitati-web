/**
 * Defence in depth for NFR-PRV-02. Team bios are plain text typed by editors, so before one is
 * shown we remove anything that looks like a personal phone or ID number. The CBO's own public
 * number is shown only from site settings, never from free text.
 */
const NUMBER_LIKE = /(?:\+?\d[\d\s().-]{6,}\d)/g

export function redactPersonalNumbers(text: string): string {
  return text
    .replace(NUMBER_LIKE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
}
