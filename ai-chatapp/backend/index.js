require('dotenv').config();
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Helper function to classify complexity using the lightweight model
async function classifyComplexity(question) {
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: 'You are a classifier. Answer with "simple" or "complex" based on the user question.' },
                    { role: 'user', content: question }
                ],
                temperature: 0
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const classification =
            response.data.choices[0].message?.content?.trim().toLowerCase() ||
            'simple';

        return classification.includes('complex') ? 'complex' : 'simple';
    } catch (err) {
        console.error('Classification Error:', err.response?.data || err.message);
        return 'simple'; // fallback
    }
}

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message is empty' });
    }

    try {
        // Determine complexity first
        const complexity = await classifyComplexity(message);

        // Select appropriate model
        const model =
            complexity === 'complex'
                ? 'deepseek-r1-distill-llama-70b'
                : 'openai/gpt-oss-120b';

        // Send the actual chat request to the chosen model
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: model,
                messages: [
                    { role: 'system', content: 'You are a sweet and kind loving assistant.' },
                    { role: 'user', content: message }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiMessage =
            response.data.choices[0].message?.content ||
            response.data.choices[0].text ||
            'Sorry, I could not generate a response.';

        res.json({ reply: aiMessage });

    } catch (err) {
        console.error('Groq API Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'AI request failed. See server logs.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
