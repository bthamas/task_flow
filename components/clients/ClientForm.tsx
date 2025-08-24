'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Client } from '@/types';

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (clientData: Partial<Client>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClientForm({ initialData, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});



  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Az ügyfél neve kötelező';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Érvénytelen email cím';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Ügyfél neve"
        value={formData.name}
        onChange={(value) => handleInputChange('name', value)}
        placeholder="Ad meg az ügyfél nevét"
        error={errors.name}
      />

      <Input
        label="Email cím"
        type="email"
        value={formData.email}
        onChange={(value) => handleInputChange('email', value)}
        placeholder="pelda@email.com"
        error={errors.email}
      />

      <Input
        label="Telefonszám"
        value={formData.phone}
        onChange={(value) => handleInputChange('phone', value)}
        placeholder="+36 20 123 4567"
      />

      <Textarea
        label="Cím"
        value={formData.address}
        onChange={(value) => handleInputChange('address', value)}
        placeholder="Teljes cím"
        rows={3}
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
          {isLoading ? 'Mentés...' : (initialData ? 'Frissítés' : 'Létrehozás')}
        </Button>
      </div>
    </form>
  );
}
