-- Migration: 002_rls_policies
-- SanadFlow Study Hub - Row-Level Security Policies
-- TDD v3.0 Section 3.1
-- Author: Backend Engineer Agent
-- Date: 2026-01-12

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yjs_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can view profiles of people in their workspaces
CREATE POLICY "Users can view workspace member profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
      AND wm2.user_id = user_profiles.id
    )
  );

-- ============================================================================
-- WORKSPACES POLICIES
-- ============================================================================

-- Users can view workspaces they belong to
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
    )
  );

-- Authenticated users can create workspaces
CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Workspace owners can update their workspaces
CREATE POLICY "Workspace owners can update their workspaces"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- Workspace owners can delete their workspaces
CREATE POLICY "Workspace owners can delete their workspaces"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- WORKSPACE MEMBERS POLICIES
-- ============================================================================

-- Users can view memberships of their workspaces
CREATE POLICY "Users can view workspace memberships"
  ON public.workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Workspace admins can add members
CREATE POLICY "Workspace admins can add members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.permission = 'admin'
    )
    OR 
    -- Workspace owner can always add members
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = workspace_members.workspace_id
      AND owner_id = auth.uid()
    )
  );

-- Workspace admins can update members
CREATE POLICY "Workspace admins can update members"
  ON public.workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.permission = 'admin'
    )
  );

-- Workspace admins can remove members (or members can leave)
CREATE POLICY "Workspace admins can remove members"
  ON public.workspace_members FOR DELETE
  USING (
    user_id = auth.uid() -- Can leave your own membership
    OR EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.permission = 'admin'
    )
  );

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

-- Users can view documents in workspaces they belong to (excluding deleted)
CREATE POLICY "Users can view workspace documents"
  ON public.documents FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = documents.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Users with edit/admin permission can create documents
CREATE POLICY "Editors can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = documents.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- Users with edit/admin permission can update documents
CREATE POLICY "Editors can update documents"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = documents.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- Document creators or admins can delete (soft delete)
CREATE POLICY "Creators or admins can delete documents"
  ON public.documents FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = documents.workspace_id
      AND user_id = auth.uid()
      AND permission = 'admin'
    )
  );

-- ============================================================================
-- HADITHS POLICIES
-- ============================================================================

-- Users can view hadiths in their workspaces
CREATE POLICY "Users can view workspace hadiths"
  ON public.hadiths FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = hadiths.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Users with edit permission can create hadiths
CREATE POLICY "Editors can create hadiths"
  ON public.hadiths FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = hadiths.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- Users with edit permission can update hadiths
CREATE POLICY "Editors can update hadiths"
  ON public.hadiths FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = hadiths.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- Hadith creators or admins can delete
CREATE POLICY "Creators or admins can delete hadiths"
  ON public.hadiths FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = hadiths.workspace_id
      AND user_id = auth.uid()
      AND permission = 'admin'
    )
  );

-- ============================================================================
-- NARRATORS POLICIES
-- ============================================================================

-- Users can view narrators in their workspaces
CREATE POLICY "Users can view workspace narrators"
  ON public.narrators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = narrators.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Users with edit permission can manage narrators
CREATE POLICY "Editors can manage narrators"
  ON public.narrators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = narrators.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- ============================================================================
-- DIAGRAMS POLICIES
-- ============================================================================

-- Users can view diagrams in their workspaces
CREATE POLICY "Users can view workspace diagrams"
  ON public.diagrams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = diagrams.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Users with edit permission can manage diagrams
CREATE POLICY "Editors can manage diagrams"
  ON public.diagrams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = diagrams.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- ============================================================================
-- YJS DOCUMENTS POLICIES
-- ============================================================================

-- Users can view Yjs state for their workspace documents
CREATE POLICY "Users can view yjs documents"
  ON public.yjs_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = yjs_documents.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Users with edit permission can update Yjs state
CREATE POLICY "Editors can manage yjs documents"
  ON public.yjs_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = yjs_documents.workspace_id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================

-- Users can view comments on documents in their workspaces
CREATE POLICY "Users can view document comments"
  ON public.comments FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_members wm ON d.workspace_id = wm.workspace_id
      WHERE d.id = comments.document_id
      AND wm.user_id = auth.uid()
    )
  );

-- Users can create comments on workspace documents
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_members wm ON d.workspace_id = wm.workspace_id
      WHERE d.id = comments.document_id
      AND wm.user_id = auth.uid()
    )
  );

-- Comment authors can update their comments
CREATE POLICY "Authors can update their comments"
  ON public.comments FOR UPDATE
  USING (author_id = auth.uid());

-- Comment authors or admins can delete comments
CREATE POLICY "Authors or admins can delete comments"
  ON public.comments FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_members wm ON d.workspace_id = wm.workspace_id
      WHERE d.id = comments.document_id
      AND wm.user_id = auth.uid()
      AND wm.permission = 'admin'
    )
  );

-- ============================================================================
-- DOCUMENT VERSIONS POLICIES
-- ============================================================================

-- Users can view versions of documents in their workspaces
CREATE POLICY "Users can view document versions"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_members wm ON d.workspace_id = wm.workspace_id
      WHERE d.id = document_versions.document_id
      AND wm.user_id = auth.uid()
    )
  );

-- Editors can create document versions
CREATE POLICY "Editors can create document versions"
  ON public.document_versions FOR INSERT
  WITH CHECK (
    changed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_members wm ON d.workspace_id = wm.workspace_id
      WHERE d.id = document_versions.document_id
      AND wm.user_id = auth.uid()
      AND wm.permission IN ('edit', 'admin')
    )
  );
