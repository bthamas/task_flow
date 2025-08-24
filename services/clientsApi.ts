import { createBrowserClient } from '@supabase/ssr';
import { Client } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export const clientsApi = {
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data || [];
  },

  async getClient(id: string): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data;
  },

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    // Convert camelCase to snake_case for database
    const dbClient = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(dbClient)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    // Convert camelCase to snake_case for database
    const dbUpdates = {
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      address: updates.address,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data;
  },

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
  }
};
