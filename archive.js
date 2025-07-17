// JavaScript для сторінки архіву

// Функції для роботи з датами (копіюємо з main.js)
function formatDateToDDMMYYYY(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Функція для отримання даних з Supabase або fallback
async function fetchData() {
  const DATA_KEY = 'oblik_clients';
  try {
    // Спочатку пробуємо отримати з Supabase
    const supabaseClients = await SupabaseAPI.getAllClients();
    
    if (supabaseClients.length > 0) {
      return supabaseClients.map(convertSupabaseToApp);
    }
    
    // Fallback
    const res = await fetch('data.json');
    const serverData = await res.json();
    
    const localData = JSON.parse(localStorage.getItem(DATA_KEY) || '[]');
    
    const allData = [...serverData];
    localData.forEach(local => {
      if (!allData.find(server => server.inn === local.inn)) {
        allData.push(local);
      }
    });
    
    return allData;
  } catch (error) {
    return JSON.parse(localStorage.getItem(DATA_KEY) || '[]');
  }
}

// Функція для фільтрації архівних клієнтів
function filterArchivedClients(clients) {
  return clients.filter(client => {
    // Умови для архівування:
    // 1. Є дата активації
    // 2. Статус карти "Видана"
    // 3. Всі документи наявні (паспорт, опитувальник, договір)
    return client.activationDate && 
           client.cardStatus === 'Видана' && 
           client.passport && 
           client.survey && 
           client.contract;
  });
}

// Функція для відображення статистики архіву
function renderArchiveStats(archivedClients) {
  const totalArchived = archivedClients.length;
  const orgsCount = new Set(archivedClients.map(c => c.org)).size;
  
  // Підрахунок по місяцях
  const monthCounts = {};
  archivedClients.forEach(client => {
    if (client.activationDate) {
      const parts = client.activationDate.split('/');
      if (parts.length === 3) {
        const monthYear = `${parts[1]}/${parts[2]}`;
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
      }
    }
  });
  
  const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  const currentMonthCount = monthCounts[currentMonth] || 0;
  
  const html = `
    <div class="stat-card">
      <div class="stat-number">${totalArchived}</div>
      <div class="stat-label">Всього в архіві</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${orgsCount}</div>
      <div class="stat-label">Організацій</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${currentMonthCount}</div>
      <div class="stat-label">За поточний місяць</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${Object.keys(monthCounts).length}</div>
      <div class="stat-label">Активних періодів</div>
    </div>
  `;
  
  document.getElementById('archiveStats').innerHTML = html;
}

// Функція для відображення таблиці архіву
function renderArchiveTable(archivedClients) {
  if (archivedClients.length === 0) {
    document.getElementById('archiveTable').innerHTML = `
      <div class="empty-archive">
        <h3>Архів порожній</h3>
        <p>Клієнти будуть автоматично переміщені в архів після виконання всіх умов:</p>
        <ul style="text-align: left; display: inline-block; margin-top: 1rem;">
          <li>✅ Наявність дати активації</li>
          <li>✅ Статус карти "Видана"</li>
          <li>✅ Всі документи зібрані (паспорт, опитувальник, договір)</li>
        </ul>
      </div>
    `;
    return;
  }
  
  // Сортуємо по даті активації (спочатку новіші)
  const sortedClients = [...archivedClients].sort((a, b) => {
    const dateA = a.activationDate ? new Date(a.activationDate.split('/').reverse().join('-')) : new Date(0);
    const dateB = b.activationDate ? new Date(b.activationDate.split('/').reverse().join('-')) : new Date(0);
    return dateB - dateA;
  });
  
  let html = `
    <table>
      <thead>
        <tr>
          <th>ПІБ</th>
          <th>ІПН</th>
          <th>Організація</th>
          <th>Дата відкриття</th>
          <th>Дата активації</th>
          <th>Статус карти</th>
          <th>Документи</th>
          <th>Коментарі</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  sortedClients.forEach(client => {
    html += `
      <tr>
        <td>${client.name}</td>
        <td>${client.inn}</td>
        <td>${client.org}</td>
        <td>${client.openDate}</td>
        <td>${client.activationDate}</td>
        <td><span class="card-status status-issued">${client.cardStatus}</span></td>
        <td class="documents-cell">
          <div>Паспорт: <span class="icon-check">✓</span></div>
          <div>Опитувальник: <span class="icon-check">✓</span></div>
          <div>Договір: <span class="icon-check">✓</span></div>
        </td>
        <td>${client.comments || ''}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  document.getElementById('archiveTable').innerHTML = html;
}

// Ініціалізація сторінки
window.onload = async function() {
  try {
    const allClients = await fetchData();
    const archivedClients = filterArchivedClients(allClients);
    
    renderArchiveStats(archivedClients);
    renderArchiveTable(archivedClients);
  } catch (error) {
    console.error('Помилка завантаження даних архіву:', error);
    document.getElementById('archiveTable').innerHTML = `
      <div class="empty-archive">
        <h3>Помилка завантаження</h3>
        <p>Не вдалося завантажити дані архіву. Спробуйте оновити сторінку.</p>
      </div>
    `;
  }
};
