export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  project_status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  start_date?: string;
  end_date?: string;
  priority: 'low' | 'medium' | 'high';
  budget?: number;
  is_active: boolean;
  owner_id?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
  };
}

export type FilterType = 'all' | 'today' | 'week' | 'overdue' | 'completed' | 'in_progress' | 'not_started' | 'clients';



export interface ProjectFilters {
  status?: Project['project_status'];
  client_id?: string;
  end_date?: string;
  search?: string;
}

export interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  overdueProjects: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleTask {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}
