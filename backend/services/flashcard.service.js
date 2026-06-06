const { GoogleGenerativeAI } = require('@google/generative-ai');

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash-latest',
];

const allowedDifficulties = new Set(['beginner', 'intermediate', 'advanced']);

const getGeminiModelCandidates = () => {
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  return [...new Set([configuredModel, ...DEFAULT_GEMINI_MODELS].filter(Boolean))];
};

const normalizeDifficulty = (difficulty = 'intermediate') => {
  const value = String(difficulty).toLowerCase();
  if (value === 'easy') return 'beginner';
  if (value === 'medium') return 'intermediate';
  if (value === 'hard') return 'advanced';
  return allowedDifficulties.has(value) ? value : 'intermediate';
};

const clampCardCount = (count) => {
  const parsed = Number.parseInt(count, 10);
  if (Number.isNaN(parsed)) return 20;
  return Math.min(Math.max(parsed, 5), 60);
};

const isModelNotFoundError = (error) => {
  const message = String(error?.message || error || '');
  return message.includes('404') || message.includes('is not found') || message.includes('not supported for generateContent');
};

const isQuotaError = (error) => {
  const message = String(error?.message || error || '');
  return message.includes('429') || message.includes('Too Many Requests') || message.includes('Quota exceeded');
};

// Detect authentication errors (e.g., leaked or revoked API key)
const isAuthError = (error) => {
  const message = String(error?.message || error || '');
  return message.includes('403') || message.toLowerCase().includes('leaked') || message.toLowerCase().includes('revoked');
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

const extractJson = (rawText) => {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI returned an invalid flashcard format');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

const normalizeFlashcard = (card, index) => {
  const question = String(card.question || card.front || '').trim();
  const answer = String(card.answer || card.back || '').trim();
  const topic = String(card.topic || 'General').trim().slice(0, 80);

  if (question.length < 8) {
    throw new Error(`Flashcard ${index + 1} needs a clearer question`);
  }

  if (answer.length < 8) {
    throw new Error(`Flashcard ${index + 1} needs a clearer answer`);
  }

  return {
    question,
    answer,
    topic: topic || 'General',
  };
};

const validateGeneratedFlashcards = (payload, cardCount) => {
  if (!payload || !Array.isArray(payload.flashcards)) {
    throw new Error('AI did not return a flashcards array');
  }

  const cards = [];
  const seen = new Set();

  for (const card of payload.flashcards) {
    if (cards.length >= cardCount) break;
    const normalized = normalizeFlashcard(card, cards.length);
    const key = `${normalized.question.toLowerCase()}::${normalized.answer.toLowerCase()}`;

    if (!seen.has(key)) {
      cards.push(normalized);
      seen.add(key);
    }
  }

  if (!cards.length) {
    throw new Error('AI did not generate any usable flashcards');
  }

  return cards;
};

const buildFlashcardPrompt = ({ text, difficulty, cardCount }) => `
You are an expert teacher and learning specialist.

Create educational flashcards from the provided study material.

Requirements:
- Focus only on important concepts from the provided material.
- Create concise question-answer pairs.
- Use simple English a student can understand.
- Avoid duplicate cards.
- Prioritize exam-relevant content.
- Cover definitions, concepts, formulas, comparisons, and key facts when present.
- Make answers easy to remember.
- Do not invent facts outside the study material.
- Difficulty: ${difficulty}.
- Generate exactly ${cardCount} flashcards.

Return only valid JSON in this exact shape:
{
  "title": "Short deck title",
  "topics": ["topic 1", "topic 2"],
  "flashcards": [
    {
      "question": "Clear question?",
      "answer": "Concise answer.",
      "topic": "Topic name"
    }
  ]
}

Study material:
${text}
`;

const generateFlashcardsWithGemini = async ({ text, difficulty, cardCount }) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 503;
    throw error;
  }

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const normalizedCount = clampCardCount(cardCount);
  const textForAi = String(text || '').slice(0, 60000);
  const prompt = buildFlashcardPrompt({
    text: textForAi,
    difficulty: normalizedDifficulty,
    cardCount: normalizedCount,
  });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let result;
  let lastError;

  for (const modelName of getGeminiModelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.35,
        },
      });

      result = await model.generateContent(prompt);
      console.log('[Gemini Flashcards] Generated with model:', modelName);
      break;
    } catch (error) {
      lastError = error;
      console.error(`[Gemini Flashcards] Model failed (${modelName}):`, error.message);
      if (isAuthError(error)) {
        const authError = new Error('Google Gemini API key is invalid or has been revoked. Please provide a valid API key.');
        authError.statusCode = 403;
        throw authError;
      }
      if (!isModelNotFoundError(error) && !isQuotaError(error)) {
        throw error;
      }
    }
  }

  if (!result) {
    if (isQuotaError(lastError)) {
      throw createQuotaError(lastError);
    }
    throw lastError || new Error('No Gemini model was available for flashcard generation');
  }

  const response = await result.response;
  const payload = extractJson(response.text());
  const flashcards = validateGeneratedFlashcards(payload, normalizedCount);

  return {
    title: String(payload.title || 'AI Flashcard Deck').trim().slice(0, 120),
    topics: Array.isArray(payload.topics)
      ? payload.topics.map((topic) => String(topic).trim()).filter(Boolean).slice(0, 10)
      : [],
    difficulty: normalizedDifficulty,
    flashcards,
  };
};

module.exports = {
  clampCardCount,
  generateFlashcardsWithGemini,
  normalizeDifficulty,
};
