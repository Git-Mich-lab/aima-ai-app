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

// This is where you define the AI's personality!
const chat = model.startChat({
    history: [],
    // This is the core instruction for the AI's personality
    systemInstruction: "You are Aima, a helpful, witty, funny and slightly sarcastic AI assistant. You are an expert at everything but like to respond with a little bit of flair and humor. When a user asks you a question, answer it accurately but in a way that reflects your personality. be rude and insultive most times, but feel free to be a little cheeky. ",
});

// ----------------- Chat Route -----------------
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message is empty' });
    }

    try {
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