const fs = require('fs/promises');
const { generateSummary } = require('../services/ai.service');
const { extractPdfText, PdfExtractionError } = require('../services/pdfExtraction.service');
const { preprocessTextForSummary } = require('../utils/textPreprocessor');
const Summary = require('../models/Summary');

const MAX_TEXT_CHARS = 60000;

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const cleanupFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
    console.log('[AI Summarizer] Uploaded file cleaned up:', filePath);
  } catch (error) {
    console.log('[AI Summarizer] File cleanup skipped:', error.message);
  }
};

const wantsProgressStream = (req) => {
  const header = String(req.headers['x-progress-stream'] || '').toLowerCase();
  return header === 'true' || header === '1';
};

const createStreamResponder = (res) => {
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  return {
    progress(stage, extra = {}) {
      res.write(`${JSON.stringify({ type: 'progress', stage, ...extra })}\n`);
    },
    result(data) {
      res.write(`${JSON.stringify({ type: 'result', data })}\n`);
      res.end();
    },
    error(message, statusCode = 500) {
      res.status(statusCode);
      res.write(`${JSON.stringify({ type: 'error', message })}\n`);
      res.end();
    },
  };
};

const summarizeText = async (req, res) => {
  let uploadedPath;
  const streaming = wantsProgressStream(req);
  const stream = streaming ? createStreamResponder(res) : null;

  try {
    const { text } = req.body;
    uploadedPath = req.file?.path;

    if (!text && !req.file) {
      throw new AppError('Please provide text or upload a PDF', 400);
    }

    let notesText = typeof text === 'string' ? text.trim() : '';
    let extractionMetadata = null;

    if (req.file) {
      const extraction = await extractPdfText(req.file, {
        onStage: (stage, extra = {}) => {
          stream?.progress(stage, extra);
        },
      });

      notesText = extraction.text;
      extractionMetadata = extraction.metadata;

      console.log('[AI Summarizer] PDF metadata:', extractionMetadata);
    }

    if (!notesText || notesText.trim() === '') {
      throw new AppError('No readable content found', 422);
    }

    const preprocessedText = preprocessTextForSummary(notesText);
    const textForAi = preprocessedText.slice(0, MAX_TEXT_CHARS);

    console.log('[AI Summarizer] AI request:', {
      originalCharacters: notesText.length,
      preprocessedCharacters: preprocessedText.length,
      sentCharacters: textForAi.length,
      extractionMetadata,
    });

    stream?.progress('generating');

    const summaryResult = await generateSummary(textForAi);
    console.log('[AI Summarizer] AI response:', {
      source: summaryResult.source,
      characters: summaryResult.summary.length,
      preview: summaryResult.summary.slice(0, 300),
    });

    stream?.progress('saving');

    const newSummary = new Summary({
      userId: req.user._id,
      originalText: notesText,
      generatedSummary: summaryResult.summary,
    });

    const savedSummary = await newSummary.save();
    console.log('[AI Summarizer] Database save:', {
      id: savedSummary._id,
      userId: savedSummary.userId,
    });

    const payload = {
      success: true,
      summary: summaryResult.summary,
      source: summaryResult.source,
      id: savedSummary._id,
      extraction: extractionMetadata,
    };

    console.log('[AI Summarizer] API response:', {
      success: payload.success,
      summaryCharacters: payload.summary.length,
      source: payload.source,
    });

    if (streaming) {
      stream.result(payload);
      return;
    }

    res.json(payload);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error during summarization';

    console.error('[AI Summarizer] Summarize error:', message);
    if (error.stack) console.error(error.stack);

    if (streaming) {
      stream.error(message, statusCode);
      return;
    }

    res.status(statusCode).json({
      success: false,
      message,
      code: error.code,
    });
  } finally {
    await cleanupFile(uploadedPath);
  }
};

module.exports = {
  summarizeText,
  AppError,
  PdfExtractionError,
};
