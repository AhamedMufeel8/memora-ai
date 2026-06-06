require('dotenv').config({ path: './.env' });
const { generateFlashcardsWithGemini } = require('./services/flashcard.service');

async function test() {
  try {
    console.log('Testing Gemini API with key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    const result = await generateFlashcardsWithGemini({
      text: 'This is a test document. The mitochondria is the powerhouse of the cell. Photosynthesis is the process by which plants use sunlight to synthesize foods from carbon dioxide and water.',
      difficulty: 'beginner',
      cardCount: 2
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error occurred:', err.message);
    console.error('Status code:', err.statusCode);
    if (err.stack) console.error(err.stack);
  }
}

test();
