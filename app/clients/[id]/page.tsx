'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Modal } from '@/components/ui/Modal';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ClientForm } from '@/components/clients/ClientForm';
import { clientsApi } from '@/services/clientsApi';
import { projectsApi } from '@/services/projectsApi';
import { tasksApi } from '@/services/tasksApi';
import { Project, Client } from '@/types';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Edit,
  Trash2,
  FolderOpen,
  CheckSquare,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

// Sample client data
const sampleClient = {
  id: '1',
  name: 'ABC Kft.',
  email: 'info@abc.hu',
  phone: '+36 1 234 5678',
  address: 'Budapest, Váci utca 1., 1052',
  createdAt: '2023-01-15',
  projects: [
    {
      id: '1',
      title: 'Weboldal Fejlesztés',
      status: 'in_progress',
      progress: 75,
      dueDate: '2024-01-15',
      tasks: 12,
      completedTasks: 9,
    },
    {
      id: '2',
      title: 'CRM Rendszer',
      status: 'created',
      progress: 0,
      dueDate: '2024-02-01',
      tasks: 20,
      completedTasks: 0,
    },
    {
      id: '3',
      title: 'Mobil App',
      status: 'completed',
      progress: 100,
      dueDate: '2023-12-20',
      tasks: 15,
      completedTasks: 15,
    },
  ],
  totalProjects: 3,
  activeProjects: 2,
  completedProjects: 1,
  totalTasks: 47,
  completedTasks: 24,
};

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

