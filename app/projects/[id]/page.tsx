'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskItem } from '@/components/tasks/TaskItem';
import { QuickTaskInput } from '@/components/tasks/QuickTaskInput';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  Edit,
  Trash2,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { projectsApi } from '@/services/projectsApi';
import { tasksApi } from '@/services/tasksApi';
import { Project, Task } from '@/types';
import toast from 'react-hot-toast';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Befejezett';
    case 'in_progress':
      return 'Folyamatban';
    default:
      return 'Létrehozva';
  }
};

const getProgressColor = (progress: number) => {
  if (progress === 0) return 'bg-gray-200';
  if (progress < 34) return 'bg-red-500';
  if (progress < 67) return 'bg-orange-500';
  if (progress < 100) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'Magas';
    case 'medium':
      return 'Közepes';
    case 'low':
      return 'Alacsony';
    default:
      return 'Normál';
  }
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProgressBarExpanded, setIsProgressBarExpanded] = useState(false);

  const queryClient = useQueryClient();

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    staleTime: 0, // Always consider data stale to get fresh updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Fetch project tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getTasks(projectId),
    enabled: !!projectId,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    staleTime: 0, // Always consider data stale to get fresh updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const task = await tasksApi.createTask({
        ...taskData,
        is_completed: false,
      } as Omit<Task, 'id' | 'created_at' | 'updated_at'>, projectId);
      
      // Update project progress
      const updatedTasks = await tasksApi.getTasks(projectId);
      const completedTasks = updatedTasks.filter(t => t.is_completed).length;
      const totalTasks = updatedTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      await projectsApi.updateProject(projectId, {
        progress_percentage: progressPercentage,
        project_status: progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'not_started'
      });
      
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'client'] });
      setIsCreateTaskModalOpen(false);
      toast.success('Feladat sikeresen létrehozva!');
    },
    onError: (error) => {
      toast.error('Hiba történt a feladat létrehozásakor');
      console.error('Create task error:', error);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      tasksApi.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setEditingTask(null);
      toast.success('Feladat sikeresen frissítve!');
    },
    onError: (error) => {
      toast.error('Hiba történt a feladat frissítésekor');
      console.error('Update task error:', error);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await tasksApi.deleteTask(taskId);
      
      // Update project progress
      const updatedTasks = await tasksApi.getTasks(projectId);
      const completedTasks = updatedTasks.filter(t => t.is_completed).length;
      const totalTasks = updatedTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      await projectsApi.updateProject(projectId, {
        progress_percentage: progressPercentage,
        project_status: progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'not_started'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'client'] });
      toast.success('Feladat sikeresen törölve!');
    },
    onError: (error) => {
      toast.error('Hiba történt a feladat törlésekor');
      console.error('Delete task error:', error);
    },
  });

  // Toggle task completion
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      // First toggle the task
      const task = await tasksApi.toggleTaskComplete(id, isCompleted);
      
      // Then update project progress in database
      const updatedTasks = await tasksApi.getTasks(projectId);
      const completedTasks = updatedTasks.filter(t => t.is_completed).length;
      const totalTasks = updatedTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      console.log(`🔄 Toggle Task - ${project?.title}: ${completedTasks}/${totalTasks} = ${progressPercentage}%`);
      
      // Update project progress
      await projectsApi.updateProject(projectId, {
        progress_percentage: progressPercentage,
        project_status: progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'not_started'
      });
      
      return task;
    },
    onMutate: async ({ id, isCompleted }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);
      const previousProject = queryClient.getQueryData(['project', projectId]);
      
      // Optimistically update the task
      if (previousTasks) {
        queryClient.setQueryData(['tasks', projectId], (old: Task[] | undefined) => {
          if (!old) return old;
          return old.map(task => 
            task.id === id ? { ...task, is_completed: isCompleted } : task
          );
        });
      }
      
      // Optimistically update the project progress
      if (previousProject && previousTasks) {
        const currentCompleted = (previousTasks as Task[]).filter(t => t.is_completed).length;
        const total = (previousTasks as Task[]).length;
        const newCompleted = isCompleted ? currentCompleted + 1 : currentCompleted - 1;
        const newProgress = total > 0 ? Math.round((newCompleted / total) * 100) : 0;
        
        queryClient.setQueryData(['project', projectId], (old: Project | undefined) => {
          if (!old) return old;
          return {
            ...old,
            progress_percentage: newProgress,
            project_status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started'
          };
        });
      }
      
      // Return a context object with the snapshotted value
      return { previousTasks, previousProject };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
      toast.error('Hiba történt a feladat állapotának módosításakor');
      console.error('Toggle task error:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'client'] });
    },
  });

  const handleCreateTask = (taskData: Partial<Task>) => {
    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, updates: taskData });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      toggleTaskMutation.mutate({ id: taskId, isCompleted: !task.is_completed });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  // Quick create task mutation
  const quickCreateTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const task = await tasksApi.createTask({
        title,
        priority: 'medium',
      } as Omit<Task, 'id' | 'created_at' | 'updated_at'>, projectId);
      
      // Update project progress
      const updatedTasks = await tasksApi.getTasks(projectId);
      const completedTasks = updatedTasks.filter(t => t.is_completed).length;
      const totalTasks = updatedTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      await projectsApi.updateProject(projectId, {
        progress_percentage: progressPercentage,
        project_status: progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'not_started'
      });
      
      return task;
    },
    onMutate: async (title: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      await queryClient.cancelQueries({ queryKey: ['project', projectId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);
      const previousProject = queryClient.getQueryData(['project', projectId]);
      
      // Optimistically add the new task
      if (previousTasks) {
        const newTask: Task = {
          id: `temp-${Date.now()}`, // Temporary ID
          project_id: projectId,
          title,
          priority: 'medium',
          is_completed: false,
          order_index: (previousTasks as Task[]).length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData(['tasks', projectId], (old: Task[] | undefined) => {
          if (!old) return [newTask];
          return [...old, newTask];
        });
      }
      
      // Optimistically update the project progress
      if (previousProject && previousTasks) {
        const currentCompleted = (previousTasks as Task[]).filter(t => t.is_completed).length;
        const total = (previousTasks as Task[]).length + 1; // +1 for new task
        const newProgress = total > 0 ? Math.round((currentCompleted / total) * 100) : 0;
        
        queryClient.setQueryData(['project', projectId], (old: Project | undefined) => {
          if (!old) return old;
          return {
            ...old,
            progress_percentage: newProgress,
            project_status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started'
          };
        });
      }
      
      // Return a context object with the snapshotted value
      return { previousTasks, previousProject };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(['project', projectId], context.previousProject);
      }
      toast.error('Hiba történt a feladat létrehozásakor');
      console.error('Create task error:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'client'] });
      toast.success('Feladat gyorsan hozzáadva!');
    },
  });

  const handleQuickCreateTask = (title: string) => {
    quickCreateTaskMutation.mutate(title);
  };

  // Calculate progress
  const completedTasks = tasks.filter(task => task.is_completed).length;
  const totalTasks = tasks.length;
  const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressPercentage = project?.progress_percentage !== undefined ? project.progress_percentage : calculatedProgress;
  
  // Sync progress if there's a mismatch
  useEffect(() => {
    if (project && tasks.length > 0 && calculatedProgress !== project.progress_percentage) {
      console.log(`⚠️ Progress mismatch detected for ${project.title}: DB=${project.progress_percentage}%, Calculated=${calculatedProgress}%`);
      
      // Update the project progress in database
      projectsApi.updateProject(projectId, {
        progress_percentage: calculatedProgress,
        project_status: calculatedProgress === 100 ? 'completed' : calculatedProgress > 0 ? 'in_progress' : 'not_started'
      }).then(() => {
        console.log(`✅ Progress synced for ${project.title}: ${calculatedProgress}%`);
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }).catch(error => {
        console.error('Error syncing progress:', error);
      });
    }
  }, [project, tasks, calculatedProgress, projectId, queryClient]);

  // Scroll event handler for dynamic progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const threshold = 100; // Start expanding after 100px scroll
      
      console.log(`📜 Scroll: ${scrollTop}px, Threshold: ${threshold}px, isProgressBarExpanded: ${isProgressBarExpanded}`);
      
      if (scrollTop > threshold && !isProgressBarExpanded) {
        console.log(`✅ Expanding progress bar - setting isProgressBarExpanded to true`);
        setIsProgressBarExpanded(true);
      } else if (scrollTop <= threshold && isProgressBarExpanded) {
        console.log(`🔽 Collapsing progress bar - setting isProgressBarExpanded to false`);
        setIsProgressBarExpanded(false);
      }
    };

    console.log(`🎯 Setting up scroll event listener for project ${projectId}`);
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => {
      console.log(`🧹 Cleaning up scroll event listener for project ${projectId}`);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isProgressBarExpanded, projectId]);

  if (projectLoading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Projekt betöltése...</p>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-gray-600">Projekt nem található</p>
          <Button onClick={() => router.back()} className="mt-4">
            Vissza
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Debug log to see the difference
  console.log(`🔍 Project Detail - ${project.title}: DB=${project.progress_percentage}%, Calculated=${calculatedProgress}%, Tasks=${completedTasks}/${totalTasks}`);

  return (
    <MainLayout>
      {/* Debug info */}
      <div className="fixed top-0 left-0 bg-red-500 text-white p-2 text-xs z-[9999]">
        Debug: isProgressBarExpanded={isProgressBarExpanded.toString()}, 
        completedTasks={completedTasks}, 
        totalTasks={totalTasks}
        <button 
          onClick={() => setIsProgressBarExpanded(!isProgressBarExpanded)}
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Toggle Sticky
        </button>
      </div>
      
      {/* Dynamic Progress Bar */}
      {isProgressBarExpanded && (
        <div className="fixed top-16 z-50 bg-white border-b border-gray-200 shadow-sm w-full px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Projekt Haladás</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {completedTasks}/{totalTasks} feladat
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.project_status)}`}>
                  {getStatusText(project.project_status)}
                </span>
                {project.end_date && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Határidő: {new Date(project.end_date).toLocaleDateString('hu-HU')}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full progress-bar-smooth ${getProgressColor(progressPercentage)}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Breadcrumb 
            items={[
              { label: 'Projektek', href: '/projects' },
              { label: project.title }
            ]} 
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Vissza
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-sm text-gray-600">Projekt részletek</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Szerkesztés
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Törlés
              </Button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isProgressBarExpanded ? 'pt-24' : ''}`}>
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Projekt információk</h2>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.project_status)}`}>
                    {getStatusText(project.project_status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Határidő</p>
                      <p className="text-sm text-gray-600">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString('hu-HU') : 'Nincs'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Létrehozás</p>
                      <p className="text-sm text-gray-600">
                        {new Date(project.created_at).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Haladás ({completedTasks}/{totalTasks} feladat)</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full progress-bar-smooth ${getProgressColor(progressPercentage)}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Tasks */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Feladatok</h2>
                <Button 
                  size="sm"
                  onClick={() => setIsCreateTaskModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Részletes Új Feladat
                </Button>
              </div>

              {/* Quick Task Input */}
              <div className="mb-4">
                <QuickTaskInput
                  onAddTask={handleQuickCreateTask}
                  isLoading={quickCreateTaskMutation.isPending}
                  placeholder="Új feladat hozzáadása..."
                />
              </div>

              {tasksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Feladatok betöltése...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nincsenek feladatok</p>
                  <p className="text-sm text-gray-500 mt-2">Használd a fenti mezőt a gyors feladat hozzáadáshoz!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <TaskItem
                        task={task}
                        onToggle={handleToggleTask}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Ügyfél</h3>
              </div>
              
              <div className="space-y-3">
                {project.client ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.client.name}</p>
                      <p className="text-sm text-gray-600">{project.client.email}</p>
                      <p className="text-sm text-gray-600">{project.client.phone}</p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => router.push(`/clients/${project.client!.id}`)}
                    >
                      Ügyfél részletei
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Nincs hozzárendelt ügyfél</p>
                )}
              </div>
            </Card>

            {/* Project Stats */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Statisztikák</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Összes feladat</span>
                  <span className="text-sm font-medium">{totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Befejezett</span>
                  <span className="text-sm font-medium text-green-600">{completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Folyamatban</span>
                  <span className="text-sm font-medium text-blue-600">{totalTasks - completedTasks}</span>
                </div>
                {project.end_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Határidőig</span>
                    <span className="text-sm font-medium">
                      {Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} nap
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Create Task Modal */}
        <Modal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          title="Új Feladat Létrehozása"
          size="lg"
        >
          <TaskForm
            projectId={project.id}
            onSubmit={handleCreateTask}
            onCancel={() => setIsCreateTaskModalOpen(false)}
            isLoading={createTaskMutation.isPending}
          />
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          title="Feladat Szerkesztése"
          size="lg"
        >
          {editingTask && (
            <TaskForm
              task={editingTask}
              projectId={project.id}
              onSubmit={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
              isLoading={updateTaskMutation.isPending}
            />
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
