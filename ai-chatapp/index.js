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

// ----------------- Gemini Setup -----------------
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file!");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Text/chat model only
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ----------------- Conversation Memory -----------------
let chatHistory = []; // Stores past conversation messages

// ----------------- Chat Route -----------------
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is empty' });
  }

  try {
    // Add user message to history
    chatHistory.push({ role: "user", parts: [{ text: message }] });

    // Generate response with memory (include history)
    const result = await textModel.generateContent({
      contents: chatHistory
    });

    const reply = result?.response?.text() || "Sorry, I couldn't generate a response.";

    // Add AI response to history
    chatHistory.push({ role: "model", parts: [{ text: reply }] });

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

// ----------------- Reset Conversation -----------------
app.post('/reset', (req, res) => {
  chatHistory = [];
  res.json({ message: "Conversation reset ✅" });
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
