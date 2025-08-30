import express from 'express';
import OpenAI from 'openai';
import { ensureMasked } from '../utils/policy.js';

export const llmRouter: express.Router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

llmRouter.post('/proxy', async (req, res) => {
  const { masked, messages = [], images = [] } = req.body ?? {};
  
  // Debug logging (commented out for production)
  // console.log('🔍 LLM Request Debug:');
  // console.log('  - Masked text:', masked);
  // console.log('  - Messages count:', messages.length);
  // console.log('  - Images count:', images.length);
  
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
        content: 'You are a helpful AI assistant. The user may have redacted sensitive information in their messages for privacy. The redacted information will be wrapped in [MASKED] tags. When referring to redacted content in your responses, do not use square brackets or phrases like "[redacted]" or "[masked information]". Instead, refer to it naturally - for example, use phrases like "the person you mentioned", "that information", or "the details you provided". Please respond naturally and helpfully while respecting the user\'s privacy choices.'
      },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    ];

    // Build the current user message with text and images
    const currentUserMessage: any = {
      role: 'user' as const,
      content: []
    };

    // Add text content if provided
    if (masked.trim()) {
      currentUserMessage.content.push({
        type: 'text',
        text: masked
      });
    }

    // Add image content if provided
    if (images && images.length > 0) {
      for (const imageData of images) {
        currentUserMessage.content.push({
          type: 'image_url',
          image_url: {
            url: imageData,
            detail: 'high'
          }
        });
      }
    }

    // If no content, fall back to just text
    if (currentUserMessage.content.length === 0) {
      currentUserMessage.content = masked;
    }

    conversationMessages.push(currentUserMessage);

    // Select appropriate model based on content
    const selectedModel = images && images.length > 0 ? 'gpt-4o' : 'gpt-3.5-turbo';

    // Create streaming chat completion
    const stream = await openai.chat.completions.create({
      model: selectedModel,
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


