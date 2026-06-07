const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chunkText } = require('../utils/textPreprocessor');

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash-latest',
];

const getGeminiModelCandidates = () => {
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  return [...new Set([configuredModel, ...DEFAULT_GEMINI_MODELS].filter(Boolean))];
};

const isModelNotFoundError = (error) => {
  const message = String(error?.message || error || '');
  return message.includes('404') || message.includes('is not found') || message.includes('not supported for generateContent');
};

const isQuotaError = (error) => {
  const message = String(error?.message || error || '');
  return message.includes('429') || message.includes('Too Many Requests') || message.includes('Quota exceeded');
};

const createQuotaError = (error) => {
  const message = String(error?.message || error || '');
  const retryMatch = message.match(/retryDelay":"(\d+)s"/i) || message.match(/retry in ([\d.]+)s/i);
  const retrySeconds = retryMatch ? Math.ceil(Number.parseFloat(retryMatch[1])) : null;
  const quotaError = new Error(
    retrySeconds
      ? `Gemini quota is temporarily exhausted. Please retry in about ${retrySeconds} seconds or use another API key with available quota.`
      : 'Gemini quota is exhausted for this API key/project. Please enable billing, wait for quota reset, or use another Gemini API key.'
  );
  quotaError.statusCode = 429;
  return quotaError;
};

const buildFallbackSummary = (text) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  const keySentences = sentences.slice(0, 5).map((sentence) => sentence.trim()).filter(Boolean);

  return [
    
    ...keySentences.map((sentence) => `- ${sentence}`),
  ].join('\n');
};

const SUMMARY_CHUNK_SIZE = 12000;
const MAX_SUMMARY_CHUNKS = 8;

const buildSummaryPrompt = (text, { part, total } = {}) => {
  const chunkLabel =
    part && total
      ? `\n\nThis is section ${part} of ${total}. Summarize only this section.`
      : '';

  return `

You are an expert teacher.

Your job is to explain study material in very simple English.
Rules:
1. Write as if teaching a 15-year-old student.
2. Use easy words and short sentences.
3. Avoid technical jargon whenever possible.
4. If a technical term is necessary, explain it in simple English.
5. Keep the summary concise and easy to understand.
6. Use bullet points.
7. Focus only on the most important concepts.
${chunkLabel}

Notes:
${text}
`;
};

const requestGeminiSummary = async (text, options = {}) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error('[Gemini] GEMINI_API_KEY is not configured.');
    return {
      summary: buildFallbackSummary(text),
      source: 'fallback',
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = buildSummaryPrompt(text, options);
  console.log('[Gemini] generateContent request characters:', prompt.length);

  let result;
  let lastError;

  for (const modelName of getGeminiModelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      result = await model.generateContent(prompt);
      console.log('[Gemini] Summary generated with model:', modelName);
      break;
    } catch (error) {
      lastError = error;
      console.error(`[Gemini] Model failed (${modelName}):`, error.message);
      if (error.response) console.error('[Gemini] Provider Error Response:', error.response);
      if (!isModelNotFoundError(error) && !isQuotaError(error)) {
        throw error;
      }
    }
  }

  if (!result) {
    if (isQuotaError(lastError)) {
      throw createQuotaError(lastError);
    }
    throw lastError || new Error('No Gemini model was available for summarization');
  }

  const response = await result.response;
  const summary = response.text();

  if (!summary || !summary.trim()) {
    throw new Error('Gemini returned an empty response');
  }

  return {
    summary: summary.trim(),
    source: 'gemini',
  };
};

const generateSummary = async (text) => {
  try {
    const chunks = chunkText(text, SUMMARY_CHUNK_SIZE).slice(0, MAX_SUMMARY_CHUNKS);

    if (!chunks.length) {
      throw new Error('No text available for summarization');
    }

    if (chunks.length === 1) {
      return await requestGeminiSummary(chunks[0]);
    }

    console.log('[Gemini] Chunked summarization:', {
      chunkCount: chunks.length,
      totalCharacters: text.length,
    });

    const partialSummaries = [];

    for (let index = 0; index < chunks.length; index += 1) {
      const chunkResult = await requestGeminiSummary(chunks[index], {
        part: index + 1,
        total: chunks.length,
      });
      partialSummaries.push(chunkResult.summary);
    }

    const combinedSummary = partialSummaries.join('\n\n');

    if (combinedSummary.length > SUMMARY_CHUNK_SIZE) {
      return await requestGeminiSummary(combinedSummary, { part: 1, total: 1 });
    }

    return {
      summary: combinedSummary,
      source: 'gemini',
    };
  } catch (error) {
    console.error('[Gemini] AI Error Detail:', error);
    return {
      summary: buildFallbackSummary(text),
      source: 'fallback',
    };
  }
};

module.exports = {
  generateSummary,
};
