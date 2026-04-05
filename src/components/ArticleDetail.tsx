"use client";
import { Article } from "@/lib/types";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
  onPublish: (id: string) => void;
  publishing: boolean;
}

export function ArticleDetail({
  article,
  onClose,
  onPublish,
  publishing,
}: ArticleDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-navy-800 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-navy-800 border-b border-gray-700 p-6 flex items-start justify-between rounded-t-2xl">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {article.relevanceScore}/10
              </span>
              <span className="text-xs text-gray-400">{article.source}</span>
              {article.status === "published" && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  Published
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-100">
              {article.postTitle || article.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* AI Assessment */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              AI Assessment
            </h3>
            <p className="text-gray-400 text-sm">{article.relevanceReason}</p>
            <div className="flex gap-2 mt-3">
              {article.postTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Post Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Post Preview (what gets published to Discourse)
            </h3>
            <div className="bg-gray-900 rounded-lg p-5 border border-gray-700 prose prose-invert prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(article.postBody),
                }}
              />
            </div>
          </div>

          {/* Original Article */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Original Article
            </h3>
            <p className="text-gray-100 font-medium mb-1">{article.title}</p>
            <p className="text-gray-400 text-sm mb-3">{article.summary}</p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
            >
              Read full article &rarr;
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-navy-800 border-t border-gray-700 p-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Close
          </button>
          {article.status !== "published" ? (
            <button
              onClick={() => onPublish(article.id)}
              disabled={publishing}
              className="bg-badge-gold hover:bg-badge-gold/80 text-navy-900 font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {publishing ? "Publishing..." : "Publish to Discourse"}
            </button>
          ) : (
            article.discourseUrl && (
              <a
                href={article.discourseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
              >
                View on Discourse &rarr;
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Simple markdown to HTML (handles bold, bullets, links, line breaks)
function formatMarkdown(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300">$1</a>')
    .replace(/^- (.*)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul class='list-disc pl-5 space-y-1'>$1</ul>")
    .replace(/\n\n/g, "</p><p class='mb-3'>")
    .replace(/\n/g, "<br/>");
}
