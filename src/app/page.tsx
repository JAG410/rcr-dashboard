"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { redirect } from "next/navigation";
import { Article } from "@/lib/types";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleDetail } from "@/components/ArticleDetail";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");

  const fetchArticles = useCallback(async () => {
    const res = await fetch("/api/articles");
    if (res.ok) {
      const data = await res.json();
      setArticles(data.articles || []);
      setLastRun(data.lastRun?.timestamp || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchArticles();
    if (status === "unauthenticated") redirect("/login");
  }, [status, fetchArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/articles", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setLastRun(data.run?.timestamp || lastRun);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const res = await fetch(`/api/articles/${id}/publish`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? data.article : a))
        );
      } else {
        const err = await res.json();
        alert(`Failed to publish: ${err.error}`);
      }
    } finally {
      setPublishingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading Roll Call Room...</div>
      </div>
    );
  }

  const filteredArticles =
    filter === "all"
      ? articles
      : articles.filter((a) => a.status === filter);

  const selectedArticle = articles.find((a) => a.id === selectedId);
  const pendingCount = articles.filter((a) => a.status === "pending").length;
  const publishedCount = articles.filter((a) => a.status === "published").length;

  return (
    <div className="min-h-screen">
      <Header
        onRefresh={handleRefresh}
        refreshing={refreshing}
        lastRun={lastRun}
        articleCount={articles.length}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-navy-800 rounded-lg p-1 w-fit border border-gray-700">
          {[
            { key: "all" as const, label: "All", count: articles.length },
            { key: "pending" as const, label: "Ready to Publish", count: pendingCount },
            { key: "published" as const, label: "Published", count: publishedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-sm px-4 py-2 rounded-md transition-colors ${
                filter === tab.key
                  ? "bg-gray-700 text-gray-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Articles grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">
              {articles.length === 0
                ? "No articles yet. Hit 'Fetch New Articles' to start."
                : "No articles match this filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onPublish={handlePublish}
                onDismiss={handleDismiss}
                onSelect={setSelectedId}
                publishing={publishingId === article.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selectedArticle && (
        <ArticleDetail
          article={selectedArticle}
          onClose={() => setSelectedId(null)}
          onPublish={handlePublish}
          publishing={publishingId === selectedArticle.id}
        />
      )}
    </div>
  );
}
