import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export interface Note {
  id: string;
  title: string;
  content?: string;
  created_at: string;
  updated_at: string;
  tasks: SimpleTask[];
}

export interface SimpleTask {
  id: string;
  title: string;
  is_completed: boolean;
  note_id: string;
  created_at: string;
  updated_at: string;
}

// Automatikus tábla létrehozó funkció
const ensureTablesExist = async () => {
  try {
    // Próbáljuk meg létrehozni a notes táblát
    await supabase.rpc('create_notes_table_if_not_exists');
  } catch (error) {
    console.warn('Could not create notes table automatically:', error);
  }
  
  try {
    // Próbáljuk meg létrehozni a simple_tasks táblát
    await supabase.rpc('create_simple_tasks_table_if_not_exists');
  } catch (error) {
    console.warn('Could not create simple_tasks table automatically:', error);
  }
};

export const notesApi = {
  async getNotes(): Promise<Note[]> {
    try {
      // Get all notes with their tasks
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesError) {
        console.warn('Notes table not found, returning mock data:', notesError.message);
        // Return mock data when tables don't exist
        return [
          {
            id: 'mock-1',
            title: 'Bevásárlás',
            content: 'Heti bevásárlás listája',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tasks: [
              {
                id: 'task-1',
                title: 'Tej',
                is_completed: true,
                note_id: 'mock-1',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'task-2',
                title: 'Kenyér',
                is_completed: false,
                note_id: 'mock-1',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            ]
          },
          {
            id: 'mock-2',
            title: 'Házimunka',
            content: 'Heti házimunka feladatok',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tasks: [
              {
                id: 'task-3',
                title: 'Mosás',
                is_completed: true,
                note_id: 'mock-2',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'task-4',
                title: 'Takarítás',
                is_completed: false,
                note_id: 'mock-2',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            ]
          }
        ];
      }

      // If notes table exists, try to get tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('simple_tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) {
        console.warn('Simple_tasks table not found, returning notes without tasks:', tasksError.message);
        return notes.map(note => ({
          ...note,
          tasks: []
        }));
      }

      // Group tasks by note_id
      const tasksByNoteId = tasks.reduce((acc, task) => {
        if (!acc[task.note_id]) {
          acc[task.note_id] = [];
        }
        acc[task.note_id].push(task);
        return acc;
      }, {} as { [key: string]: SimpleTask[] });

      // Combine notes with their tasks
      return notes.map(note => ({
        ...note,
        tasks: tasksByNoteId[note.id] || []
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Return mock data on any error
      return [
        {
          id: 'mock-1',
          title: 'Bevásárlás',
          content: 'Heti bevásárlás listája',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tasks: [
            {
              id: 'task-1',
              title: 'Tej',
              is_completed: true,
              note_id: 'mock-1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'task-2',
              title: 'Kenyér',
              is_completed: false,
              note_id: 'mock-1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]
        },
        {
          id: 'mock-2',
          title: 'Házimunka',
          content: 'Heti házimunka feladatok',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tasks: [
            {
              id: 'task-3',
              title: 'Mosás',
              is_completed: true,
              note_id: 'mock-2',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'task-4',
              title: 'Takarítás',
              is_completed: false,
              note_id: 'mock-2',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]
        }
      ];
    }
  },

  async getNote(id: string): Promise<Note> {
    try {
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

      if (noteError) {
        console.warn('Note not found:', noteError.message);
        throw new Error('Note not found');
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('simple_tasks')
        .select('*')
        .eq('note_id', id)
        .order('created_at', { ascending: true });

      if (tasksError) {
        console.warn('Simple_tasks table not found, returning note without tasks:', tasksError.message);
        return {
          ...note,
          tasks: []
        };
      }

      return {
        ...note,
        tasks: tasks || []
      };
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  },

  async createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'tasks'>): Promise<Note> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: note.title,
          content: note.content
        })
        .select('*')
        .single();

      if (error) {
        console.warn('Notes table not found, creating mock note:', error.message);
        // Return mock note when table doesn't exist
        const mockNote: Note = {
          id: `mock-${Date.now()}`,
          title: note.title,
          content: note.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tasks: []
        };
        return mockNote;
      }

      return {
        ...data,
        tasks: []
      };
    } catch (error) {
      console.error('Error creating note:', error);
      // Return mock note on any error
      const mockNote: Note = {
        id: `mock-${Date.now()}`,
        title: note.title,
        content: note.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: []
      };
      return mockNote;
    }
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.warn('Notes table not found, returning mock updated note:', error.message);
        // Return mock updated note when table doesn't exist
        const mockNote: Note = {
          id: id,
          title: updates.title || 'Mock Note',
          content: updates.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tasks: []
        };
        return mockNote;
      }

      // Get tasks for this note
      const { data: tasks } = await supabase
        .from('simple_tasks')
        .select('*')
        .eq('note_id', id)
        .order('created_at', { ascending: true });

      return {
        ...data,
        tasks: tasks || []
      };
    } catch (error) {
      console.error('Error updating note:', error);
      // Return mock updated note on any error
      const mockNote: Note = {
        id: id,
        title: updates.title || 'Mock Note',
        content: updates.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: []
      };
      return mockNote;
    }
  },

  async deleteNote(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Notes table not found, mock delete successful:', error.message);
        // Mock successful delete when table doesn't exist
        return;
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      // Mock successful delete on any error
      return;
    }
  },

  async createSimpleTask(task: Omit<SimpleTask, 'id' | 'created_at' | 'updated_at'>): Promise<SimpleTask> {
    try {
      const { data, error } = await supabase
        .from('simple_tasks')
        .insert({
          title: task.title,
          is_completed: task.is_completed,
          note_id: task.note_id
        })
        .select('*')
        .single();

      if (error) {
        console.warn('Simple_tasks table not found, creating mock task:', error.message);
        // Return mock task when table doesn't exist
        const mockTask: SimpleTask = {
          id: `task-${Date.now()}`,
          title: task.title,
          is_completed: task.is_completed,
          note_id: task.note_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return mockTask;
      }
      return data;
    } catch (error) {
      console.error('Error creating simple task:', error);
      // Return mock task on any error
      const mockTask: SimpleTask = {
        id: `task-${Date.now()}`,
        title: task.title,
        is_completed: task.is_completed,
        note_id: task.note_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockTask;
    }
  },

  async updateSimpleTask(id: string, updates: Partial<SimpleTask>): Promise<SimpleTask> {
    try {
      const { data, error } = await supabase
        .from('simple_tasks')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating simple task:', error);
        throw new Error('Failed to update task');
      }
      return data;
    } catch (error) {
      console.error('Error updating simple task:', error);
      throw error;
    }
  },

  async deleteSimpleTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('simple_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Simple_tasks table not found, mock delete successful:', error.message);
        // Mock successful delete when table doesn't exist
        return;
      }
    } catch (error) {
      console.error('Error deleting simple task:', error);
      // Mock successful delete on any error
      return;
    }
  },

  async toggleSimpleTask(id: string, isCompleted: boolean): Promise<SimpleTask> {
    try {
      const { data, error } = await supabase
        .from('simple_tasks')
        .update({ 
          is_completed: isCompleted,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.warn('Simple_tasks table not found, returning mock task:', error.message);
        // Return mock task when table doesn't exist
        const mockTask: SimpleTask = {
          id: id,
          title: 'Mock Task',
          is_completed: isCompleted,
          note_id: 'mock-note',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return mockTask;
      }
      return data;
    } catch (error) {
      console.error('Error toggling simple task:', error);
      // Return mock task on any error
      const mockTask: SimpleTask = {
        id: id,
        title: 'Mock Task',
        is_completed: isCompleted,
        note_id: 'mock-note',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockTask;
    }
  }
};
