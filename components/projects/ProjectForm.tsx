'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Project, Client } from '@/types';
import { clientsApi } from '@/services/clientsApi';
import toast from 'react-hot-toast';

interface ProjectFormProps {
  project?: Project;
  clients: Client[];
  onSubmit: (projectData: Partial<Project>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  onClientCreated?: (client: Client) => void;
}

export function ProjectForm({ project, clients, onSubmit, onCancel, isLoading = false, onClientCreated }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    clientId: project?.client_id || '',
    startDate: project?.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
    endDate: project?.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
    priority: project?.priority || 'medium',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const clientOptions = [
    ...clients.map(client => ({
      value: client.id,
      label: client.name,
    })),
    { value: 'new', label: '+ Új ügyfél létrehozása' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'A projekt címe kötelező';
    }

    if (clients.length > 1 && !formData.clientId) {
      newErrors.clientId = 'Válassz egy ügyfelet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateClientForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newClientData.name.trim()) {
      newErrors.name = 'Az ügyfél neve kötelező';
    }

    if (newClientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientData.email)) {
      newErrors.email = 'Érvénytelen email cím';
    }

    setClientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // If only one client, automatically set the client ID
      const clientId = clients.length === 1 ? clients[0].id : formData.clientId;
      
      onSubmit({
        ...formData,
        client_id: clientId,
        end_date: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClientChange = (value: string) => {
    if (value === 'new') {
      setShowClientModal(true);
    } else {
      handleInputChange('clientId', value);
    }
  };

  const handleCreateClient = async () => {
    if (!validateClientForm()) {
      return;
    }

    setIsCreatingClient(true);
    try {
      const newClient = await clientsApi.createClient(newClientData);
      toast.success('Ügyfél sikeresen létrehozva!');
      
      // Close modal and reset form
      setShowClientModal(false);
      setNewClientData({ name: '', email: '', phone: '', address: '' });
      setClientErrors({});
      
      // Set the newly created client as selected
      setFormData(prev => ({ ...prev, clientId: newClient.id }));
      
      // Notify parent component about the new client
      if (onClientCreated) {
        onClientCreated(newClient);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Hiba történt az ügyfél létrehozásakor');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleClientInputChange = (field: string, value: string) => {
    setNewClientData(prev => ({ ...prev, [field]: value }));
    if (clientErrors[field]) {
      setClientErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Projekt címe"
          value={formData.title}
          onChange={(value) => handleInputChange('title', value)}
          placeholder="Ad meg a projekt címét"
          error={errors.title}
        />

        <Textarea
          label="Leírás"
          value={formData.description}
          onChange={(value) => handleInputChange('description', value)}
          placeholder="Részletes leírás a projektről"
          rows={4}
        />

        {clients.length > 1 ? (
          <Select
            label="Ügyfél"
            value={formData.clientId}
            onChange={handleClientChange}
            options={clientOptions}
            placeholder="Válassz ügyfelet"
            error={errors.clientId}
          />
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ügyfél</label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-900">{clients[0]?.name}</p>
              <p className="text-xs text-gray-500">{clients[0]?.email}</p>
            </div>
          </div>
        )}

        <Input
          label="Határidő"
          type="date"
          value={formData.endDate}
          onChange={(value) => handleInputChange('endDate', value)}
          placeholder="Válassz határidőt"
        />

        <Select
          label="Prioritás"
          value={formData.priority}
          onChange={(value) => handleInputChange('priority', value)}
          options={[
            { value: 'low', label: 'Alacsony' },
            { value: 'medium', label: 'Közepes' },
            { value: 'high', label: 'Magas' },
          ]}
          placeholder="Válassz prioritást"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Mégse
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Mentés...' : (project ? 'Frissítés' : 'Létrehozás')}
          </Button>
        </div>
      </form>

      {/* New Client Modal */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Új Ügyfél Létrehozása"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Ügyfél neve"
            value={newClientData.name}
            onChange={(value) => handleClientInputChange('name', value)}
            placeholder="Ad meg az ügyfél nevét"
            error={clientErrors.name}
          />
          
          <Input
            label="Email cím"
            type="email"
            value={newClientData.email}
            onChange={(value) => handleClientInputChange('email', value)}
            placeholder="pelda@email.com"
            error={clientErrors.email}
          />
          
          <Input
            label="Telefonszám"
            value={newClientData.phone}
            onChange={(value) => handleClientInputChange('phone', value)}
            placeholder="+36 20 123 4567"
          />
          
          <Textarea
            label="Cím"
            value={newClientData.address}
            onChange={(value) => handleClientInputChange('address', value)}
            placeholder="Teljes cím"
            rows={3}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowClientModal(false)}
              disabled={isCreatingClient}
            >
              Mégse
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={isCreatingClient}
            >
              {isCreatingClient ? 'Létrehozás...' : 'Ügyfél létrehozása'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
