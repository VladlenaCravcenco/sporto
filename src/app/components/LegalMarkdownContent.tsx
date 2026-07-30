import type { ReactNode } from 'react';

type InlineChunk = string | ReactNode;

type MarkdownBlock =
  | { type: 'h2'; text: string; id: string; index: number }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

interface LegalMarkdownContentProps {
  content: string;
  tocTitle: string;
}

function stripLeadHeading(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const firstContent = lines.findIndex(line => line.trim().length > 0);

  if (firstContent >= 0 && /^#\s+/.test(lines[firstContent].trim())) {
    lines.splice(firstContent, 1);
  }

  return lines.join('\n').trim();
}

function parseLegalMarkdown(markdown: string): MarkdownBlock[] {
  const lines = stripLeadHeading(markdown).split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let sectionIndex = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: 'p', text: paragraph.join(' ').replace(/\s+/g, ' ').trim() });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flushParagraph();
      blocks.push({ type: 'h3', text: h3[1].trim() });
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushParagraph();
      sectionIndex += 1;
      blocks.push({ type: 'h2', text: h2[1].trim(), id: `legal-section-${sectionIndex}`, index: sectionIndex });
      continue;
    }

    const bullet = line.match(/^(?:[•*-])\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      const items = [bullet[1].trim()];

      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        const nextBullet = next.match(/^(?:[•*-])\s+(.+)$/);
        if (!nextBullet) break;
        items.push(nextBullet[1].trim());
        i += 1;
      }

      blocks.push({ type: 'ul', items });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map<InlineChunk>((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-medium text-black">{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

export function LegalMarkdownContent({ content, tocTitle }: LegalMarkdownContentProps) {
  const blocks = parseLegalMarkdown(content);
  const introBlocks: MarkdownBlock[] = [];
  const sections: Array<{ heading: Extract<MarkdownBlock, { type: 'h2' }>; blocks: MarkdownBlock[] }> = [];

  blocks.forEach(block => {
    if (block.type === 'h2') {
      sections.push({ heading: block, blocks: [] });
      return;
    }

    if (sections.length) {
      sections[sections.length - 1].blocks.push(block);
    } else {
      introBlocks.push(block);
    }
  });

  const renderBlock = (block: MarkdownBlock, index: number) => {
    if (block.type === 'h3') {
      return <h3 key={index} className="text-sm text-black pt-1">{block.text}</h3>;
    }

    if (block.type === 'ul') {
      return (
        <ul key={index} className="space-y-3">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3">
              <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0 mt-2" />
              <span className="text-sm text-gray-600 leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === 'p') {
      return (
        <p key={index} className="text-sm text-gray-600 leading-relaxed">
          {renderInline(block.text)}
        </p>
      );
    }

    return null;
  };

  return (
    <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-8">
            <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-4">{tocTitle}</p>
            <nav className="space-y-1">
              {sections.map(({ heading }) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors py-1.5 border-l-2 border-transparent hover:border-black pl-3"
                >
                  <span className="tabular-nums text-gray-300">{String(heading.index).padStart(2, '0')}</span>
                  {heading.text.replace(/^\d+\.\s/, '')}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="lg:col-span-9 divide-y divide-gray-100">
          {introBlocks.length > 0 && (
            <div className="pb-10">
              <div className="max-w-3xl space-y-5">
                {introBlocks.map(renderBlock)}
              </div>
            </div>
          )}

          {sections.map(({ heading, blocks: sectionBlocks }) => (
            <div key={heading.id} id={heading.id} className="py-10 first:pt-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs tabular-nums">
                  {String(heading.index).padStart(2, '0')}
                </div>
                <h2 className="text-lg text-black">{heading.text}</h2>
              </div>

              <div className="sm:ml-12 space-y-5">
                {sectionBlocks.map(renderBlock)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
