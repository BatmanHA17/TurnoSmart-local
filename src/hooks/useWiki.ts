import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface WikiArticle {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  tags: string[];
  published: boolean;
  pinned: boolean;
  author_id: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface NewWikiArticle {
  title: string;
  slug: string;
  content: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  pinned?: boolean;
}

interface UseWikiFilters {
  category?: string;
  published?: boolean;
  search?: string;
}

function buildSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export function useWiki(orgId: string | null, filters?: UseWikiFilters) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    if (!orgId) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('wiki_articles')
        .select('*')
        .eq('org_id', orgId)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (filters?.published !== undefined) {
        query = query.eq('published', filters.published);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result: WikiArticle[] = (data ?? []) as WikiArticle[];

      // Client-side search filter
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        result = result.filter(
          (a) =>
            a.title.toLowerCase().includes(term) ||
            (a.content ?? '').toLowerCase().includes(term) ||
            (a.category ?? '').toLowerCase().includes(term) ||
            (a.tags ?? []).some((t) => t.toLowerCase().includes(term))
        );
      }

      setArticles(result);
    } catch (err) {
      console.error('useWiki fetchArticles error:', err);
      toast({ title: 'Error', description: 'No se pudieron cargar los artículos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [orgId, filters?.category, filters?.published, filters?.search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = useCallback(
    async (data: NewWikiArticle): Promise<WikiArticle> => {
      if (!orgId || !user) throw new Error('No org or user');

      const slug = data.slug || buildSlug(data.title);
      const payload = {
        org_id: orgId,
        author_id: user.id,
        title: data.title,
        slug,
        content: data.content ?? '',
        category: data.category ?? null,
        tags: data.tags ?? [],
        published: data.published ?? false,
        pinned: data.pinned ?? false,
      };

      const { data: created, error } = await supabase
        .from('wiki_articles')
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast({ title: 'Error', description: 'No se pudo crear el artículo.', variant: 'destructive' });
        throw error;
      }

      await fetchArticles();
      toast({ title: 'Artículo creado', description: data.published ? 'Publicado correctamente.' : 'Guardado como borrador.' });
      return created as WikiArticle;
    },
    [orgId, user, fetchArticles]
  );

  const updateArticle = useCallback(
    async (id: string, data: Partial<WikiArticle>): Promise<void> => {
      const { error } = await supabase
        .from('wiki_articles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        toast({ title: 'Error', description: 'No se pudo actualizar el artículo.', variant: 'destructive' });
        throw error;
      }

      await fetchArticles();
      toast({ title: 'Artículo actualizado' });
    },
    [fetchArticles]
  );

  const deleteArticle = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
      if (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar el artículo.', variant: 'destructive' });
        throw error;
      }
      await fetchArticles();
      toast({ title: 'Artículo eliminado' });
    },
    [fetchArticles]
  );

  const publishArticle = useCallback(
    async (id: string): Promise<void> => {
      await updateArticle(id, { published: true });
    },
    [updateArticle]
  );

  const unpublishArticle = useCallback(
    async (id: string): Promise<void> => {
      await updateArticle(id, { published: false });
    },
    [updateArticle]
  );

  const incrementViewCount = useCallback(
    async (id: string): Promise<void> => {
      // Use rpc if available, otherwise do a manual increment
      const article = articles.find((a) => a.id === id);
      if (!article) return;
      await supabase
        .from('wiki_articles')
        .update({ view_count: (article.view_count ?? 0) + 1 })
        .eq('id', id);
    },
    [articles]
  );

  return {
    articles,
    loading,
    createArticle,
    updateArticle,
    deleteArticle,
    publishArticle,
    unpublishArticle,
    incrementViewCount,
    refresh: fetchArticles,
  };
}
