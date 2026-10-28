import Reveal from './Reveal';
import type { Chapter } from '@/lib/biography';

/**
 * One chapter of the life story. Layout is chosen by the family per chapter,
 * or 'auto' alternates the photograph left/right down the page. With no
 * photograph the text simply takes the full reading width, so nothing looks
 * unfinished. Server component: no JavaScript is sent for the chapter itself.
 */
export default function BiographyChapter({ chapter, index }: { chapter: Chapter; index: number }) {
  const hasImage = Boolean(chapter.imageUrl) && chapter.layout !== 'text-only';
  const side: 'left' | 'right' =
    chapter.layout === 'image-left' ? 'left'
    : chapter.layout === 'image-right' ? 'right'
    : index % 2 === 0 ? 'right' : 'left';
  const wide = hasImage && chapter.layout === 'full-width';

  const figure = hasImage ? (
    <figure className={wide ? 'mb-8' : 'md:sticky md:top-28'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={chapter.imageUrl}
        alt={chapter.imageAlt}
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={`w-full rounded-sm bg-mist object-cover ${wide ? 'aspect-[16/9]' : 'aspect-[4/5] max-h-[560px]'}`}
        style={{ objectPosition: `${chapter.focalX}% ${chapter.focalY}%` }}
      />
      {chapter.imageCaption && (
        <figcaption className="mt-2.5 font-util text-[0.76rem] leading-snug text-ink/55">{chapter.imageCaption}</figcaption>
      )}
    </figure>
  ) : null;

  const text = (
    <div className="min-w-0">
      <header className="mb-5">
        {chapter.periodLabel && (
          <p className="mb-2 font-util text-[0.72rem] uppercase tracking-[0.16em] text-deep">{chapter.periodLabel}</p>
        )}
        <h2 id={`chapter-h-${chapter.slug}`} className="text-[length:var(--text-title)] leading-[1.1]">{chapter.heading}</h2>
        {chapter.subheading && (
          <p className="mt-3 font-display text-[1.15rem] italic leading-snug text-ink/65">{chapter.subheading}</p>
        )}
      </header>

      {chapter.bodyHtml ? (
        <div className="story-body max-w-[66ch] text-[1.0625rem] leading-[1.8] text-ink/85" dangerouslySetInnerHTML={{ __html: chapter.bodyHtml }} />
      ) : null}

      {chapter.pullQuote && (
        <blockquote className="relative mt-8 max-w-[56ch] border-l-2 border-bright pl-6">
          <p className="font-display text-[clamp(1.2rem,2.4vw,1.55rem)] italic leading-[1.4] text-deep">{chapter.pullQuote}</p>
          {chapter.quoteAttribution && (
            <footer className="mt-2 font-util text-[0.78rem] text-ink/55">{chapter.quoteAttribution}</footer>
          )}
        </blockquote>
      )}
    </div>
  );

  return (
    <section id={`chapter-${chapter.slug}`} aria-labelledby={`chapter-h-${chapter.slug}`} className="scroll-mt-28 border-t border-ink/10 pt-10 first:border-t-0 first:pt-0">
      <Reveal>
        {wide ? (
          <>
            {figure}
            {text}
          </>
        ) : hasImage ? (
          <div className="grid gap-7 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:[&>*:first-child]:order-1">
            <div className={side === 'left' ? 'md:order-1' : 'md:order-2'}>{figure}</div>
            <div className={side === 'left' ? 'md:order-2' : 'md:order-1'}>{text}</div>
          </div>
        ) : (
          text
        )}
      </Reveal>
    </section>
  );
}
