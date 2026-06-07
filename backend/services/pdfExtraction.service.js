const fs = require('fs/promises');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { renderPdfPages } = require('../utils/pdfToImages');

const MIN_TEXT_LENGTH = 100;
const MIN_READABLE_LENGTH = 10;
const LOG_PREFIX = '[PDF Extraction]';

class PdfExtractionError extends Error {
  constructor(message, statusCode = 422, code = 'EXTRACTION_FAILED') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const classifyPdfError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();

  if (
    message.includes('password') ||
    message.includes('encrypt') ||
    message.includes('needs password')
  ) {
    return new PdfExtractionError(
      'PDF is encrypted. Please upload an unprotected PDF.',
      422,
      'PDF_ENCRYPTED'
    );
  }

  if (
    message.includes('invalid pdf') ||
    message.includes('corrupt') ||
    message.includes('malformed') ||
    message.includes('failed to parse') ||
    message.includes('invalid header')
  ) {
    return new PdfExtractionError(
      'PDF is corrupted or has an invalid format.',
      422,
      'PDF_CORRUPTED'
    );
  }

  return null;
};

const parseWithPdfParse = async (dataBuffer) => {
  const parser = new PDFParse({ data: dataBuffer });

  try {
    const pdfData = await parser.getText();
    return {
      text: String(pdfData.text || '').trim(),
      pageCount: pdfData.total || pdfData.pages?.length || 0,
    };
  } finally {
    await parser.destroy();
  }
};

const ocrPdfPages = async (filePath, { onPageProgress } = {}) => {
  const { images, pageCount } = await renderPdfPages(filePath, { scale: 2 });
  const pageTexts = [];

  for (let pageNum = 0; pageNum < images.length; pageNum += 1) {
    const currentPage = pageNum + 1;

    if (onPageProgress) {
      onPageProgress(currentPage, pageCount);
    }

    const result = await Tesseract.recognize(images[pageNum], 'eng', {
      logger: () => {},
    });

    const pageText = String(result?.data?.text || '').trim();
    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  return {
    text: pageTexts.join('\n\n').trim(),
    pageCount,
  };
};

const extractPdfText = async (file, { onStage } = {}) => {
  if (!file?.path) {
    throw new PdfExtractionError('Missing PDF file', 400, 'MISSING_FILE');
  }

  const resolvedPath = path.resolve(file.path);
  const fileSize = file.size || 0;

  console.log(`${LOG_PREFIX} Starting extraction`, {
    originalname: file.originalname,
    fileSize,
    path: resolvedPath,
  });

  let dataBuffer;

  try {
    await fs.access(resolvedPath);
    dataBuffer = await fs.readFile(resolvedPath);
  } catch (error) {
    const classified = classifyPdfError(error);
    if (classified) throw classified;
    throw new PdfExtractionError('PDF is corrupted or has an invalid format.', 422, 'PDF_CORRUPTED');
  }

  if (!dataBuffer.length) {
    throw new PdfExtractionError('Uploaded PDF is empty', 400, 'EMPTY_FILE');
  }

  if (onStage) onStage('extracting');

  let pageCount = 0;
  let extractedText = '';
  let usedOcr = false;
  let ocrAttempted = false;

  try {
    const pdfResult = await parseWithPdfParse(dataBuffer);
    extractedText = pdfResult.text;
    pageCount = pdfResult.pageCount;

    console.log(`${LOG_PREFIX} pdf-parse result`, {
      fileSize,
      pageCount,
      extractedTextLength: extractedText.length,
    });

    if (extractedText.length < MIN_TEXT_LENGTH) {
      console.log(`${LOG_PREFIX} OCR fallback triggered`, {
        reason: extractedText.length === 0 ? 'no_text' : 'insufficient_text',
        extractedTextLength: extractedText.length,
        threshold: MIN_TEXT_LENGTH,
      });

      if (onStage) onStage('ocr');
      ocrAttempted = true;

      try {
        const ocrResult = await ocrPdfPages(resolvedPath, {
          onPageProgress: (current, total) => {
            if (onStage) onStage('ocr', { page: current, total });
          },
        });

        const ocrText = ocrResult.text;
        pageCount = ocrResult.pageCount || pageCount;

        if (ocrText.length > extractedText.length) {
          extractedText = ocrText;
          usedOcr = true;
        }

        console.log(`${LOG_PREFIX} OCR result`, {
          pageCount,
          ocrTextLength: ocrText.length,
          selectedSource: usedOcr ? 'ocr' : 'pdf-parse',
          finalTextLength: extractedText.length,
        });
      } catch (ocrError) {
        console.error(`${LOG_PREFIX} OCR failed`, ocrError);

        if (extractedText.length >= MIN_READABLE_LENGTH) {
          console.log(`${LOG_PREFIX} Falling back to pdf-parse text after OCR failure`);
        } else {
          throw new PdfExtractionError('OCR extraction failed', 422, 'OCR_FAILED');
        }
      }
    }
  } catch (error) {
    if (error instanceof PdfExtractionError) throw error;

    const classified = classifyPdfError(error);
    if (classified) throw classified;

    console.error(`${LOG_PREFIX} pdf-parse error`, error);
    throw new PdfExtractionError('PDF is corrupted or has an invalid format.', 422, 'PDF_CORRUPTED');
  }

  if (!extractedText || extractedText.length < MIN_READABLE_LENGTH) {
    throw new PdfExtractionError('No readable content found in this PDF.', 422, 'NO_CONTENT');
  }

  console.log(`${LOG_PREFIX} Extraction complete`, {
    fileSize,
    pageCount,
    extractedTextLength: extractedText.length,
    ocrFallbackTriggered: ocrAttempted,
    ocrUsedAsSource: usedOcr,
    ocrTextLength: usedOcr ? extractedText.length : 0,
  });

  return {
    text: extractedText,
    metadata: {
      fileSize,
      pageCount,
      extractedTextLength: extractedText.length,
      ocrFallbackTriggered: ocrAttempted,
      ocrUsedAsSource: usedOcr,
      ocrTextLength: usedOcr ? extractedText.length : 0,
    },
  };
};

module.exports = {
  extractPdfText,
  PdfExtractionError,
  MIN_TEXT_LENGTH,
};
