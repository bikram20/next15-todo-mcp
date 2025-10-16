'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface Todo {
  id: number;
  title: string;
  completed: number;
  createdAt: number;
}

export async function getTodos(): Promise<Todo[]> {
  try {
    const stmt = db.prepare('SELECT * FROM todos ORDER BY createdAt DESC');
    const todos = stmt.all() as Todo[];
    return todos;
  } catch (error) {
    console.error('Error fetching todos:', error);
    return [];
  }
}

export async function addTodo(title: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!title || title.trim().length === 0) {
      return { success: false, error: 'Title cannot be empty' };
    }

    const stmt = db.prepare('INSERT INTO todos (title) VALUES (?)');
    stmt.run(title.trim());
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adding todo:', error);
    return { success: false, error: 'Failed to add todo' };
  }
}

export async function completeTodo(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const stmt = db.prepare('UPDATE todos SET completed = 1 WHERE id = ?');
    stmt.run(id);
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error completing todo:', error);
    return { success: false, error: 'Failed to complete todo' };
  }
}

export async function deleteTodo(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    stmt.run(id);
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting todo:', error);
    return { success: false, error: 'Failed to delete todo' };
  }
}

