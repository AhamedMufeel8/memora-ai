const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure GEMINI_API_KEY is available
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Maps the student level to specific pedagogical guidelines
 */
const getLevelInstruction = (level) => {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return 'Target Level: Beginner (12-15 year old student). Use very simple analogies, avoid or explain any technical terms immediately, keep explanations gentle and highly intuitive, and use everyday real-world examples.';
    case 'intermediate':
      return 'Target Level: Intermediate (High school or early college). Use standard terminology, explain system internals/mechanisms, use academic or technical analogies, and detail core structural logic.';
    case 'advanced':
      return 'Target Level: Advanced (University graduate / Professional). Use advanced technical terminology, detail trade-offs, architecture, performance implications, mathematics, or deep algorithms directly. Do not hold back on complex concepts.';
    default:
      return 'Target Level: Beginner (15-year old student). Explain concepts clearly and simply, using easy analogies.';
  }
};

/**
 * Builds the comprehensive AI tutor system prompt
 */
const buildSystemPrompt = (studentLevel, contextualData = '') => {
  const levelInstruction = getLevelInstruction(studentLevel);
  
  let prompt = `You are an expert teacher and personal AI Study Coach.

Rules:
1. Explain concepts clearly and simply.
2. Teach as if helping a student learn and master the subject.
3. Use concrete examples whenever possible.
4. Break difficult or massive topics into smaller, easily digestible parts.
5. Use clear structural headings and bullet points.
6. Encourage deep understanding and intuition instead of rote memorization.
7. Be friendly, encouraging, and highly supportive.
8. If a question is vague or unclear, ask the student for clarification gently.
9. Never give one-line or overly brief answers. Always structure answers comprehensively for thorough learning.

${levelInstruction}
`;

  if (contextualData) {
    prompt += `
[Study Context]
You have access to the following reference context from the student's library documents:
"${contextualData}"
Prioritize answering from this reference context if relevant, and reference it naturally in your explanation.
`;
  }

  prompt += `
Strict Response Format Requirement:
Your response MUST be fully formatted in clean Markdown using exactly the following four sections in order. Do not skip any section headings:

# Explanation
[Write a simple, clear, age-appropriate explanation of the topic here]

# Key Points
• [Point 1: Detailed important concept]
• [Point 2: Detailed important concept]
• [Point 3: Detailed important concept]

# Example
[Provide a clear, engaging, real-world example or code snippet here]

# Quick Revision
• [Revision Takeaway 1: Short, impactful recall sentence]
• [Revision Takeaway 2: Short, impactful recall sentence]
• [Revision Takeaway 3: Short, impactful recall sentence]
`;

  return prompt;
};

/**
 * Generates an educational response using Gemini 1.5 Flash
 */
const generateTutorResponse = async (history, currentMessage, studentLevel = 'beginner', contextDocs = '') => {
  try {
    if (!genAI) {
      console.error('[Gemini Tutor] GEMINI_API_KEY is not configured.');
      throw new Error('AI API Key is missing. Please configure GEMINI_API_KEY in backend .env.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    // System instruction is passed as systemInstruction configuration parameter in newer SDK versions,
    // or appended to the prompt for safety. Let's send it as a prepended system context block.
    const systemPrompt = buildSystemPrompt(studentLevel, contextDocs);

    // Format chat history for Gemini API.
    // Gemini chat API expects: { role: 'user' | 'model', parts: [{ text: string }] }
    const formattedContents = [];
    
    // Append history
    if (history && history.length > 0) {
      history.forEach(msg => {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Append system instruction and current message
    // To ensure Gemini strictly respects the prompt parameters and level guidelines, we prepend the system prompt.
    const finalUserPrompt = `[System Instructions]\n${systemPrompt}\n\n[Student Message]\n${currentMessage}`;
    formattedContents.push({
      role: 'user',
      parts: [{ text: finalUserPrompt }]
    });

    console.log('[Gemini Tutor] Sending chat request. History turn count:', formattedContents.length - 1);
    
    const result = await model.generateContent({
      contents: formattedContents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    });

    const response = await result.response;
    const responseText = response.text();

    if (!responseText || !responseText.trim()) {
      throw new Error('Gemini returned an empty response');
    }

    return responseText.trim();
  } catch (error) {
    console.error('[Gemini Tutor] AI Generation Error:', error);
    throw error;
  }
};

/**
 * Auto-generates a clean, concise, 2-4 word title for a new chat session
 */
const generateSessionTitle = async (firstMessageText) => {
  try {
    if (!genAI) return 'Learning Session';

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const prompt = `You are a helper utility. Look at the following first question asked by a student in a chat and generate a highly concise title (maximum 3-4 words) that summarizes the topic. Return ONLY the title itself. Do not use quotes, punctuation, or extra sentences.
    
Student Question: "${firstMessageText}"
Title:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const titleText = response.text();

    return titleText ? titleText.trim().replace(/['"“”]/g, '') : 'Study Session';
  } catch (error) {
    console.error('[Gemini Tutor] Title generation failed, using fallback:', error.message);
    return 'Study Session';
  }
};

module.exports = {
  generateTutorResponse,
  generateSessionTitle
};
