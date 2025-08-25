'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';

import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle,
  FileText,
  List
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { notesApi, Note, SimpleTask } from '@/services/notesApi';

const getProgressColor = (progress: number) => {
  if (progress === 0) return 'bg-gray-200';
  if (progress < 34) return 'bg-red-500';
  if (progress < 67) return 'bg-orange-500';
  if (progress < 100) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getProgressCardClass = (progress: number) => {
  if (progress === 0) return 'card-progress-gray';
  if (progress < 34) return 'card-progress-red';
  if (progress < 67) return 'card-progress-orange';
  if (progress < 100) return 'card-progress-yellow';
  return 'card-progress-green';
};

export default function TasksPage() {
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState<{ [noteId: string]: string }>({});
  
  const queryClient = useQueryClient();

  // Fetch notes with tasks
  const { data: notes = [], isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.getNotes(),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 1000, // Consider data stale after 1 second
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when reconnecting
    gcTime: 300000, // Cache data for 5 minutes
    retry: 1, // Retry once on error
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (noteData: { title: string; content?: string }) => 
      notesApi.createNote(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsCreateNoteModalOpen(false);
      toast.dismiss(); // Clear any existing toasts
      toast.success('Jegyzet sikeresen létrehozva!');
    },
    onError: (error) => {
      toast.dismiss(); // Clear any existing toasts
      toast.error('Hiba történt a jegyzet létrehozásakor');
      console.error('Create note error:', error);
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) =>
      notesApi.updateNote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditingNote(null);
      toast.dismiss(); // Clear any existing toasts
      toast.success('Jegyzet sikeresen frissítve!');
    },
    onError: (error) => {
      toast.dismiss(); // Clear any existing toasts
      toast.error('Hiba történt a jegyzet frissítésekor');
      console.error('Update note error:', error);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.dismiss(); // Clear any existing toasts
      toast.success('Jegyzet sikeresen törölve!');
    },
    onError: (error) => {
      toast.dismiss(); // Clear any existing toasts
      toast.error('Hiba történt a jegyzet törlésekor');
      console.error('Delete note error:', error);
    },
  });

  // Create simple task mutation
  const createSimpleTaskMutation = useMutation({
    mutationFn: (taskData: Omit<SimpleTask, 'id' | 'created_at' | 'updated_at'>) =>
      notesApi.createSimpleTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.dismiss(); // Clear any existing toasts
      toast.success('Feladat hozzáadva!');
    },
    onError: (error) => {
      toast.dismiss(); // Clear any existing toasts
      toast.error('Hiba történt a feladat hozzáadásakor');
      console.error('Create simple task error:', error);
    },
  });

  // Toggle simple task mutation
  const toggleSimpleTaskMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      notesApi.toggleSimpleTask(id, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error) => {
      toast.dismiss(); // Clear any existing toasts
      toast.error('Hiba történt a feladat állapotának módosításakor');
      console.error('Toggle simple task error:', error);
    },
  });

  // Delete simple task mutation
  const deleteSimpleTaskMutation = useMutation({
    mutationFn: (taskId: string) => notesApi.deleteSimpleTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.dismiss(); // Clear any existing toasts
      toast.success('Feladat törölve!');
    },
    onError: (error) => {
      toast.dismiss(); // Clear any existing toasts
      toast.error('Hiba történt a feladat törlésekor');
      console.error('Delete simple task error:', error);
    },
  });

  const calculateNoteProgress = (note: Note) => {
    if (note.tasks.length === 0) return 0;
    const completedTasks = note.tasks.filter(task => task.is_completed).length;
    return Math.round((completedTasks / note.tasks.length) * 100);
  };

  const handleCreateNote = (noteData: { title: string; content?: string }) => {
    createNoteMutation.mutate(noteData);
  };

  const handleUpdateNote = (noteData: { title: string; content?: string }) => {
    if (!editingNote) return;
    updateNoteMutation.mutate({ id: editingNote.id, updates: noteData });
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a jegyzetet?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    toggleSimpleTaskMutation.mutate({ id: taskId, isCompleted });
  };

  const handleAddTask = (noteId: string) => {
    const taskTitle = newTaskInputs[noteId]?.trim();
    if (!taskTitle) return;

    createSimpleTaskMutation.mutate({
      title: taskTitle,
      is_completed: false,
      note_id: noteId
    });

    setNewTaskInputs(prev => ({ ...prev, [noteId]: '' }));
  };

  const handleDeleteTask = (taskId: string) => {
    deleteSimpleTaskMutation.mutate(taskId);
  };

  if (notesLoading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto inline-block"></span>
          <p className="mt-2 text-gray-600">Jegyzetek betöltése...</p>
        </div>
      </MainLayout>
    );
  }

  if (notesError) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <div className="max-w-md mx-auto">
            <div className="text-red-600 mb-4">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Hiba történt az adatok betöltésekor</p>
              <p className="text-sm text-gray-600 mt-1">
                A notes táblák nincsenek létrehozva az adatbázisban
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['notes'] });
                }}
              >
                Újrapróbálkozás
              </Button>
              <div className="text-xs text-gray-500">
                <p>Jelentkezz be a Supabase-be és futtasd le a <code>setup-notes-tables.sql</code> fájl tartalmát</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notesError) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Hiba történt az adatok betöltésekor</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['notes'] })}
          >
            Újrapróbálkozás
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jegyzetek és Feladatok</h1>
            <p className="text-sm text-gray-600">Egyszerű jegyzetek és feladatok kezelése</p>
          </div>
          <Button onClick={() => setIsCreateNoteModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Új Jegyzet
          </Button>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full ${getProgressCardClass(calculateNoteProgress(note))}`}>
                <div className="space-y-4">
                  {/* Note Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{note.title}</h3>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div>
                    <p className="text-sm text-gray-600">
                      {note.content || 'Nincs leírás'}
                    </p>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Haladás</span>
                      <span className="font-semibold">
                        ({note.tasks.filter(task => task.is_completed).length}/{note.tasks.length}) {calculateNoteProgress(note)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <span
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(calculateNoteProgress(note))} block`}
                        style={{ width: `${calculateNoteProgress(note)}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <List className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Feladatok</span>
                    </div>
                    
                    <div className="space-y-1">
                      {note.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between group">
                          <div className="flex items-center space-x-2 flex-1">
                            <button
                              onClick={() => handleToggleTask(task.id, !task.is_completed)}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                            >
                              {task.is_completed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                            <span className={`text-sm ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                              {task.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Task */}
                    <div className="pt-2">
                      <div className="flex space-x-2">
                        <Input
                          value={newTaskInputs[note.id] || ''}
                          onChange={(value) => setNewTaskInputs(prev => ({ ...prev, [note.id]: value }))}
                          placeholder="Új feladat..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTask(note.id);
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddTask(note.id)}
                          disabled={!newTaskInputs[note.id]?.trim()}
                          className="flex-shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Create Note Modal */}
        <Modal
          isOpen={isCreateNoteModalOpen}
          onClose={() => setIsCreateNoteModalOpen(false)}
          title="Új Jegyzet"
        >
          <CreateNoteForm
            onSubmit={handleCreateNote}
            onCancel={() => setIsCreateNoteModalOpen(false)}
          />
        </Modal>

        {/* Edit Note Modal */}
        <Modal
          isOpen={!!editingNote}
          onClose={() => setEditingNote(null)}
          title="Jegyzet Szerkesztése"
        >
          {editingNote && (
            <CreateNoteForm
              initialData={{ title: editingNote.title, content: editingNote.content || '' }}
              onSubmit={handleUpdateNote}
              onCancel={() => setEditingNote(null)}
            />
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}

interface CreateNoteFormProps {
  initialData?: { title: string; content: string };
  onSubmit: (data: { title: string; content?: string }) => void;
  onCancel: () => void;
}

function CreateNoteForm({ initialData, onSubmit, onCancel }: CreateNoteFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({ title: title.trim(), content: content.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cím *
        </label>
        <Input
          value={title}
          onChange={setTitle}
          placeholder="Jegyzet címe..."
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Leírás (opcionális)
        </label>
        <Textarea
          value={content}
          onChange={setContent}
          placeholder="Jegyzet leírása..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Mégse
        </Button>
        <Button type="submit">
          {initialData ? 'Frissítés' : 'Létrehozás'}
        </Button>
      </div>
    </form>
  );
}
