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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className={`border-l-4 ${getProgressBorderColor(getProjectProgress(project))} cursor-pointer hover:shadow-lg transition-all duration-200`}
                onClick={() => handleViewProject(project)}
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      </div>
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
                    
                    {project.client && (
                      <div className="mt-3">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <User className="h-4 w-4 mr-1" />
                          <span 
                            className="hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={(e) => handleViewClient(project.client!.id, e)}
                          >
                            {project.client.name}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (project.client?.email) {
                                window.open(`mailto:${project.client.email}`, '_blank');
                              }
                            }}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (project.client?.phone) {
                                window.open(`tel:${project.client.phone}`, '_blank');
                              }
                            }}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Hívás
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Haladás</span>
                      <span className="font-semibold">{getProjectProgress(project)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(getProjectProgress(project))}`}
                        style={{ width: `${getProjectProgress(project)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        Határidő: {project.end_date ? new Date(project.end_date).toLocaleDateString('hu-HU') : 'Nincs'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleEditProject(project, e)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Szerkesztés
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Törlés
                      </Button>
                    </div>
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
