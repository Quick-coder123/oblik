import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Дозволяємо тільки POST запити
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const newClient = req.body;
    
    // Додаємо дату відкриття
    newClient.openDate = new Date().toISOString().slice(0, 10);
    
    // Читаємо поточні дані
    const dataPath = path.join(process.cwd(), 'data.json');
    let clients = [];
    
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      clients = JSON.parse(fileContent);
    }
    
    // Додаємо нового клієнта
    clients.push(newClient);
    
    // Зберігаємо назад у файл
    fs.writeFileSync(dataPath, JSON.stringify(clients, null, 2));
    
    res.status(200).json({ success: true, client: newClient });
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ error: 'Failed to add client' });
  }
}
