require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
