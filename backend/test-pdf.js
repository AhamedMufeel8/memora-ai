const { PDFParse } = require('pdf-parse');
const fs = require('fs/promises');
const path = require('path');

async function test() {
  try {
    const dataBuffer = await fs.readFile(path.join(__dirname, 'package.json')); // Just to see if PDFParse exists
    console.log(typeof PDFParse);
  } catch (error) {
    console.error(error);
  }
}
test();
