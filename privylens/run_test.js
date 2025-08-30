/**
 * Simple Test Runner for Enhanced Redaction System
 * Run this after starting your server: node run_test.js
 */

const http = require('http');

// Test data that should trigger all three models differently
const testData = {
  text: `Hi! I'm Alice Johnson working at Meta Platforms in Menlo Park, California. 
  You can reach me at alice.johnson@meta.com or call (650) 555-0123. 
  My colleague @bob_tech_guru also works here. 
  BTW my personal number is 415-555-9876 and credit card is 4532-1234-5678-9012.
  We're collaborating with researchers from Stanford University and Google DeepMind.
  Dr. Sarah Chen from MIT published related work - contact her at s.chen@mit.edu.`,
  policy: {
    emails: true,
    phones: true,
    cards: true
  }
};

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/redact/text',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('🚀 Testing Enhanced Multi-Model Redaction');
  console.log('Models: BERT + RoBERTa + DialoGPT + Regex\n');
  
  console.log('📥 Original Text:');
  console.log(`"${testData.text}"\n`);
  
  try {
    console.log('⏳ Sending request to redaction API...\n');
    
    const result = await makeRequest();
    
    console.log('✅ Redaction Complete!\n');
    
    console.log('📤 Redacted Text:');
    console.log(`"${result.masked}"\n`);
    
    console.log(`🔍 Detected Entities (${result.spans.length} total):`);
    result.spans.forEach((span, index) => {
      const originalText = testData.text.slice(span.start, span.end);
      const entityType = span.label || span.entity || 'UNKNOWN';
      console.log(`  ${index + 1}. [${entityType}] "${originalText}"`);
    });
    
    // Analysis
    const entityTypes = [...new Set(result.spans.map(s => s.label || s.entity))];
    const totalRedacted = result.spans.reduce((sum, span) => sum + (span.end - span.start), 0);
    const redactionPercentage = ((totalRedacted / testData.text.length) * 100).toFixed(1);
    
    console.log('\n📊 Analysis:');
    console.log(`   • Entity types found: ${entityTypes.join(', ')}`);
    console.log(`   • Characters redacted: ${totalRedacted}/${testData.text.length} (${redactionPercentage}%)`);
    console.log(`   • Models working: ${result.spans.length > 8 ? 'All 3 models + regex' : 'Partial detection'}`);
    
    console.log('\n🎯 Expected Improvements with Multi-Model Approach:');
    console.log('   ✓ BERT: Baseline entity detection');
    console.log('   ✓ RoBERTa: Better accuracy on names/organizations');
    console.log('   ✓ DialoGPT: Social media handles and conversational context');
    console.log('   ✓ Regex: Structured data (emails, phones, cards)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your server is running on http://localhost:3000');
    console.log('   2. Check that all NER models are loading properly');
    console.log('   3. Verify the /redact/text endpoint is working');
  }
}

console.log('🧪 Enhanced Redaction Test Case\n');
runTest();
