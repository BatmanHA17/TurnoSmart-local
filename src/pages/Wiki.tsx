import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Eye, Plus, Search } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WikiArticleCard } from '@/components/wiki/WikiArticleCard';
import { WikiArticleEditor } from '@/components/wiki/WikiArticleEditor';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useUserRoleCanonical } from '@/hooks/useUserRoleCanonical';
import { useWiki, type WikiArticle, type NewWikiArticle } from '@/hooks/useWiki';

// Minimal markdown renderer (same as editor)
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-sm font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline" target="_blank">$1</a>');
}

type ViewMode = 'list' | 'detail' | 'editor';

export default function Wiki() {
  const { org } = useCurrentOrganization();
  const { isManager } = useUserRoleCanonical();
  const orgId = org?.id ?? null;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);
  const [saving, setSaving] = useState(false);

  const { articles, loading, createArticle, updateArticle, publishArticle, incrementViewCount } =
    useWiki(orgId);

  useEffect(() => {
    document.title = 'Wiki – TurnoSmart';
  }, []);

  // Derive unique categories from loaded articles
  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set).sort();
  }, [articles]);

  // Filter articles for list view
  const visibleArticles = useMemo(() => {
    let result = articles;

    // Employees only see published articles; managers see all
    if (!isManager) {
      result = result.filter((a) => a.published);
    }

    if (categoryFilter) {
      result = result.filter((a) => a.category === categoryFilter);
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          (a.content ?? '').toLowerCase().includes(term) ||
          (a.category ?? '').toLowerCase().includes(term) ||
          (a.tags ?? []).some((t) => t.toLowerCase().includes(term))
      );
    }

    return result;
  }, [articles, isManager, categoryFilter, search]);

  const pinnedArticles = useMemo(() => visibleArticles.filter((a) => a.pinned), [visibleArticles]);
  const unpinnedArticles = useMemo(() => visibleArticles.filter((a) => !a.pinned), [visibleArticles]);

  function handleSelectArticle(article: WikiArticle) {
    setSelectedArticle(article);
    setViewMode('detail');
    incrementViewCount(article.id);
  }

  function handleEditArticle(article: WikiArticle) {
    setEditingArticle(article);
    setViewMode('editor');
  }

  function handleNewArticle() {
    setEditingArticle(null);
    setViewMode('editor');
  }

  function handleBack() {
    setViewMode('list');
    setSelectedArticle(null);
    setEditingArticle(null);
  }

  async function handleSaveDraft(data: NewWikiArticle) {
    setSaving(true);
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, { ...data, published: false });
      } else {
        await createArticle({ ...data, published: false });
      }
      handleBack();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(data: NewWikiArticle) {
    setSaving(true);
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, { ...data, published: true });
      } else {
        await createArticle({ ...data, published: true });
      }
      handleBack();
    } finally {
      setSaving(false);
    }
  }

  // Refresh selected article from articles list when returning to detail
  useEffect(() => {
    if (viewMode === 'detail' && selectedArticle) {
      const updated = articles.find((a) => a.id === selectedArticle.id);
      if (updated) setSelectedArticle(updated);
    }
  }, [articles]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ─── EDITOR VIEW ─── */}
        {viewMode === 'editor' && (
          <>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <h1 className="text-xl font-bold">
                {editingArticle ? 'Editar artículo' : 'Nuevo artículo'}
              </h1>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <WikiArticleEditor
                article={editingArticle}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
                onCancel={handleBack}
                saving={saving}
              />
            </div>
          </>
        )}

        {/* ─── DETAIL VIEW ─── */}
        {viewMode === 'detail' && selectedArticle && (
          <>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Volver a la wiki
              </Button>
              {isManager && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditArticle(selectedArticle)}
                  className="gap-1.5"
                >
                  Editar
                </Button>
              )}
            </div>

            <article className="rounded-xl border bg-card p-6 space-y-4">
              {/* Article header */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{selectedArticle.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {selectedArticle.category && (
                    <Badge variant="secondary">{selectedArticle.category}</Badge>
                  )}
                  {(selectedArticle.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {selectedArticle.view_count ?? 0} vistas
                  </span>
                  <span>
                    Actualizado{' '}
                    {new Date(selectedArticle.updated_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {!selectedArticle.published && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                      Borrador
                    </Badge>
                  )}
                </div>
              </div>

              {/* Article content */}
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.content ?? '') }}
              />
            </article>
          </>
        )}

        {/* ─── LIST VIEW ─── */}
        {viewMode === 'list' && (
          <>
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Wiki</h1>
                <p className="text-sm text-muted-foreground">Base de conocimiento interna</p>
              </div>
              {isManager && (
                <Button onClick={handleNewArticle} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Nuevo artículo
                </Button>
              )}
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar artículos..."
                className="pl-9"
              />
            </div>

            {/* Category filter tabs */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    categoryFilter === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      categoryFilter === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : visibleArticles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium mb-1">Sin artículos</p>
                <p className="text-sm">
                  {isManager
                    ? 'Crea el primer artículo con el botón de arriba.'
                    : 'No hay artículos publicados todavía.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pinned section */}
                {pinnedArticles.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Fijados
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pinnedArticles.map((article) => (
                        <WikiArticleCard
                          key={article.id}
                          article={article}
                          isManager={isManager}
                          onSelect={handleSelectArticle}
                          onEdit={handleEditArticle}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Rest of articles */}
                {unpinnedArticles.length > 0 && (
                  <section>
                    {pinnedArticles.length > 0 && (
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Artículos
                      </h2>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {unpinnedArticles.map((article) => (
                        <WikiArticleCard
                          key={article.id}
                          article={article}
                          isManager={isManager}
                          onSelect={handleSelectArticle}
                          onEdit={handleEditArticle}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
