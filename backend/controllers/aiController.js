const fs = require('fs/promises');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { generateSummary } = require('../services/aiService');
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

const extractPdfText = async (file) => {
  if (!file?.path) {
    throw new AppError('Missing PDF file', 400);
  }

  const resolvedPath = path.resolve(file.path);
  console.log('[AI Summarizer] Uploaded file:', {
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: resolvedPath,
  });

  try {
    await fs.access(resolvedPath);
    const dataBuffer = await fs.readFile(resolvedPath);

    if (!dataBuffer.length) {
      throw new AppError('Uploaded PDF is empty', 400);
    }

    const parser = new PDFParse({ data: dataBuffer });
    let pdfData;

    try {
      pdfData = await parser.getText();
    } finally {
      await parser.destroy();
    }

    const extractedText = (pdfData.text || '').trim();
    console.log('[AI Summarizer] Extracted text:', {
      characters: extractedText.length,
      preview: extractedText.slice(0, 300),
    });

    if (!extractedText) {
      throw new AppError('PDF extraction failed: no readable text found', 422);
    }

    return extractedText;
  } catch (error) {
    if (error.isOperational) throw error;
    console.error('[AI Summarizer] PDF extraction error:', error);
    throw new AppError('PDF extraction failed. The file may be corrupted, encrypted, or scanned as images.', 422);
  }
};

const summarizeText = async (req, res) => {
  let uploadedPath;

  try {
    const { text } = req.body;
    uploadedPath = req.file?.path;

    if (!text && !req.file) {
      throw new AppError('Please provide text or upload a PDF', 400);
    }

    let notesText = typeof text === 'string' ? text.trim() : '';

    if (req.file) {
      notesText = await extractPdfText(req.file);
    }

    if (!notesText || notesText.trim() === '') {
      throw new AppError('Could not extract text from input', 400);
    }

    const textForAi = notesText.slice(0, MAX_TEXT_CHARS);
    console.log('[AI Summarizer] AI request:', {
      originalCharacters: notesText.length,
      sentCharacters: textForAi.length,
    });

    const summaryResult = await generateSummary(textForAi);
    console.log('[AI Summarizer] AI response:', {
      source: summaryResult.source,
      characters: summaryResult.summary.length,
      preview: summaryResult.summary.slice(0, 300),
    });

    const newSummary = new Summary({
      userId: req.user._id,
      originalText: notesText,
      generatedSummary: summaryResult.summary
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
    };

    console.log('[AI Summarizer] API response:', {
      success: payload.success,
      summaryCharacters: payload.summary.length,
      source: payload.source,
    });

    res.json(payload);
  } catch (error) {
    console.error('[AI Summarizer] Summarize error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error during summarization',
    });
  } finally {
    await cleanupFile(uploadedPath);
  }
};

module.exports = {
  summarizeText,
  AppError,
};
