require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Default route → index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Gemini setup
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in .env file!");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ----------------- Chat Route -----------------
app.post('/chat', async (req, res) => {
    // We now receive both the message and the persona from the frontend
    const { message, persona } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message is empty' });
    }

    try {
        // Create a new chat session with the user's provided persona as the system instruction.
        // If the persona is empty, we fall back to a default, friendly persona.
        const systemInstruction = persona || "You are a helpful and friendly AI assistant.";
        const chat = model.startChat({
            history: [],
            systemInstruction: systemInstruction,
        });

        const result = await chat.sendMessage(message);

        const reply =
            result?.response?.text() ||
            "Oops, looks like I'm having a bit of an existential crisis and couldn't generate a response. Try asking again!";

        res.json({ reply });
    } catch (err) {
        console.error("❌ Gemini API Error Details:");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        } else {
            console.error(err.stack || err.message || err);
        }
        res.status(500).json({ error: 'AI request failed. See server logs.' });
    }
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});