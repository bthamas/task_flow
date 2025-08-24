'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  FolderOpen, 
  CheckSquare, 
  TrendingUp,
  Plus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Edit
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/services/projectsApi';
import { clientsApi } from '@/services/clientsApi';
import { tasksApi } from '@/services/tasksApi';
import { Project } from '@/types';

type FilterType = 'all' | 'completed' | 'in_progress' | 'not_started' | 'clients';

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
  if (progress === 100) return 'bg-green-500';
  return 'bg-orange-500';
};

const getProgressBorderColor = (progress: number) => {
  if (progress === 0) return 'border-gray-300';
  if (progress === 100) return 'border-green-500';
  return 'border-orange-500';
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

// Use the progress_percentage from the database instead of calculating it
const getProjectProgress = (project: Project): number => {
  return project.progress_percentage || 0;
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Fetch all projects with automatic refetch
  const { data: allProjects = [], isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
    refetchInterval: 10000, // Refetch every 10 seconds instead of 500ms
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when reconnecting
    gcTime: 300000, // Cache data for 5 minutes
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Fetch all clients
  const { data: allClients = [], isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients(),
    refetchInterval: 10000, // Refetch every 10 seconds instead of 500ms
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when reconnecting
    gcTime: 300000, // Cache data for 5 minutes
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Manual refresh button instead of automatic interval
  const handleManualRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Adatok frissítve!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Hiba a frissítés során');
    }
  };

  // Handle errors gracefully
  if (projectsError || clientsError) {
    console.error('Dashboard errors:', { projectsError, clientsError });
  }

  // Remove the excessive progress syncing that blocks the UI
  // Only sync when explicitly needed, not on every render

  // Helper function to get project progress
  const getProjectProgress = (project: any): number => {
    // Always use the database progress_percentage field
    const progress = project.progress_percentage !== undefined ? project.progress_percentage : 0;
    
    // Debug log to see if data is updating
    console.log(`📊 Dashboard - Project ${project.title}: ${progress}% (from DB: ${project.progress_percentage}, status: ${project.project_status})`);
    return progress;
  };

  // Calculate statistics based on actual progress
  const totalProjects = allProjects.length;
  const completedProjects = allProjects.filter(p => getProjectProgress(p) === 100).length;
  const inProgressProjects = allProjects.filter(p => {
    const progress = getProjectProgress(p);
    return progress > 0 && progress < 100;
  }).length;
  const activeClients = allClients.filter(c => c.is_active !== false).length;

  // Filter projects based on active filter, progress, and search term
  const filteredProjects = allProjects.filter(project => {
    const progress = getProjectProgress(project);
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const projectTitle = project.title?.toLowerCase() || '';
      const clientName = project.client?.name?.toLowerCase() || '';
      const projectDescription = project.description?.toLowerCase() || '';
      
      if (!projectTitle.includes(searchLower) && 
          !clientName.includes(searchLower) && 
          !projectDescription.includes(searchLower)) {
        return false;
      }
    }
    
    if (activeFilter === 'all') return true;
    if (activeFilter === 'clients') {
      // Show clients with non-completed projects
      return progress < 100;
    }
    if (activeFilter === 'completed') return progress === 100;
    if (activeFilter === 'in_progress') return progress > 0 && progress < 100;
    if (activeFilter === 'not_started') return progress === 0;
    
    return true;
  });

  // Get recent projects (latest 6)
  const recentProjects = filteredProjects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const stats = [
    { 
      name: 'Folyamatban', 
      value: inProgressProjects.toString(), 
      icon: TrendingUp, 
      color: 'text-orange-600',
      filter: 'in_progress' as FilterType
    },
    { 
      name: 'Befejezett', 
      value: completedProjects.toString(), 
      icon: CheckSquare, 
      color: 'text-green-600',
      filter: 'completed' as FilterType
    },
    { 
      name: 'Összes Projekt', 
      value: totalProjects.toString(), 
      icon: FolderOpen, 
      color: 'text-blue-600',
      filter: 'all' as FilterType
    },
    { 
      name: 'Aktív Ügyfelek', 
      value: activeClients.toString(), 
      icon: Users, 
      color: 'text-purple-600',
      filter: 'clients' as FilterType
    },
  ];
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Áttekintés a projektekről és feladatokról
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {showSearch ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Keresés projektekben..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchTerm('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                Keresés
              </Button>
            )}
            <button
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Adatok frissítése"
              onClick={handleManualRefresh}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <Button size="sm" onClick={() => router.push('/projects?create=true')}>
              <Plus className="h-4 w-4 mr-2" />
              Új Projekt
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`p-6 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                  activeFilter === stat.filter ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveFilter(stat.filter)}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {activeFilter === 'all' ? 'Legutóbbi Projektek' : 
                 activeFilter === 'completed' ? 'Befejezett Projektek' :
                 activeFilter === 'in_progress' ? 'Folyamatban Lévő Projektek' :
                 activeFilter === 'clients' ? 'Aktív Ügyfelek Projektei' :
                 'Nem Kezdődött El Projektek'}
              </h2>
              {searchTerm && (
                <p className="text-sm text-gray-600 mt-1">
                  Keresési eredmény: "{searchTerm}" - {filteredProjects.length} projekt található
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/projects')}
            >
              Összes megtekintése
            </Button>
          </div>
          
          {projectsError || clientsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Hiba történt az adatok betöltésekor</p>
              <p className="text-sm text-gray-500 mt-1">Az adatok automatikusan frissülnek...</p>
            </div>
          ) : projectsLoading || clientsLoading ? (
            <div className="text-center py-8">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto inline-block"></span>
              <p className="mt-2 text-gray-600">Projektek betöltése...</p>
            </div>
          ) : activeFilter === 'clients' ? (
            // Show active clients with non-completed projects
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // Get unique clients with non-completed projects
                const activeClientsMap = new Map();
                allProjects.forEach(project => {
                  if (project.client && getProjectProgress(project) < 100 && !activeClientsMap.has(project.client.id)) {
                    activeClientsMap.set(project.client.id, project.client);
                  }
                });
                const activeClients = Array.from(activeClientsMap.values());
                
                return activeClients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all duration-200"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{client.name}</h3>
                            <p className="text-sm text-gray-600">{client.email || 'Nincs email'}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="p-1 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/clients/${client.id}?edit=true`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (client.email) {
                                window.open(`mailto:${client.email}`, '_blank');
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
                              if (client.phone) {
                                window.open(`tel:${client.phone}`, '_blank');
                              }
                            }}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Hívás
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Aktív ügyfél
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ));
              })()}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchTerm ? `Nincs találat a "${searchTerm}" keresésre` :
                 activeFilter === 'all' ? 'Nincsenek projektek' :
                 activeFilter === 'completed' ? 'Nincsenek befejezett projektek' :
                 activeFilter === 'in_progress' ? 'Nincsenek folyamatban lévő projektek' :
                 'Nincsenek nem kezdődött el projektek'}
              </p>
              
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setSearchTerm('')}
                >
                  Keresés törlése
                </Button>
              )}

              {!searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => router.push('/projects')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Új projekt létrehozása
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                                                       <Card 
                    className={`border-l-4 ${getProgressBorderColor(getProjectProgress(project))} cursor-pointer hover:shadow-lg transition-all duration-200`}
                    onClick={() => router.push(`/projects/${project.id}`)}
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
                           <span className="font-semibold">{getProjectProgress(project)}%</span>
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
                           {getProgressBasedStatus(getProjectProgress(project))}
                         </span>
                       </div>
                     </div>
                   </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
