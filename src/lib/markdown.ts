import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd());

export function getMarkdownFiles() {
  const files = fs.readdirSync(contentDirectory);
  return files.filter(file => file.endsWith('.md'));
}

export function getMarkdownContent(filename: string) {
  const fullPath = path.join(contentDirectory, filename);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Parse metadata using gray-matter
  const { data, content } = matter(fileContents);

  return {
    filename,
    title: data.title || filename.replace('.md', ''),
    date: data.date || '',
    content,
  };
}
