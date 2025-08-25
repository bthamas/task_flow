import { createClient } from '@/utils/supabase/client';
import { Task } from '@/types';

// Helper function to convert database format to frontend format
const mapTaskFromDB = (dbTask: any, projectId?: string): Task => {
  return {
    id: dbTask.id,
    project_id: projectId || dbTask.project_id || '',
    title: dbTask.title,
    description: dbTask.description,
    is_completed: dbTask.is_completed,
    order_index: dbTask.order_index || 0,
    priority: dbTask.priority || 'medium',
    due_date: dbTask.due_date,
    created_at: dbTask.created_at,
    updated_at: dbTask.updated_at,
    project: undefined, // No project relationship
  };
};

// Helper function to convert frontend format to database format
const mapTaskToDB = (task: Partial<Task>): any => ({
  title: task.title,
  description: task.description,
  is_completed: task.is_completed,
  priority: task.priority,
  due_date: task.due_date,
  project_id: task.project_id,
  order_index: task.order_index,
});

export const tasksApi = {
  async getTasks(projectId?: string): Promise<Task[]> {
    const supabase = createClient();
    if (!supabase) {
      console.warn('Supabase client not available during build');
      return [];
    }

    if (!projectId) {
      // If no projectId, return all tasks for dashboard
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      return tasks.map(task => mapTaskFromDB(task));
    }
    
    // Get tasks from the tasks table for the specific project
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    
    return tasks.map(task => mapTaskFromDB(task, projectId));
  },

  async getTask(id: string): Promise<Task> {
    const supabase = createClient();
    if (!supabase) {
      console.warn('Supabase client not available during build');
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return mapTaskFromDB(data);
  },

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>, projectId?: string): Promise<Task> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    if (!projectId) {
      throw new Error('Project ID is required for creating tasks');
    }
    
    // Get the next order_index for this project
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1);
    
    const nextOrderIndex = existingTasks && existingTasks.length > 0 
      ? (existingTasks[0].order_index || 0) + 1 
      : 0;
    
    const dbTask = {
      ...mapTaskToDB(task),
      project_id: projectId,
      order_index: nextOrderIndex,
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(dbTask)
      .select('*')
      .single();

    if (error) throw error;
    
    return mapTaskFromDB(data, projectId);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const dbUpdates = mapTaskToDB(updates);
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return mapTaskFromDB(data);
  },

  async deleteTask(id: string): Promise<void> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async reorderTasks(tasks: Task[]): Promise<void> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Update order_index for each task
    const updates = tasks.map((task, index) => ({
      id: task.id,
      order_index: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('tasks')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (error) {
        console.error('Error updating task order:', error);
        throw error;
      }
    }
  },

  async toggleTaskComplete(id: string, isCompleted: boolean): Promise<Task> {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        is_completed: isCompleted,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return mapTaskFromDB(data);
  }
};
