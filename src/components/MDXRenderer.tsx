'use client';

import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkEmoji from 'remark-emoji';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/vs2015.css';
import '../styles/mdx.css';

interface MDXRendererProps {
  content: string;
  className?: string;
}

interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  href?: string;
  [key: string]: unknown;
}

// 自定义组件映射
const components = {
  // 代码块增强
  code: ({ children, className, ...props }: ComponentProps) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code 
          className="inline-code" 
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#e6e6e6',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '0.9em',
            fontFamily: 'Consolas, Monaco, Courier New, monospace'
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  
  // 表格增强
  table: ({ children, ...props }: ComponentProps) => (
    <div style={{ overflowX: 'auto', margin: '1em 0' }}>
      <table 
        style={{ 
          borderCollapse: 'collapse', 
          width: '100%',
          border: '1px solid #ddd'
        }} 
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  
  th: ({ children, ...props }: ComponentProps) => (
    <th 
      style={{ 
        border: '1px solid #ddd', 
        padding: '8px 12px', 
        background: '#f5f5f5',
        fontWeight: 'bold',
        textAlign: 'left'
      }} 
      {...props}
    >
      {children}
    </th>
  ),
  
  td: ({ children, ...props }: ComponentProps) => (
    <td 
      style={{ 
        border: '1px solid #ddd', 
        padding: '8px 12px' 
      }} 
      {...props}
    >
      {children}
    </td>
  ),

  // 引用块增强
  blockquote: ({ children, ...props }: ComponentProps) => (
    <blockquote 
      style={{ 
        borderLeft: '4px solid #ddd', 
        margin: '1em 0', 
        paddingLeft: '1em',
        background: '#f9f9f9',
        padding: '0.5em 1em',
        fontStyle: 'italic'
      }} 
      {...props}
    >
      {children}
    </blockquote>
  ),

  // 链接增强
  a: ({ children, href, ...props }: ComponentProps) => (
    <a 
      href={href}
      style={{ color: '#0066cc', textDecoration: 'underline' }}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  ),

  // 列表增强
  ul: ({ children, ...props }: ComponentProps) => (
    <ul style={{ paddingLeft: '1.5em', margin: '0.5em 0' }} {...props}>
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }: ComponentProps) => (
    <ol style={{ paddingLeft: '1.5em', margin: '0.5em 0' }} {...props}>
      {children}
    </ol>
  ),

  // 标题增强
  h1: ({ children, ...props }: ComponentProps) => (
    <h1 style={{ fontSize: '1.8em', fontWeight: 'bold', margin: '1em 0 0.5em 0' }} {...props}>
      {children}
    </h1>
  ),
  
  h2: ({ children, ...props }: ComponentProps) => (
    <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '1em 0 0.5em 0' }} {...props}>
      {children}
    </h2>
  ),
  
  h3: ({ children, ...props }: ComponentProps) => (
    <h3 style={{ fontSize: '1.3em', fontWeight: 'bold', margin: '1em 0 0.5em 0' }} {...props}>
      {children}
    </h3>
  ),
};

const MDXRenderer: React.FC<MDXRendererProps> = ({ content, className = '' }) => {
  if (!content) {
    return <div className="no-content">无内容</div>;
  }

  return (
    <MDXProvider components={components}>
      <div className={`mdx-content prose prose-sm max-w-none ${className}`} style={{ textAlign: 'left' }}>
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm, 
            remarkMath, 
            remarkBreaks,
            remarkEmoji
          ]}
          rehypePlugins={[
            rehypeKatex, 
            rehypeHighlight
          ]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MDXProvider>
  );
};

export default MDXRenderer; 