// Netlify Function pour proxy Groq API
// Place ce fichier dans netlify/functions/groq-proxy.js

exports.handler = async function(event, context) {
  // CORS
  return new Promise(async (resolve) => {
    if (event.httpMethod === 'OPTIONS') {
      resolve({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: ''
      });
      return;
    }
    if (event.httpMethod !== 'POST') {
      resolve({
        statusCode: 405,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Method not allowed' })
      });
      return;
    }
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
        },
        body: event.body
      });
      const data = await response.json();
      resolve({
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.message || 'Internal server error' })
      });
    }
  });
};
