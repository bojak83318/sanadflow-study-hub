-- Migration: 004_fix_rls_recursion
-- SanadFlow Study Hub - Fix infinite recursion in workspace_members RLS
-- Author: DevOps Engineer Agent
-- Date: 2026-01-12
-- Issue: workspace_members SELECT policy referenced itself causing infinite recursion

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view workspace memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspace member profiles" ON public.user_profiles;

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER bypasses RLS to prevent recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = ws_id AND user_id = user_uuid
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_workspace_admin(ws_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = user_uuid 
      AND permission = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_workspace_owner(ws_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces 
    WHERE id = ws_id AND owner_id = user_uuid
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- RECREATE WORKSPACE_MEMBERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view workspace memberships"
  ON public.workspace_members FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace admins can add members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    is_workspace_admin(workspace_id, auth.uid())
    OR is_workspace_owner(workspace_id, auth.uid())
  );

CREATE POLICY "Workspace admins can update members"
  ON public.workspace_members FOR UPDATE
  USING (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Workspace admins can remove members"
  ON public.workspace_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR is_workspace_admin(workspace_id, auth.uid())
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION is_workspace_member TO authenticated;
GRANT EXECUTE ON FUNCTION is_workspace_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_workspace_owner TO authenticated;
