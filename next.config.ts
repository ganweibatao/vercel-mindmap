import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  experimental: {
    mdxRs: false,
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm, remarkMath, remarkBreaks],
    rehypePlugins: [rehypeKatex, rehypeHighlight],
  },
});

export default withMDX(nextConfig);
