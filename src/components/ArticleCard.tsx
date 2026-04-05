"use client";
import { Article } from "@/lib/types";

interface ArticleCardProps {
  article: Article;
  onPublish: (id: string) => void;
  onDismiss: (id: string) => void;
  onSelect: (id: string) => void;
  publishing: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 9
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : score >= 7
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${color}`}>
      {score}/10
    </span>
  );
}

function StatusBadge({ status }: { status: Article["status"] }) {
  if (status === "published") {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
        Published
      </span>
    );
  }
  return null;
}

export function ArticleCard({
  article,
  onPublish,
  onDismiss,
  onSelect,
  publishing,
}: ArticleCardProps) {
  const age = Math.floor(
    (Date.now() - new Date(article.fetchedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className="bg-navy-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors cursor-pointer group"
      onClick={() => onSelect(article.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-100 group-hover:text-badge-gold transition-colors leading-tight">
          {article.postTitle || article.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge score={article.relevanceScore} />
          <StatusBadge status={article.status} />
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
        {article.relevanceReason}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-400">{article.source}</span>
          <span>{age === 0 ? "Today" : `${age}d ago`}</span>
          {article.postTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-gray-800 px-2 py-0.5 rounded text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {article.status !== "published" && (
            <>
              <button
                onClick={() => onDismiss(article.id)}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
              >
                Dismiss
              </button>
              <button
                onClick={() => onPublish(article.id)}
                disabled={publishing}
                className="text-xs bg-badge-gold/20 hover:bg-badge-gold/30 text-badge-gold font-medium px-3 py-1 rounded-lg transition-colors border border-badge-gold/30 disabled:opacity-50"
              >
                {publishing ? "..." : "Publish"}
              </button>
            </>
          )}
          {article.status === "published" && article.discourseUrl && (
            <a
              href={article.discourseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View on Discourse &rarr;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
