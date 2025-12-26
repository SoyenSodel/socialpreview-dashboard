import DOMPurify, { type Config } from 'dompurify';

export const sanitizeHtml = (
  html: string,
  options?: Config
): string => {

  const defaultConfig: Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,

    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  };

  const config = { ...defaultConfig, ...options };

  const clean = DOMPurify.sanitize(html, config);

  return String(clean);
};

export const sanitizeText = (text: string): string => {
  return String(DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }));
};

export const sanitizeRichContent = (html: string): string => {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre', 'span', 'div',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title'],
  });
};

export const configureDOMPurify = (): void => {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {

    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
};
