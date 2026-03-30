import { Eye, Edit2, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WikiArticle } from '@/hooks/useWiki';

interface WikiArticleCardProps {
  article: WikiArticle;
  isManager: boolean;
  onSelect: (article: WikiArticle) => void;
  onEdit: (article: WikiArticle) => void;
}

export function WikiArticleCard({ article, isManager, onSelect, onEdit }: WikiArticleCardProps) {
  const formattedDate = new Date(article.updated_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="relative rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Pinned indicator */}
      {article.pinned && (
        <span className="absolute top-3 right-3 text-amber-500" title="Artículo fijado">
          <Pin className="h-4 w-4 fill-amber-500" />
        </span>
      )}

      {/* Header */}
      <div className="pr-6">
        <button
          onClick={() => onSelect(article)}
          className="text-left font-semibold text-base hover:text-primary transition-colors line-clamp-2"
        >
          {article.title}
        </button>
      </div>

      {/* Category + tags */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {article.category && (
          <Badge variant="secondary" className="text-xs">
            {article.category}
          </Badge>
        )}
        {(article.tags ?? []).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {article.view_count ?? 0}
          </span>
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          {!article.published && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
              Borrador
            </Badge>
          )}
          {article.published && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-400">
              Publicado
            </Badge>
          )}
          {isManager && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(article);
              }}
              title="Editar artículo"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
