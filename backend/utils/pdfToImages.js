const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');
const { createCanvas } = require('canvas');

let pdfjsModulePromise;

const getPdfJs = async () => {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }

  const pdfjs = await pdfjsModulePromise;
  const packageRoot = path.dirname(require.resolve('pdfjs-dist/package.json'));

  const workerPath = path.join(packageRoot, 'legacy', 'build', 'pdf.worker.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  return pdfjs;
};

const renderPdfPages = async (inputPath, { scale = 2 } = {}) => {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await fs.readFile(inputPath));
  const packageRoot = path.dirname(require.resolve('pdfjs-dist/package.json'));
  const standardFontsPath = path.join(packageRoot, 'standard_fonts');
  const standardFontDataUrl = `${pathToFileURL(standardFontsPath).href}/`;

  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    standardFontDataUrl,
  });

  const pdfDocument = await loadingTask.promise;
  const images = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    images.push(canvas.toBuffer('image/png'));
  }

  return {
    images,
    pageCount: pdfDocument.numPages,
  };
};

module.exports = {
  renderPdfPages,
};
