// Конфігурація для Supabase
const SUPABASE_URL = 'https://xbeltfxricssgyzlsmcx.supabase.com'; // Замініть на ваш URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZWx0ZnhyaWNzc2d5emxzbWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTM0MjIsImV4cCI6MjA2ODMyOTQyMn0.0W-XRK7SQeQann_92C89aIfL7ObhsgZRU49QYvrldQw'; // Замініть на ваш анонімний ключ

// Ініціалізація Supabase клієнта
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Назва таблиці в Supabase
const CLIENTS_TABLE = 'clients';

// Функції для роботи з Supabase
const SupabaseAPI = {
  // Отримання всіх клієнтів
  async getAllClients() {
    try {
      const { data, error } = await supabase
        .from(CLIENTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Помилка отримання клієнтів:', error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Помилка підключення до Supabase:', err);
      return [];
    }
  },

  // Додавання нового клієнта
  async addClient(client) {
    try {
      const { data, error } = await supabase
        .from(CLIENTS_TABLE)
        .insert([{
          name: client.name,
          inn: client.inn,
          org: client.org,
          open_date: client.openDate,
          activation_date: client.activationDate || null,
          card_status: client.cardStatus || 'На виготовленні',
          passport: client.passport || false,
          survey: client.survey || false,
          contract: client.contract || false,
          comments: client.comments || ''
        }])
        .select();
      
      if (error) {
        console.error('Помилка додавання клієнта:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Помилка підключення до Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  // Оновлення клієнта
  async updateClient(id, updates) {
    try {
      const { data, error } = await supabase
        .from(CLIENTS_TABLE)
        .update({
          name: updates.name,
          inn: updates.inn,
          org: updates.org,
          activation_date: updates.activationDate || null,
          card_status: updates.cardStatus,
          passport: updates.passport,
          survey: updates.survey,
          contract: updates.contract,
          comments: updates.comments || ''
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Помилка оновлення клієнта:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Помилка підключення до Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  // Видалення клієнта
  async deleteClient(id) {
    try {
      const { error } = await supabase
        .from(CLIENTS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Помилка видалення клієнта:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      console.error('Помилка підключення до Supabase:', err);
      return { success: false, error: err.message };
    }
  }
};

// Функція для перетворення даних з Supabase у формат додатку
function convertSupabaseToApp(supabaseClient) {
  return {
    id: supabaseClient.id,
    name: supabaseClient.name,
    inn: supabaseClient.inn,
    org: supabaseClient.org,
    openDate: supabaseClient.open_date,
    activationDate: supabaseClient.activation_date || '',
    cardStatus: supabaseClient.card_status || 'На виготовленні',
    passport: supabaseClient.passport || false,
    survey: supabaseClient.survey || false,
    contract: supabaseClient.contract || false,
    comments: supabaseClient.comments || ''
  };
}
