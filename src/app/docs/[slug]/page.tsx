import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMarkdownContent } from '@/lib/markdown';
import Link from 'next/link';

export default async function DocPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const filename = `${slug}.md`;
  
  try {
    const { title, content } = getMarkdownContent(filename);

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="text-blue-600 hover:underline mb-8 inline-block">
          &larr; Quay lại trang chủ
        </Link>
        <article className="prose prose-slate lg:prose-xl dark:prose-invert">
          <h1>{title}</h1>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600">Không tìm thấy file</h1>
        <p>File {filename} không tồn tại hoặc có lỗi khi đọc.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }
}
