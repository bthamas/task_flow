'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Circle, GripVertical, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskView: (task: Task) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

export function TaskList({
  tasks,
  onTaskToggle,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  onReorder,
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  // Helper functions for priority display
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <Card className="p-0">
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onTaskToggle={onTaskToggle}
                onTaskEdit={onTaskEdit}
                onTaskDelete={onTaskDelete}
                onTaskView={onTaskView}
              />
            ))}
          </div>
        </Card>
      </SortableContext>
    </DndContext>
  );
}

function SortableTaskItem({
  task,
  onTaskToggle,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
}: {
  task: Task;
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskView: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Helper functions for priority display
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-6 hover:bg-gray-50 transition-colors ${
        isDragging ? 'bg-blue-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          
          <button
            onClick={() => onTaskToggle(task.id)}
            className="mt-1 hover:scale-110 transition-transform"
          >
            {task.is_completed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`text-sm font-medium ${
                task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityText(task.priority)}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              task.is_completed ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {task.description}
            </p>
            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
              {task.due_date && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Határidő: {new Date(task.due_date).toLocaleDateString('hu-HU')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTaskView(task)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Megtekintés
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTaskEdit(task)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Szerkesztés
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTaskDelete(task.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Törlés
          </Button>
        </div>
      </div>
    </div>
  );
}
