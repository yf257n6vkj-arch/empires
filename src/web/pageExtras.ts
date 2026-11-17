/**
 * The second paragraph and the changing "Did you know?" box of encyclopedia
 * pages, in the current language with Czech as the fallback.
 */
import { localPage, t } from "./i18n";
import { PAGE_MORE } from "./pageMore";
import { escapeHtml } from "./texts";

export function pageMore(key: string): { more: string | null; facts: string[] } {
  const extra = localPage((l) => l.more, key)?.page ?? PAGE_MORE[key];
  return { more: extra?.more ?? null, facts: extra?.facts ?? [] };
}

/** HTML of the fact box; the first fact shown is picked at random so every visit can teach something new. */
export function factBox(key: string, mainFact: string): string {
  const facts = [mainFact, ...pageMore(key).facts];
  // Screen decoration only, so Math.random is fine here.
  const start = Math.floor(Math.random() * facts.length);
  return `<div class="tp-fact" data-facts="${escapeHtml(JSON.stringify(facts))}" data-at="${start}"><b>${t("Věděl jsi?")}</b> <span class="tp-fact-text">${escapeHtml(facts[start]!)}</span>${
    facts.length > 1 ? ` <button type="button" class="tp-fact-next" title="${t("Ukázat další zajímavost")}">${t("Další zajímavost")} ›</button>` : ""
  }</div>`;
}

/** The paragraph after the main text, or nothing. */
export function moreParagraph(key: string): string {
  const more = pageMore(key).more;
  return more ? `<p class="tp-text">${escapeHtml(more)}</p>` : "";
}

/** Makes the "next fact" buttons inside root work. */
export function wireFacts(root: ParentNode): void {
  root.querySelectorAll<HTMLDivElement>(".tp-fact[data-facts]").forEach((box) => {
    const facts = JSON.parse(box.dataset.facts!) as string[];
    box.querySelector(".tp-fact-next")?.addEventListener("click", () => {
      const at = (Number(box.dataset.at) + 1) % facts.length;
      box.dataset.at = String(at);
      box.querySelector(".tp-fact-text")!.textContent = facts[at]!;
    });
  });
}
