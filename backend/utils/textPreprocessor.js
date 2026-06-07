const PAGE_MARKER_PATTERN = /^(\d+\s*$|--\s*\d+\s+of\s+\d+\s*--|page\s+\d+(\s+of\s+\d+)?\s*$)/i;

const cleanWhitespace = (text) => {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

const removeRepeatedLines = (text) => {
  const lines = String(text || '').split('\n');
  const seen = new Map();
  const result = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (result[result.length - 1] !== '') {
        result.push('');
      }
      continue;
    }

    const normalized = trimmed.toLowerCase();
    const count = seen.get(normalized) || 0;
    seen.set(normalized, count + 1);

    if (count < 2) {
      result.push(trimmed);
    }
  }

  return result.join('\n');
};

const removePageHeadersFooters = (text) => {
  return String(text || '')
    .split('\n')
    .filter((line) => !PAGE_MARKER_PATTERN.test(line.trim()))
    .join('\n');
};

const preprocessTextForSummary = (text) => {
  let processed = cleanWhitespace(text);
  processed = removePageHeadersFooters(processed);
  processed = removeRepeatedLines(processed);
  processed = cleanWhitespace(processed);
  return processed;
};

const chunkText = (text, maxChunkSize = 12000) => {
  const normalized = String(text || '').trim();
  if (!normalized) return [];
  if (normalized.length <= maxChunkSize) return [normalized];

  const chunks = [];
  const paragraphs = normalized.split(/\n\n+/);
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  if (!chunks.length) {
    for (let index = 0; index < normalized.length; index += maxChunkSize) {
      chunks.push(normalized.slice(index, index + maxChunkSize));
    }
  }

  return chunks;
};

module.exports = {
  cleanWhitespace,
  removeRepeatedLines,
  removePageHeadersFooters,
  preprocessTextForSummary,
  chunkText,
};
