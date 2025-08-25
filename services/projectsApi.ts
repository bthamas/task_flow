import { createClient } from '@/utils/supabase/client';
import { Project, ProjectFilters } from '@/types';

export const projectsApi = {
  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const supabase = createClient();
    if (!supabase) {
      console.warn('Supabase client not available during build');
      return [];
    }

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('project_status', filters.status);
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data;
  },

  async getProject(id: string): Promise<Project> {
    const supabase = createClient();
    if (!supabase) {
      console.warn('Supabase client not available during build');
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'progress_percentage' | 'project_status'>): Promise<Project> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        client_id: project.client_id,
        title: project.title,
        description: project.description,
        end_date: project.end_date,
        priority: project.priority || 'medium',
        project_status: 'not_started',
        progress_percentage: 0,
        is_active: true
      })
      .select(`
        *,
        client:clients(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getProjectsByFilter(filter: 'today' | 'week' | 'overdue'): Promise<Project[]> {
    const supabase = createClient();
    if (!supabase) {
      console.warn('Supabase client not available during build');
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .order('due_date', { ascending: true });

    switch (filter) {
      case 'today':
        query = query.eq('due_date', today);
        break;
      case 'week':
        query = query.gte('due_date', today).lte('due_date', weekFromNow);
        break;
      case 'overdue':
        query = query.lt('due_date', today).neq('status', 'completed');
        break;
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
};
