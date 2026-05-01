/** Minimal markdown → HTML for knowledge base preview and article body (trusted internal content). */
export function formatKnowledgeMarkdownHtml(text: string): string {
  let html = text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gm, '<em>$1</em>')
    .replace(/\[([^\[]+)\]\(([^\)]+)\)/gm, '<a href="$2">$1</a>')
    .replace(/^\s*\n\* (.*)/gm, '<ul>\n<li>$1</li>\n</ul>')
    .replace(/^\s*\n- (.*)/gm, '<ul>\n<li>$1</li>\n</ul>')
    .replace(/^\s*\n([^\n]+)\n/gm, '<p>$1</p>\n')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n/g, '<br>')

  return html
}
