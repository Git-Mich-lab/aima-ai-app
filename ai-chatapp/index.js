require('dotenv').config();
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; // Render assigns PORT dynamically

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'))
);

app.get('/funfact', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'funfact.html'));
});


// ----------------- Helper: Complexity Classification -----------------------------
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
            response.data.choices[0].message?.content?.trim().toLowerCase() || 'simple';
        return classification.includes('complex') ? 'complex' : 'simple';
    } catch (err) {
        console.error('Classification Error:', err.response?.data || err.message);
        return 'simple'; // fallback
    }
}

// ----------------- Chat Route --------------------------------------
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message is empty' });
    }

    try {
        const complexity = await classifyComplexity(message);
        const model = complexity === 'complex' ? 'deepseek-r1-distill-llama-70b' : 'openai/gpt-oss-120b';

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model,
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

//-----------------Fun fact route ---------------------------------------

// Random Fun Fact Endpoint
app.post('/funfact', async (req, res) => {
    try {
        const prompt = "gimme a fact.";
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: 'You are a fun-fact generator.' },
                    { role: 'user', content: prompt }
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

        const fact = response.data.choices[0].message?.content || "Couldn't generate a fact.";
        res.json({ fact });

    } catch (err) {
        console.error('Groq API Error:', err.response?.data || err.message);
        res.status(500).json({ fact: "Error generating fact." });
    }
});


// ----------------- Start Server -----------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
