import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { WikiArticle, NewWikiArticle } from '@/hooks/useWiki';

// Minimal markdown renderer — no external dependencies
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

interface WikiArticleEditorProps {
  article?: WikiArticle | null;
  onSaveDraft: (data: NewWikiArticle) => Promise<void>;
  onPublish: (data: NewWikiArticle) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function WikiArticleEditor({
  article,
  onSaveDraft,
  onPublish,
  onCancel,
  saving = false,
}: WikiArticleEditorProps) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [category, setCategory] = useState(article?.category ?? '');
  const [tagsRaw, setTagsRaw] = useState((article?.tags ?? []).join(', '));
  const [content, setContent] = useState(article?.content ?? '');
  const [pinned, setPinned] = useState(article?.pinned ?? false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setCategory(article.category ?? '');
      setTagsRaw((article.tags ?? []).join(', '));
      setContent(article.content ?? '');
      setPinned(article.pinned ?? false);
    }
  }, [article?.id]);

  function buildSlug(t: string): string {
    return t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
  }

  function collectData(): NewWikiArticle {
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      title: title.trim(),
      slug: article?.slug ?? buildSlug(title.trim()),
      content,
      category: category.trim() || undefined,
      tags,
      pinned,
    };
  }

  const isValid = title.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="wiki-title">Título *</Label>
        <Input
          id="wiki-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre del artículo"
          className="text-base"
        />
      </div>

      {/* Category + Tags row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wiki-category">Categoría</Label>
          <Input
            id="wiki-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Procedimientos"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wiki-tags">Tags (separados por coma)</Label>
          <Input
            id="wiki-tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="Ej: incorporación, turnos"
          />
        </div>
      </div>

      {/* Pinned */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="wiki-pinned"
          checked={pinned}
          onCheckedChange={(v) => setPinned(!!v)}
        />
        <Label htmlFor="wiki-pinned" className="cursor-pointer">
          Fijar artículo arriba en la lista
        </Label>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="wiki-content">Contenido (Markdown)</Label>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="text-xs text-primary underline hover:no-underline"
          >
            {preview ? 'Editar' : 'Vista previa'}
          </button>
        </div>

        {preview ? (
          <div
            className="min-h-[280px] rounded-md border bg-background p-4 prose prose-sm max-w-none overflow-auto text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <textarea
            id="wiki-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`# Título principal\n\n## Sección\n\nContenido del artículo...`}
            rows={14}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}

        <p className="text-xs text-muted-foreground">
          Soporta Markdown: **negrita**, *cursiva*, # titulares, - listas, `código`, [enlace](url)
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => onSaveDraft(collectData())}
          disabled={!isValid || saving}
        >
          Guardar borrador
        </Button>
        <Button
          onClick={() => onPublish({ ...collectData(), published: true })}
          disabled={!isValid || saving}
        >
          Publicar
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