const getProgressBasedStatus = (progress: number) => {
  if (progress === 100) return 'Befejezett';
  if (progress > 0) return 'Folyamatban';
  return 'Nem kezdődött el';
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

// Use the progress_percentage from the database instead of calculating it
const getProjectProgress = (project: Project): number => {
  return project.progress_percentage || 0;
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [projectProgress, setProjectProgress] = useState<{ [key: string]: number }>({});

  // Check if we should open edit modal on page load
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditClientModalOpen(true);
      // Remove the query parameter from URL
      router.replace(`/clients/${clientId}`);
    }
  }, [searchParams, router, clientId]);
  
  const queryClient = useQueryClient();

  // Fetch client details
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getClient(clientId),
    enabled: !!clientId,
  });

  // Fetch client's projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'client', clientId],
    queryFn: () => projectsApi.getProjects({ client_id: clientId }),
    enabled: !!clientId,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    staleTime: 0, // Always consider data stale to get fresh updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });



  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: Partial<Project>) => {
      if (!projectData.title) throw new Error('Title is required');
      return projectsApi.createProject({
        ...projectData,
        client_id: clientId,
      } as Omit<Project, 'project_status' | 'id' | 'created_at' | 'updated_at' | 'progress_percentage'>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'client', clientId] });
      setIsCreateProjectModalOpen(false);
      toast.success('Projekt sikeresen létrehozva!');
    },
    onError: (error) => {
      toast.error('Hiba történt a projekt létrehozásakor');
      console.error('Create project error:', error);
    },
  });

  const handleCreateProject = (projectData: Partial<Project>) => {
    createProjectMutation.mutate(projectData);
  };

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) =>
      clientsApi.updateClient(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      setIsEditClientModalOpen(false);
      toast.success('Ügyfél sikeresen frissítve!');
    },
    onError: (error) => {
      toast.error('Hiba történt az ügyfél frissítésekor');
      console.error('Update client error:', error);
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(id),
    onSuccess: () => {
      toast.success('Ügyfél sikeresen törölve!');
      router.push('/clients');
    },
    onError: (error) => {
      toast.error('Hiba történt az ügyfél törlésekor');
      console.error('Delete client error:', error);
    },
  });

  const handleUpdateClient = (clientData: Partial<Client>) => {
    updateClientMutation.mutate({ id: clientId, updates: clientData });
  };

  // Use progress from database directly
  useEffect(() => {
    const progressData: { [key: string]: number } = {};
    
    for (const project of projects) {
      progressData[project.id] = getProjectProgress(project);
    }
    
    setProjectProgress(progressData);
  }, [projects]);

  if (clientLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Betöltés...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Ügyfél nem található</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Breadcrumb 
            items={[
              { label: 'Ügyfelek', href: '/clients' },
              { label: client.name }
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
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-sm text-gray-600">Ügyfél részletek</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (client?.email) {
                    window.open(`mailto:${client.email}`, '_blank');
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email küldése
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (client?.phone) {
                    window.open(`tel:${client.phone}`, '_blank');
                  }
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Hívás
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditClientModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Szerkesztés
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm('Biztosan törölni szeretnéd ezt az ügyfelet?')) {
                    deleteClientMutation.mutate(clientId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Törlés
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{client.name}</h2>
                    <p className="text-sm text-gray-600">Ügyfél adatok</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{client.email || 'Nincs megadva'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Telefon</p>
                      <p className="text-sm text-gray-600">{client.phone || 'Nincs megadva'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cím</p>
                      <p className="text-sm text-gray-600">{client.address || 'Nincs megadva'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Regisztráció</p>
                      <p className="text-sm text-gray-600">
                        {new Date(sampleClient.createdAt).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Projects */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Projektek</h2>
                <Button 
                  size="sm"
                  onClick={() => setIsCreateProjectModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Új Projekt
                </Button>
              </div>

              <div className="space-y-4">
                {projectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Projektek betöltése...</p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Még nincsenek projektek</p>
                    <p className="text-sm text-gray-500 mt-1">Hozz létre egy új projektet a kezdéshez</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 border-l-4 ${getProgressBorderColor(project.progress_percentage || 0)} bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer`}
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">{project.title}</h3>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-600">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (project.progress_percentage || 0) === 100 ? 'bg-green-100 text-green-700 border border-green-200' : 
                              (project.progress_percentage || 0) > 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {getProgressBasedStatus(project.progress_percentage || 0)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{project.end_date ? new Date(project.end_date).toLocaleDateString('hu-HU') : 'Nincs határidő'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Haladás</span>
                          <span className="font-semibold">{project.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(project.progress_percentage || 0)}`}
                            style={{ width: `${project.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Stats */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Statisztikák</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Összes projekt</span>
                  <span className="text-sm font-medium">{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Aktív projektek</span>
                  <span className="text-sm font-medium text-blue-600">
                    {projects.filter(p => {
                      const progress = p.progress_percentage || 0;
                      return progress > 0 && progress < 100;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Befejezett projektek</span>
                  <span className="text-sm font-medium text-green-600">
                    {projects.filter(p => (p.progress_percentage || 0) === 100).length}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gyors műveletek</h3>
              
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email küldése
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Hívás
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setIsCreateProjectModalOpen(true)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Új projekt
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legutóbbi tevékenységek</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Új projekt létrehozva</p>
                    <p className="text-xs text-gray-500">CRM Rendszer - 2 napja</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Projekt befejezve</p>
                    <p className="text-xs text-gray-500">Mobil App - 1 hónapja</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Feladat frissítve</p>
                    <p className="text-xs text-gray-500">Weboldal Fejlesztés - 3 napja</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          title="Új Projekt Létrehozása"
          size="lg"
        >
          <ProjectForm
            clients={[client]}
            onSubmit={handleCreateProject}
            onCancel={() => setIsCreateProjectModalOpen(false)}
            isLoading={createProjectMutation.isPending}
          />
        </Modal>

        {/* Edit Client Modal */}
        <Modal
          isOpen={isEditClientModalOpen}
          onClose={() => setIsEditClientModalOpen(false)}
          title="Ügyfél Szerkesztése"
          size="lg"
        >
          <ClientForm
            initialData={client}
            onSubmit={handleUpdateClient}
            onCancel={() => setIsEditClientModalOpen(false)}
            isLoading={updateClientMutation.isPending}
          />
        </Modal>
      </div>
    </MainLayout>
  );
}
