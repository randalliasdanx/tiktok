import express from 'express';
import OpenAI from 'openai';
import { ensureMasked } from '../utils/policy';

export const llmRouter = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

llmRouter.post('/proxy', express.json(), async (req, res) => {
  const { masked, messages = [] } = req.body ?? {};
  
  if (typeof masked !== 'string') {
    return res.status(400).json({ error: 'Invalid body: masked required' });
  }
  
  if (!ensureMasked(masked)) {
    return res.status(400).json({ error: 'Payload must be masked according to policy' });
  }

  try {
    // Set up SSE headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Build conversation history with the new masked message
    const conversationMessages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. The user may have redacted sensitive information in their messages for privacy. Please respond naturally and helpfully.'
      },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: masked
      }
    ];

    // Create streaming chat completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversationMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // End the stream
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // If streaming has started, send error in stream format
    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    res.end();
  }
});


