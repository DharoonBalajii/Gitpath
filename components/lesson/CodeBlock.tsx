'use client';

import { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';

const KEYWORDS =
  'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|await|async|import|from|export|default|new|class|extends|implements|interface|type|enum|public|private|protected|readonly|static|true|false|null|undefined|void|of|in|typeof|instanceof|try|catch|finally|throw|yield|as|this|super';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Lightweight, dependency-free highlighter for JS/TS. Highlights one line at a
// time (safe: we escape first, then only inject our own <span> tags).
function highlightLine(line: string): string {
  const escaped = escapeHtml(line);
  const pattern = new RegExp(
    `(\\/\\/[^\\n]*)` + // line comment
      `|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)` + // strings
      `|\\b(${KEYWORDS})\\b` + // keywords
      `|\\b(\\d+(?:\\.\\d+)?)\\b`, // numbers
    'g',
  );
  return escaped.replace(pattern, (m, comment, str, kw, num) => {
    if (comment) return `<span class="tok-c">${comment}</span>`;
    if (str) return `<span class="tok-s">${str}</span>`;
    if (kw) return `<span class="tok-k">${kw}</span>`;
    if (num) return `<span class="tok-n">${num}</span>`;
    return m;
  });
}

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  highlight?: number[];
}

export function CodeBlock({ code, language = 'ts', filename, highlight = [] }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  const hi = new Set(highlight);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0d1117] text-[13px] shadow-lg dark:bg-[#0a0e16]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2 text-slate-400">
          <FileCode2 className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">{filename ?? language}</span>
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* code */}
      <div className="overflow-x-auto py-2 font-mono leading-relaxed">
        {lines.map((line, i) => {
          const n = i + 1;
          const isHi = hi.has(n);
          return (
            <div key={i} className={`flex ${isHi ? 'bg-brand-violet/15 shadow-[inset_2px_0_0_0] shadow-brand-violet' : ''}`}>
              <span className="w-10 flex-shrink-0 select-none pr-3 text-right text-slate-600">{n}</span>
              <code
                className="flex-1 whitespace-pre pr-4 text-slate-200"
                dangerouslySetInnerHTML={{ __html: highlightLine(line) || '&nbsp;' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
