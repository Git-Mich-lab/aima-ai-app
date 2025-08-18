// ----------------- Chat Elements -----------------
const welcomeScreen = document.getElementById('welcome-screen');
const chatContainer = document.getElementById('chat-container');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let firstMessageSent = false;

// ----------------- Settings Elements -----------------
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const gradient1Input = document.getElementById('gradient1');
const gradient2Input = document.getElementById('gradient2');
const gradientToggle = document.getElementById('gradientToggle');
const solidToggle = document.getElementById('solidToggle');
const solidColorInput = document.getElementById('solidColor');
const fontSizeInput = document.getElementById('fontSize');
const textColorInput = document.getElementById('textColor');
const containerWidthInput = document.getElementById('containerWidth');

let gradientAnimationOn = gradientToggle ? gradientToggle.checked : true;

// ----------------- API Base URL -----------------
const API_BASE =
    window.location.hostname === "localhost" && window.location.port === "5500"
        ? "http://localhost:5000"
        : window.location.origin;

// ----------------- Chat Functionality -----------------
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});

// Hide welcome only once and reveal chat
function fadeOutWelcomeOnce() {
    if (firstMessageSent) return;
    firstMessageSent = true;

    // Fade + collapse welcome
    welcomeScreen.classList.add('fade-out');

    // After transition ends, fully hide it and reveal chat
    const onEnd = () => {
        welcomeScreen.classList.add('hidden');
        welcomeScreen.classList.remove('fade-out');

        // Reveal chat container
        chatContainer.classList.remove('hidden'); 
        chatContainer.classList.add('chat-reveal');

        welcomeScreen.removeEventListener('transitionend', onEnd);
    };
    welcomeScreen.addEventListener('transitionend', onEnd);

    // Safety fallback
    setTimeout(onEnd, 800);
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // First message triggers fade-out of welcome
    fadeOutWelcomeOnce();

    appendMessage('user', message);
    userInput.value = '';

    // Show AI thinking animation
    const thinkingDiv = document.createElement('div');
    thinkingDiv.classList.add('message', 'ai');
    thinkingDiv.id = 'thinking';
    thinkingDiv.innerHTML = `
        <div class="thinking">
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
        </div>
    `;
    chatBox.appendChild(thinkingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await res.json();
        thinkingDiv.remove();
        await appendAIMessage(data.reply);
    } catch (err) {
        thinkingDiv.remove();
        appendMessage('ai', 'Error connecting to AI.');
    }
}

// Append messages
function appendMessage(sender, message) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

// AI message fade-in (4 lines at a time)
async function appendAIMessage(message) {
    const aiDiv = document.createElement('div');
    aiDiv.classList.add('message', 'ai');
    chatBox.appendChild(aiDiv);

    const lines = message.split('\n');
    let chunk = '';
    let lineCount = 0;

    for (let i = 0; i < lines.length; i++) {
        chunk += lines[i] + '\n';
        lineCount++;

        if (lineCount === 4 || i === lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 250));
            aiDiv.textContent += chunk;
            chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
            chunk = '';
            lineCount = 0;
        }
    }
}

// ----------------- Settings Panel Toggle -----------------
settingsBtn.addEventListener('click', () => {
    if (settingsPanel.classList.contains('open')) {
        // Closing
        settingsPanel.classList.remove('open');
        settingsPanel.classList.add('closing');
        setTimeout(() => {
            settingsPanel.style.display = 'none';
            settingsPanel.classList.remove('closing');
        }, 300); 
    } else {
        // Opening
        settingsPanel.style.display = 'flex';
        setTimeout(() => {
            settingsPanel.classList.add('open');
        }, 10); 
    }
});

// ----------------- Background & Settings Updates -----------------
function updateBackground() {
    if (solidToggle && solidToggle.checked) {
        document.body.style.background = solidColorInput.value;
        document.body.classList.remove('gradient-animated');
    } else {
        document.body.style.background = '';
        if (gradient1Input && gradient2Input) {
            document.body.style.setProperty('--gradient1', gradient1Input.value);
            document.body.style.setProperty('--gradient2', gradient2Input.value);
        }

        if (gradientAnimationOn) {
            document.body.classList.add('gradient-animated');
        } else {
            document.body.classList.remove('gradient-animated');
        }
    }
}

// Live updates
if (gradient1Input) gradient1Input.addEventListener('input', updateBackground);
if (gradient2Input) gradient2Input.addEventListener('input', updateBackground);
if (gradientToggle) gradientToggle.addEventListener('change', () => {
    gradientAnimationOn = gradientToggle.checked;
    updateBackground();
});
if (solidToggle) solidToggle.addEventListener('change', updateBackground);
if (solidColorInput) solidColorInput.addEventListener('input', updateBackground);

if (fontSizeInput) fontSizeInput.addEventListener('input', () => {
    chatBox.style.fontSize = fontSizeInput.value + 'px';
});
if (textColorInput) textColorInput.addEventListener('input', () => {
    chatBox.style.color = textColorInput.value;
});
if (containerWidthInput) containerWidthInput.addEventListener('input', () => {
    const minWidth = 400;
    const maxWidth = 1300;
    const value = minWidth + ((maxWidth - minWidth) * (containerWidthInput.value / 100));
    document.querySelector('.container').style.maxWidth = value + 'px';
});

// Apply default background on load
updateBackground();
