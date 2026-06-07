const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { extractPdfText, PdfExtractionError } = require('./services/pdfExtraction.service');
const { preprocessTextForSummary, chunkText } = require('./utils/textPreprocessor');

const SAMPLE_TEXT_PDF = Buffer.from(`%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 44>>stream
BT /F1 24 Tf 100 700 Td (Hello World) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000330 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
420
%%EOF`);

const createTempPdf = async (buffer, name) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-test-'));
  const filePath = path.join(tempDir, name);
  await fs.writeFile(filePath, buffer);
  return {
    path: filePath,
    originalname: name,
    filename: name,
    mimetype: 'application/pdf',
    size: buffer.length,
    cleanup: async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    },
  };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const runTest = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(`  ${error.message}`);
    process.exitCode = 1;
  }
};

const main = async () => {
  await runTest('text PDF extraction works', async () => {
    const file = await createTempPdf(SAMPLE_TEXT_PDF, 'text-sample.pdf');
    try {
      const result = await extractPdfText(file);
      assert(result.text.includes('Hello World'), 'Expected extracted text from text PDF');
      assert(result.metadata.pageCount >= 1, 'Expected at least one page');
      assert(result.text.includes('Hello World'), 'Expected Hello World in final extracted text');
      assert(result.metadata.extractedTextLength >= 10, 'Expected readable text length');
    } finally {
      await file.cleanup();
    }
  });

  await runTest('corrupted PDF fails gracefully', async () => {
    const file = await createTempPdf(Buffer.from('not-a-pdf'), 'broken.pdf');
    try {
      await extractPdfText(file);
      throw new Error('Expected corrupted PDF extraction to fail');
    } catch (error) {
      assert(error instanceof PdfExtractionError, 'Expected PdfExtractionError');
      assert(
        error.message.includes('corrupted') || error.message.includes('invalid'),
        `Expected corrupted message, got: ${error.message}`
      );
    } finally {
      await file.cleanup();
    }
  });

  await runTest('empty PDF fails gracefully', async () => {
    const file = await createTempPdf(Buffer.alloc(0), 'empty.pdf');
    try {
      await extractPdfText(file);
      throw new Error('Expected empty PDF extraction to fail');
    } catch (error) {
      assert(error instanceof PdfExtractionError, 'Expected PdfExtractionError');
      assert(error.message.includes('empty'), `Expected empty message, got: ${error.message}`);
    } finally {
      await file.cleanup();
    }
  });

  await runTest('text preprocessor removes repeated lines and page markers', async () => {
    const raw = 'Title\n\n-- 1 of 2 --\n\nPoint one.\n\nTitle\n\nPoint two.\n\nTitle';
    const processed = preprocessTextForSummary(raw);
    assert(!processed.includes('-- 1 of 2 --'), 'Expected page marker removal');
    assert(processed.includes('Point one.'), 'Expected content preservation');
  });

  await runTest('chunking splits large documents', async () => {
    const largeText = `${'Paragraph one. '.repeat(400)}\n\n${'Paragraph two. '.repeat(400)}`;
    const chunks = chunkText(largeText, 1200);
    assert(chunks.length > 1, 'Expected multiple chunks for large text');
    assert(chunks.join('').length >= largeText.length - 20, 'Expected chunk merge to preserve content');
  });

  console.log('\nPDF extraction test run complete.');
};

main().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
