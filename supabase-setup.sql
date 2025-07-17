-- SQL команди для створення таблиці клієнтів в Supabase

-- Створення таблиці clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(50) UNIQUE NOT NULL,
    org VARCHAR(255) NOT NULL,
    open_date VARCHAR(10) NOT NULL,
    activation_date VARCHAR(10) DEFAULT NULL,
    card_status VARCHAR(50) DEFAULT 'На виготовленні',
    passport BOOLEAN DEFAULT FALSE,
    survey BOOLEAN DEFAULT FALSE,
    contract BOOLEAN DEFAULT FALSE,
    comments TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Створення індексів для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_clients_inn ON clients(inn);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org);
CREATE INDEX IF NOT EXISTS idx_clients_card_status ON clients(card_status);
CREATE INDEX IF NOT EXISTS idx_clients_open_date ON clients(open_date);
CREATE INDEX IF NOT EXISTS idx_clients_activation_date ON clients(activation_date);

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для автоматичного оновлення updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Налаштування Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Політики безпеки (дозволити всі операції для аутентифікованих користувачів)
CREATE POLICY "Enable all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

-- Альтернативно, якщо потрібен публічний доступ (не рекомендується для продакшн)
-- CREATE POLICY "Enable all operations for everyone" ON clients FOR ALL USING (true);

-- Надання дозволів для anon та authenticated ролей
GRANT ALL ON clients TO anon, authenticated;
GRANT USAGE ON SEQUENCE clients_id_seq TO anon, authenticated;
