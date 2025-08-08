
import DOMPurify from 'dompurify';

// Configure DOMPurify for safe HTML rendering
const sanitizerConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  REMOVE_DATA_ATTR: true,
  REMOVE_UNKNOWN_TAGS: true,
  USE_PROFILES: { html: true }
};

export const sanitizeHtmlContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(content, sanitizerConfig);
};

export const sanitizeTextContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // For plain text, we just escape HTML entities
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

export const formatMessageSafely = (content: string): string => {
  // First sanitize the content
  const sanitized = sanitizeHtmlContent(content);
  
  // Apply basic formatting
  return sanitized
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
};
