/**
 * 🧠 NLP Utils - Natural Language Processing
 * 
 * Utilitários para processamento de linguagem natural
 */

export { classifyIntent, detectMultipleIntents, addIntentPatterns } from './intentClassifier';
export { extractEntities, extractPeriodo, normalizeEntities, validateEntities } from './entityExtractor';
export { parseQuery, generateContextualResponse, enrichMessage } from './queryParser';

// Export default com todas as funções
import { classifyIntent, detectMultipleIntents, addIntentPatterns } from './intentClassifier';
import { extractEntities, extractPeriodo, normalizeEntities, validateEntities } from './entityExtractor';
import { parseQuery, generateContextualResponse, enrichMessage } from './queryParser';

export default {
  // Intent Classification
  classifyIntent,
  detectMultipleIntents,
  addIntentPatterns,
  
  // Entity Extraction
  extractEntities,
  extractPeriodo,
  normalizeEntities,
  validateEntities,
  
  // Query Parsing
  parseQuery,
  generateContextualResponse,
  enrichMessage
};
