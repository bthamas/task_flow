'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus } from 'lucide-react';

interface QuickTaskInputProps {
  onAddTask: (title: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function QuickTaskInput({ onAddTask, isLoading = false, placeholder = "Új feladat hozzáadása..." }: QuickTaskInputProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onAddTask(taskTitle.trim());
      setTaskTitle('');
      // Keep focus on the input after adding task
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && taskTitle.trim()) {
      e.preventDefault();
      onAddTask(taskTitle.trim());
      setTaskTitle('');
      // Keep focus on the input after adding task
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <div className="flex-1">
        <Input
          ref={inputRef}
          value={taskTitle}
          onChange={(value) => setTaskTitle(value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!taskTitle.trim() || isLoading}
        className="flex-shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
