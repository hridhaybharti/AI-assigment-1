const express = require('express');
const path = require('path');
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Hugging Face Inference client with API key from .env
const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat endpoint using Hugging Face streaming
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    let output = "";

    try {
        // Streaming response from Hugging Face model
        const stream = client.chatCompletionStream({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [
                { role: "user", content: userMessage }
            ],
            max_tokens: 500
        });

        // Collect the response from the stream
        for await (const chunk of stream) {
            if (chunk.choices && chunk.choices.length > 0) {
                const newContent = chunk.choices[0].delta.content;
                output += newContent;
                console.log(newContent); // Log the streamed content to console
            }
        }

        res.json({ reply: output });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
