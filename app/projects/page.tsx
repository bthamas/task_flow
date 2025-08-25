'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { Plus, Search, Filter, Calendar, User, Edit, Trash2, Eye, Mail, Phone } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { projectsApi } from '@/services/projectsApi';
import { clientsApi } from '@/services/clientsApi';
import { tasksApi } from '@/services/tasksApi';
import { Project } from '@/types';
import toast from 'react-hot-toast';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'border-green-500';
    case 'in_progress':
      return 'border-blue-500';
    default:
      return 'border-gray-300';
  }
};

const getProgressColor = (progress: number) => {
  if (progress === 0) return 'bg-gray-200';
  if (progress < 34) return 'bg-red-500';
  if (progress < 67) return 'bg-orange-500';
  if (progress < 100) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getProgressBorderColor = (progress: number) => {
  if (progress === 0) return 'border-gray-300';
  if (progress < 34) return 'border-red-500';
  if (progress < 67) return 'border-orange-500';
  if (progress < 100) return 'border-yellow-500';
  return 'border-green-500';
};

const getProgressCardClass = (progress: number) => {
  if (progress === 0) return 'card-progress-gray';
  if (progress < 34) return 'card-progress-red';
  if (progress < 67) return 'card-progress-orange';
  if (progress < 100) return 'card-progress-yellow';
  return 'card-progress-green';
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Befejezett';
    case 'in_progress':
      return 'Folyamatban';
    case 'not_started':
      return 'Nem kezdődött el';
    default:
      return 'Létrehozva';
  }
};

// Use the progress_percentage from the database instead of calculating it
const getProjectProgress = (project: Project): number => {
  return project.progress_percentage || 0;
};

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [projectProgress, setProjectProgress] = useState<{ [key: string]: number }>({});

  // Check if we should open create modal on page load
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Remove the query parameter from URL
      router.replace('/projects');
    }
  }, [searchParams, router]);

  const queryClient = useQueryClient();

  // Fetch projects with automatic refetch
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => projectsApi.getProjects(statusFilter ? { status: statusFilter as any } : undefined),
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    staleTime: 0, // Always consider data stale to get fresh updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });



  // Fetch clients for the form
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients(),
  });

  // Fetch all tasks for projects
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getTasks(),
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: Partial<Project>) => {
      if (!projectData.title || !projectData.client_id) throw new Error('Title and client are required');
      return projectsApi.createProject(projectData as Omit<Project, 'project_status' | 'id' | 'created_at' | 'updated_at' | 'progress_percentage'>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateModalOpen(false);
      toast.success('Projekt sikeresen létrehozva!');
    },
    onError: (error) => {
      toast.error('Hiba történt a projekt létrehozásakor');
      console.error('Create project error:', error);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      projectsApi.updateProject(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
      toast.success('Projekt sikeresen frissítve!');
    },
    onError: (error) => {
      toast.error('Hiba történt a projekt frissítésekor');
      console.error('Update project error:', error);
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projekt sikeresen törölve!');
    },
    onError: (error) => {
      toast.error('Hiba történt a projekt törlésekor');
      console.error('Delete project error:', error);
    },
  });

  // Use progress from database directly
  useEffect(() => {
    const progressData: { [key: string]: number } = {};
    
    for (const project of projects) {
      progressData[project.id] = getProjectProgress(project);
    }
    
    setProjectProgress(progressData);
  }, [projects]);

  // Helper function to get task counts for a project
  const getProjectTaskCounts = (projectId: string) => {
    const projectTasks = allTasks.filter(task => task.project_id === projectId);
    const completedTasks = projectTasks.filter(task => task.is_completed).length;
    const totalTasks = projectTasks.length;
    return { completedTasks, totalTasks };
  };

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const progress = getProjectProgress(project);
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!statusFilter) return matchesSearch;
    
    // Filter by progress-based status
    switch (statusFilter) {
      case 'completed':
        return matchesSearch && progress === 100;
      case 'in_progress':
        return matchesSearch && progress > 0 && progress < 100;
      case 'not_started':
        return matchesSearch && progress === 0;
      default:
        return matchesSearch;
    }
  });

  const handleCreateProject = (projectData: Partial<Project>) => {
    createProjectMutation.mutate(projectData);
  };

  const handleUpdateProject = (projectData: Partial<Project>) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, updates: projectData });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a projektet?')) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
  };

  const handleViewProject = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  const handleViewClient = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/clients/${clientId}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projektek</h1>
            <p className="mt-1 text-sm text-gray-600">
              Projektek kezelése és nyomon követése
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Új Projekt
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Minden státusz</option>
            <option value="not_started">Nem kezdődött el</option>
            <option value="in_progress">Folyamatban</option>
            <option value="completed">Befejezett</option>
          </select>
          
          <input
            type="text"
            placeholder="Keresés projektek között..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Projects Grid */}
        {projectsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Projektek betöltése...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Nincsenek projektek</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className={`${getProgressCardClass(getProjectProgress(project))} cursor-pointer hover:shadow-lg transition-all duration-200`}
                onClick={() => handleViewProject(project)}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.title}</h3>
                    {project.client && (
                      <p 
                        className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (project.client) {
                            router.push(`/clients/${project.client.id}`);
                          }
                        }}
                      >
                        {project.client.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Haladás</span>
                      <span className="font-semibold text-blue-600">
                        {(() => {
                          const { completedTasks, totalTasks } = getProjectTaskCounts(project.id);
                          return `(${completedTasks}/${totalTasks}) ${getProjectProgress(project)}%`;
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <span
                        className={`h-2 rounded-full progress-bar-smooth ${getProgressColor(getProjectProgress(project))} block`}
                        style={{ width: `${getProjectProgress(project)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {project.end_date ? 
                        `Határidő: ${new Date(project.end_date).toLocaleDateString('hu-HU')}` :
                        'Nincs határidő'
                      }
                    </span>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${getProjectProgress(project) === 100 ? 'bg-green-100 text-green-700 border border-green-200' : 
                        getProjectProgress(project) > 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                        'bg-gray-100 text-gray-700 border border-gray-200'}
                    `}>
                      {getProjectProgress(project) === 100 ? 'Befejezett' : 
                       getProjectProgress(project) > 0 ? 'Folyamatban' : 
                       'Nem kezdődött el'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Új Projekt Létrehozása"
          size="lg"
        >
          <ProjectForm
            clients={clients}
            onSubmit={handleCreateProject}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createProjectMutation.isPending}
            onClientCreated={(newClient) => {
              // Refresh clients list when a new client is created
              queryClient.invalidateQueries({ queryKey: ['clients'] });
            }}
          />
        </Modal>

        {/* Edit Project Modal */}
        <Modal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          title="Projekt Szerkesztése"
          size="lg"
        >
          {editingProject && (
            <ProjectForm
              project={editingProject}
              clients={clients}
              onSubmit={handleUpdateProject}
              onCancel={() => setEditingProject(null)}
              isLoading={updateProjectMutation.isPending}
              onClientCreated={(newClient) => {
                // Refresh clients list when a new client is created
                queryClient.invalidateQueries({ queryKey: ['clients'] });
              }}
            />
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
