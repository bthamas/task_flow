'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Task } from '@/types';

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({ task, projectId, onSubmit, onCancel, isLoading = false }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const priorityOptions = [
    { value: 'low', label: 'Alacsony' },
    { value: 'medium', label: 'Közepes' },
    { value: 'high', label: 'Magas' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'A feladat címe kötelező';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'A határidő kötelező';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        project_id: projectId,
        due_date: new Date(formData.due_date).toISOString(),
      });
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
        label="Feladat címe"
        value={formData.title}
        onChange={(value) => handleInputChange('title', value)}
        placeholder="Ad meg a feladat címét"
        error={errors.title}
      />

      <Textarea
        label="Leírás"
        value={formData.description}
        onChange={(value) => handleInputChange('description', value)}
        placeholder="Részletes leírás a feladatról"
        rows={4}
      />

      {/* Project is already selected */}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Prioritás"
          value={formData.priority}
          onChange={(value) => handleInputChange('priority', value)}
          options={priorityOptions}
        />

        <Input
          label="Határidő"
          type="date"
          value={formData.due_date}
          onChange={(value) => handleInputChange('due_date', value)}
          error={errors.due_date}
        />
      </div>

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
          {isLoading ? 'Mentés...' : (task ? 'Frissítés' : 'Létrehozás')}
        </Button>
      </div>
    </form>
  );
}
