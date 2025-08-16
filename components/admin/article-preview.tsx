"use client"

import type { Article } from "@/lib/actions/admin-articles"
import RenderArticle from "@/components/info/render-article"

interface ArticlePreviewProps {
  article: Article
}

export function ArticlePreview({ article }: ArticlePreviewProps) {
  const formattedBlocks = article.blocks // Assuming formattedBlocks is derived from article.blocks

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
          {article.excerpt && <p className="text-lg text-gray-600 leading-relaxed">{article.excerpt}</p>}
          <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{article.category}</span>
            {article.is_published ? (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">公開中</span>
            ) : (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">下書き</span>
            )}
            {article.is_pinned && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">ピン留め</span>}
          </div>
        </div>

        <div className="prose prose-lg max-w-none">
          <RenderArticle blocks={formattedBlocks} />
        </div>
      </div>
    </div>
  )
}
