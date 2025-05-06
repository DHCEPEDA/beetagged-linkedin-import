// Script to diagnose Replit webview connectivity issues using OpenAI
const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Read our server code
const serverCode = fs.readFileSync('./bee-tagged-server.js', 'utf8');

async function analyzeCode() {
  try {
    // Request analysis from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert Node.js and Express developer specializing in Replit deployments. Your task is to analyze server code and identify issues that might prevent the Replit webview feedback tool from connecting to the application."
        },
        {
          role: "user",
          content: `I have a Node.js Express application running on Replit. The application is running and accessible in the browser, and I can see from the logs that it's responding to requests. However, Replit's web_application_feedback_tool reports: "Application not working - please resolve the following error before requesting verification again: Web server is unreachable, please make sure the application is running."

Here's my server code:

\`\`\`javascript
${serverCode}
\`\`\`

What might be causing this issue? How can I modify the code to make the application accessible to Replit's feedback tool?`
        }
      ],
      max_tokens: 1500
    });

    console.log('\nAnalysis from GPT-4o:\n');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error querying OpenAI:', error);
  }
}

analyzeCode();