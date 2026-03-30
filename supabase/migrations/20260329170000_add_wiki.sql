-- Sprint 4.2: Wiki / Knowledge Base
CREATE TABLE IF NOT EXISTS wiki_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES auth.users(id),
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wiki_org ON wiki_articles(org_id, published, pinned, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_category ON wiki_articles(org_id, category);

ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;

-- Everyone in org can read published articles; managers can read all
CREATE POLICY "org_members_read_wiki" ON wiki_articles FOR SELECT
  USING (is_super_admin() OR (
    published = true AND
    org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid() AND m.status = 'active')
  ) OR
  org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('OWNER','ADMIN'))
  );

-- Only managers/admins can create/edit/delete
CREATE POLICY "managers_manage_wiki" ON wiki_articles FOR ALL
  USING (is_super_admin() OR
    org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('OWNER','ADMIN'))
  );
