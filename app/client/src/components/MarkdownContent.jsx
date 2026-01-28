import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function MarkdownContent({ content, className = '' }) {
    const html = useMemo(() => {
        if (!content) return '';
        const rawHtml = marked(content, { breaks: true });
        return DOMPurify.sanitize(rawHtml);
    }, [content]);

    return (
        <div
            className={`markdown-content prose prose-sm max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
