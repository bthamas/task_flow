'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ClientForm } from '@/components/clients/ClientForm';
import { Plus, Search, User, Edit, Trash2, Eye, Mail, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clientsApi } from '@/services/clientsApi';
import { Client } from '@/types';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients(),
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: (clientData: Partial<Client>) => {
      if (!clientData.name) throw new Error('Name is required');
      return clientsApi.createClient(clientData as Omit<Client, 'id' | 'created_at' | 'updated_at'>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsCreateModalOpen(false);
      toast.success('Ügyfél sikeresen létrehozva!');
    },
    onError: (error) => {
      console.error('Create client error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('Invalid API key')) {
        toast.error('Adatbázis kapcsolódási hiba: Érvénytelen API kulcs. Ellenőrizd a Supabase beállításokat.');
      } else if (error.message?.includes('relation "clients" does not exist')) {
        toast.error('Adatbázis hiba: A clients tábla nem létezik. Futtasd le a database-setup.sql szkriptet.');
      } else if (error.message?.includes('duplicate key')) {
        toast.error('Az ügyfél email címe már létezik.');
      } else {
        toast.error(`Hiba történt az ügyfél létrehozásakor: ${error.message || 'Ismeretlen hiba'}`);
      }
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) =>
      clientsApi.updateClient(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingClient(null);
      toast.success('Ügyfél sikeresen frissítve!');
    },
    onError: (error) => {
      console.error('Update client error:', error);
      
      if (error.message?.includes('Invalid API key')) {
        toast.error('Adatbázis kapcsolódási hiba: Érvénytelen API kulcs.');
      } else if (error.message?.includes('relation "clients" does not exist')) {
        toast.error('Adatbázis hiba: A clients tábla nem létezik.');
      } else {
        toast.error(`Hiba történt az ügyfél frissítésekor: ${error.message || 'Ismeretlen hiba'}`);
      }
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => clientsApi.deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Ügyfél sikeresen törölve!');
    },
    onError: (error) => {
      console.error('Delete client error:', error);
      
      if (error.message?.includes('Invalid API key')) {
        toast.error('Adatbázis kapcsolódási hiba: Érvénytelen API kulcs.');
      } else if (error.message?.includes('relation "clients" does not exist')) {
        toast.error('Adatbázis hiba: A clients tábla nem létezik.');
      } else {
        toast.error(`Hiba történt az ügyfél törlésekor: ${error.message || 'Ismeretlen hiba'}`);
      }
    },
  });

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = (clientData: Partial<Client>) => {
    createClientMutation.mutate(clientData);
  };

  const handleUpdateClient = (clientData: Partial<Client>) => {
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, updates: clientData });
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt az ügyfelet?')) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const handleEditClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
  };

  const handleViewClient = (client: Client) => {
    router.push(`/clients/${client.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ügyfelek</h1>
            <p className="mt-1 text-sm text-gray-600">
              Ügyfelek kezelése és adatainak megtekintése
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Új Ügyfél
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Keresés ügyfelek között..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Clients Grid */}
        {clientsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Ügyfelek betöltése...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Nincsenek ügyfelek</p>
          </div>
        ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card 
                key={client.id} 
                className="border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleViewClient(client)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-600">{client.email || 'Nincs email'}</p>
                      <p className="text-sm text-gray-600">{client.phone || 'Nincs telefon'}</p>
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
                      <Edit className="h-5 w-5" />
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
                      <Mail className="h-5 w-5 mr-1" />
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
                      <Phone className="h-5 w-5 mr-1" />
                      Hívás
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Cím: {client.address || 'N/A'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Client Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Új Ügyfél Létrehozása"
          size="lg"
        >
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createClientMutation.isPending}
          />
        </Modal>

        {/* Edit Client Modal */}
        <Modal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          title="Ügyfél Szerkesztése"
          size="lg"
        >
          {editingClient && (
            <ClientForm
              initialData={editingClient}
              onSubmit={handleUpdateClient}
              onCancel={() => setEditingClient(null)}
              isLoading={updateClientMutation.isPending}
            />
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
