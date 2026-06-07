const { GoogleGenerativeAI } = require('@google/generative-ai');

const allowedDifficulties = new Set(['beginner', 'intermediate', 'advanced']);
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

// Detect authentication errors such as leaked or revoked API keys
const isAuthError = (error) => {
  const message = String(error?.message || error || '');
  return message.includes('403') || message.toLowerCase().includes('leaked') || message.toLowerCase().includes('revoked');
};

// Detect quota exhaustion errors
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

const normalizeDifficulty = (difficulty = 'intermediate') => {
  const value = String(difficulty).toLowerCase();
  if (value === 'easy') return 'beginner';
  if (value === 'medium') return 'intermediate';
  if (value === 'hard') return 'advanced';
  return allowedDifficulties.has(value) ? value : 'intermediate';
};

const clampQuestionCount = (count) => {
  const parsed = Number.parseInt(count, 10);
  if (Number.isNaN(parsed)) return 10;
  return Math.min(Math.max(parsed, 3), 25);
};

const extractJson = (rawText) => {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI returned an invalid quiz format');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

const normalizeQuestion = (question, index) => {
  const type = 'mcq';
  const prompt = String(question.question || '').trim();
  const correctAnswer = String(question.correctAnswer || question.answer || '').trim();
  const explanation = String(question.explanation || '').trim();

  if (!prompt || !correctAnswer) {
    throw new Error(`Question ${index + 1} is missing required content`);
  }

  let options = Array.isArray(question.options)
    ? question.options.map((option) => String(option).trim()).filter(Boolean)
    : [];

  options = [...new Set(options)];

  if (options.length !== 4) {
    throw new Error(`Question ${index + 1} needs four multiple-choice options`);
  }

  const matchingOption = options.find((option) => option.toLowerCase() === correctAnswer.toLowerCase());
  if (!matchingOption) {
    throw new Error(`Question ${index + 1} correct answer must exactly match one option`);
  }

  if (explanation.length < 20) {
    throw new Error(`Question ${index + 1} needs a clear answer explanation`);
  }

  return {
    type,
    question: prompt,
    options,
    correctAnswer: matchingOption,
    explanation,
  };
};

const validateGeneratedQuiz = (payload, questionCount) => {
  if (!payload || !Array.isArray(payload.questions)) {
    throw new Error('AI did not return a questions array');
  }

  const normalized = [];
  const seenQuestions = new Set();

  for (const question of payload.questions) {
    if (normalized.length >= questionCount) break;
    const normalizedQuestion = normalizeQuestion(question, normalized.length);
    const questionKey = normalizedQuestion.question.toLowerCase();

    if (!seenQuestions.has(questionKey)) {
      normalized.push(normalizedQuestion);
      seenQuestions.add(questionKey);
    }
  }

  if (!normalized.length) {
    throw new Error('AI did not generate any usable questions');
  }

  return normalized;
};

const buildQuizPrompt = ({ text, difficulty, questionCount }) => `
You are an expert teacher and assessment designer.

Create high-quality educational quiz questions based only on the provided study material.

Requirements:
- Generate accurate questions only from the provided content.
- Use simple and clear language.
- Avoid ambiguity and duplicate questions.
- Include answer explanations.
- Questions must test understanding, not memorization.
- Generate ONLY multiple-choice questions.
- Every question must be easy to understand for a student.
- Every question must have exactly four options.
- The correctAnswer must exactly match one of the four options.
- Verify the correct answer carefully from the study material before returning JSON.
- Distractor options must be plausible but clearly wrong.
- Do not use "all of the above", "none of the above", trick wording, or vague choices.
- Difficulty: ${difficulty}.
- Generate exactly ${questionCount} questions.

Return only valid JSON in this exact shape:
{
  "title": "Short quiz title",
  "topics": ["topic 1", "topic 2"],
  "questions": [
    {
      "type": "mcq",
      "question": "Clear question written in simple language?",
      "options": ["Option one", "Option two", "Option three", "Option four"],
      "correctAnswer": "Option one",
      "explanation": "Explain why the correct answer is right using the provided study material."
    }
  ]
}

Study material:
${text}
`;

const generateQuizWithGemini = async ({ text, difficulty, questionCount }) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 503;
    throw error;
  }

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const normalizedCount = clampQuestionCount(questionCount);
  const textForAi = String(text || '').slice(0, 60000);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = buildQuizPrompt({
    text: textForAi,
    difficulty: normalizedDifficulty,
    questionCount: normalizedCount,
  });
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
      console.log('[Gemini Quiz] Generated with model:', modelName);
      break;
    } catch (error) {
      lastError = error;
      console.error(`[Gemini Quiz] Model failed (${modelName}):`, error.message);
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
    throw lastError || new Error('No Gemini model was available for quiz generation');
  }

  const response = await result.response;
  const payload = extractJson(response.text());
  const questions = validateGeneratedQuiz(payload, normalizedCount);

  return {
    title: String(payload.title || 'AI Smart Quiz').trim().slice(0, 120),
    topics: Array.isArray(payload.topics)
      ? payload.topics.map((topic) => String(topic).trim()).filter(Boolean).slice(0, 8)
      : [],
    difficulty: normalizedDifficulty,
    questions,
  };
};

/**
 * Simple deterministic local fallback for quiz generation.
 * Creates multiple-choice questions by extracting sentences and forming naive options.
 */
const generateQuizLocally = ({ text, difficulty, questionCount }) => {
  const normalizedCount = clampQuestionCount(questionCount);
  const sentences = String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const questions = [];
  for (let i = 0; i < Math.min(normalizedCount, sentences.length); i++) {
    const sentence = sentences[i].trim();
    const prompt = sentence.length > 80 ? sentence.slice(0, 77) + '...' : sentence;
    const correct = 'Correct answer placeholder';
    const options = [correct, 'Option B', 'Option C', 'Option D'];
    // Shuffle options deterministic simple rotation
    const shuffled = options.slice(i % 4).concat(options.slice(0, i % 4));
    const correctOption = shuffled[0];
    questions.push({
      type: 'mcq',
      question: prompt,
      options: shuffled,
      correctAnswer: correctOption,
      explanation: 'Local fallback explanation.',
    });
  }

  return {
    title: 'Local Quiz',
    topics: ['General'],
    difficulty: normalizeDifficulty(difficulty),
    questions,
  };
};

/**
 * Public API that attempts Gemini first, falls back to local generation on recoverable errors.
 */
const generateQuiz = async (params) => {
  try {
    return await generateQuizWithGemini(params);
  } catch (err) {
    if (err.statusCode === 403) {
      throw err;
    }
    console.warn('[Quiz Service] Gemini generation failed, falling back to local algorithm. Reason:', err.message);
    return generateQuizLocally(params);
  }
};

module.exports = {
  clampQuestionCount,
  generateQuizWithGemini,
  generateQuiz,
  normalizeDifficulty,
};
