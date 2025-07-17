// Основна логіка сайту з Supabase
const DATA_KEY = 'oblik_clients'; // Залишаємо для fallback

// Функції для роботи з датами
function formatDateToDDMMYYYY(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateToYYYYMMDD(dateStr) {
  if (!dateStr || dateStr === '') return '';
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return '';
}

function formatDateFromYYYYMMDD(dateStr) {
  if (!dateStr || dateStr === '') return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return '';
}

// Функція для отримання даних з Supabase або fallback
async function fetchData() {
  try {
    // Спочатку пробуємо отримати з Supabase
    const supabaseClients = await SupabaseAPI.getAllClients();
    
    if (supabaseClients.length > 0) {
      // Конвертуємо дані з Supabase у формат додатку
      return supabaseClients.map(convertSupabaseToApp);
    }
    
    // Fallback: пробуємо завантажити з data.json
    const res = await fetch('data.json');
    const serverData = await res.json();
    
    // Також перевіряємо локальні дані
    const localData = JSON.parse(localStorage.getItem(DATA_KEY) || '[]');
    
    const allData = [...serverData];
    localData.forEach(local => {
      if (!allData.find(server => server.inn === local.inn)) {
        allData.push(local);
      }
    });
    
    return allData;
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
    // Останній fallback - тільки локальні дані
    return JSON.parse(localStorage.getItem(DATA_KEY) || '[]');
  }
}

// Функція для збереження даних (Supabase + localStorage як fallback)
async function saveData(clients) {
  // Завжди зберігаємо в localStorage як fallback
  localStorage.setItem(DATA_KEY, JSON.stringify(clients));
}

// Функція для фільтрації активних клієнтів (не архівних)
function filterActiveClients(clients) {
  return clients.filter(client => {
    // Клієнт НЕ архівний, якщо не виконується хоча б одна умова:
    // 1. Немає дати активації
    // 2. Статус карти не "Видана"
    // 3. Не всі документи наявні
    return !(client.activationDate && 
             client.cardStatus === 'Видана' && 
             client.passport && 
             client.survey && 
             client.contract);
  });
}

function renderClients(clients) {
  let html = '<table><thead><tr>' +
    '<th>ПІБ</th><th>ІПН</th><th>Організація</th><th>Дата відкриття</th><th>Дата активації</th><th>Статус карти</th><th>Документи</th><th>Коментарі</th><th>Дії</th></tr></thead><tbody>';
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    const passportIcon = c.passport ? '<span class="icon-check">✓</span>' : '<span class="icon-cross">✗</span>';
    const surveyIcon = c.survey ? '<span class="icon-check">✓</span>' : '<span class="icon-cross">✗</span>';
    const contractIcon = c.contract ? '<span class="icon-check">✓</span>' : '<span class="icon-cross">✗</span>';
    
    // Статус карти з кольоровим кодуванням
    const cardStatus = c.cardStatus || 'На виготовленні';
    let statusClass = '';
    switch(cardStatus) {
      case 'На виготовленні': statusClass = 'status-manufacturing'; break;
      case 'На відділенні': statusClass = 'status-branch'; break;
      case 'На організації': statusClass = 'status-organization'; break;
      case 'Видана': statusClass = 'status-issued'; break;
    }
    
    html += `<tr>
      <td>${c.name}</td>
      <td>${c.inn}</td>
      <td>${c.org}</td>
      <td>${c.openDate}</td>
      <td>${c.activationDate || ''}</td>
      <td><span class="card-status ${statusClass}">${cardStatus}</span></td>
      <td class="documents-cell">
        <div>Паспорт: ${passportIcon}</div>
        <div>Опитувальник: ${surveyIcon}</div>
        <div>Договір: ${contractIcon}</div>
      </td>
      <td>${c.comments||''}</td>
      <td><button onclick="editClient(${i})" class="edit-btn" title="Редагувати">✏️</button></td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('clientsTable').innerHTML = html;
}

function renderStats(clients) {
  // Отримуємо поточний місяць у форматі MM/YYYY
  const now = new Date();
  const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  
  // Статистика тільки за поточний місяць
  let orgs = {};
  
  for (const client of clients) {
    if (!orgs[client.org]) {
      orgs[client.org] = {
        currentMonthOpened: 0,
        currentMonthActivated: 0,
        currentMonthPending: 0
      };
    }
    
    // Перевіряємо чи рахунок відкрито в поточному місяці
    if (client.openDate) {
      const dateParts = client.openDate.split('/');
      if (dateParts.length === 3) {
        const accountMonth = `${dateParts[1]}/${dateParts[2]}`;
        
        if (accountMonth === currentMonth) {
          orgs[client.org].currentMonthOpened++;
          
          // Перевіряємо чи активовано в поточному місяці
          if (client.activationDate) {
            const activationParts = client.activationDate.split('/');
            if (activationParts.length === 3) {
              const activationMonth = `${activationParts[1]}/${activationParts[2]}`;
              if (activationMonth === currentMonth) {
                orgs[client.org].currentMonthActivated++;
              }
            }
          } else {
            orgs[client.org].currentMonthPending++;
          }
        }
      }
    }
  }
  
  // Сортуємо організації за кількістю відкритих рахунків у поточному місяці
  const sortedOrgs = Object.entries(orgs)
    .filter(([_, stats]) => stats.currentMonthOpened > 0)
    .sort((a, b) => b[1].currentMonthOpened - a[1].currentMonthOpened);
  
  // Створюємо компактну таблицю для поточного місяця
  let html = `<div style="margin-bottom: 1rem;">
    <h3 style="color: #2d6a4f; margin: 0 0 0.5rem 0;">Статистика за ${currentMonth}</h3>
    <p style="margin: 0; font-size: 0.9rem; color: #666;">
      <a href="statistics.html" style="color: #1976d2; text-decoration: none;">📊 Переглянути повну статистику</a>
    </p>
  </div>`;
  
  if (sortedOrgs.length > 0) {
    html += '<table><thead><tr><th>Організація</th><th>Відкрито</th><th>Активовано</th><th>Очікує</th></tr></thead><tbody>';
    
    let totalOpened = 0, totalActivated = 0, totalPending = 0;
    
    for (const [orgName, stats] of sortedOrgs) {
      html += `<tr>
        <td><strong>${orgName}</strong></td>
        <td style="background: #e8f5e8; font-weight: bold;">${stats.currentMonthOpened}</td>
        <td style="color: #4caf50; font-weight: bold;">${stats.currentMonthActivated}</td>
        <td style="color: #ff9800; font-weight: bold;">${stats.currentMonthPending}</td>
      </tr>`;
      
      totalOpened += stats.currentMonthOpened;
      totalActivated += stats.currentMonthActivated;
      totalPending += stats.currentMonthPending;
    }
    
    // Підсумковий рядок
    html += `<tr style="border-top: 2px solid #2d6a4f; background: #f8f9fa;">
      <td><strong>ВСЬОГО:</strong></td>
      <td style="background: #d4edda; font-weight: bold;">${totalOpened}</td>
      <td style="color: #4caf50; font-weight: bold;">${totalActivated}</td>
      <td style="color: #ff9800; font-weight: bold;">${totalPending}</td>
    </tr>`;
    
    html += '</tbody></table>';
  } else {
    html += '<p style="text-align: center; color: #666; font-style: italic;">У поточному місяці рахунків ще не відкривалось</p>';
  }
  
  document.getElementById('statsTables').innerHTML = html;
}

document.getElementById('clientForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const newClient = {
    name: form.name.value,
    inn: form.inn.value,
    org: form.org.value,
    openDate: formatDateToDDMMYYYY(new Date()),
    activationDate: "",
    cardStatus: "На виготовленні",
    passport: false,
    survey: false,
    contract: false,
    comments: form.comments.value
  };
  
  // Отримуємо поточні дані
  const clients = await fetchData();
  
  // Перевіряємо чи немає клієнта з таким ІПН
  if (clients.find(c => c.inn === newClient.inn)) {
    alert('Клієнт з таким ІПН вже існує!');
    return;
  }
  
  // Додаємо нового клієнта в Supabase
  const result = await SupabaseAPI.addClient(newClient);
  
  if (result.success) {
    alert('Клієнта успішно додано!');
    form.reset();
    
    // Оновлюємо відображення
    const allClients = await fetchData();
    currentClients = filterActiveClients(allClients);
    renderClients(currentClients);
    renderStats(currentClients);
  } else {
    // Fallback: додаємо локально якщо Supabase не працює
    clients.push(newClient);
    await saveData(clients);
    
    alert('Клієнта додано локально (проблема з підключенням до бази)');
    form.reset();
    
    currentClients = filterActiveClients(clients);
    renderClients(currentClients);
    renderStats(currentClients);
  }
};

// Глобальна змінна для зберігання поточних клієнтів
let currentClients = [];
let editingIndex = -1;

// Функція редагування клієнта
async function editClient(index) {
  currentClients = await fetchData();
  const client = currentClients[index];
  editingIndex = index;
  
  // Заповнюємо форму поточними даними
  document.getElementById('editName').value = client.name;
  document.getElementById('editInn').value = client.inn;
  document.getElementById('editOrg').value = client.org;
  // Конвертуємо дату з DD/MM/YYYY у YYYY-MM-DD для input[type="date"]
  document.getElementById('editActivationDate').value = formatDateToYYYYMMDD(client.activationDate || '');
  document.getElementById('editCardStatus').value = client.cardStatus || 'На виготовленні';
  document.getElementById('editPassport').checked = client.passport || false;
  document.getElementById('editSurvey').checked = client.survey || false;
  document.getElementById('editContract').checked = client.contract || false;
  document.getElementById('editComments').value = client.comments || '';
  
  // Показуємо модальне вікно
  document.getElementById('editModal').style.display = 'block';
}

// Закриття модального вікна
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  editingIndex = -1;
}

// Обробка форми редагування
document.getElementById('editForm').onsubmit = async function(e) {
  e.preventDefault();
  
  if (editingIndex === -1) return;
  
  // Конвертуємо дату з YYYY-MM-DD у DD/MM/YYYY
  const activationDateInput = document.getElementById('editActivationDate').value;
  const activationDate = activationDateInput ? formatDateFromYYYYMMDD(activationDateInput) : '';
  
  // Оновлюємо дані клієнта
  const updatedClient = {
    ...currentClients[editingIndex],
    name: document.getElementById('editName').value,
    inn: document.getElementById('editInn').value,
    org: document.getElementById('editOrg').value,
    activationDate: activationDate,
    cardStatus: document.getElementById('editCardStatus').value,
    passport: document.getElementById('editPassport').checked,
    survey: document.getElementById('editSurvey').checked,
    contract: document.getElementById('editContract').checked,
    comments: document.getElementById('editComments').value
  };
  
  // Оновлюємо в Supabase
  if (updatedClient.id) {
    const result = await SupabaseAPI.updateClient(updatedClient.id, updatedClient);
    
    if (result.success) {
      alert('Дані клієнта успішно оновлено!');
    } else {
      alert('Помилка оновлення в базі даних. Зміни збережено локально.');
    }
  }
  
  // Оновлюємо локальні дані
  currentClients[editingIndex] = updatedClient;
  await saveData(currentClients);
  
  // Зберігаємо зміни
  saveData(currentClients);
  
  // Оновлюємо відображення (фільтруємо архівні записи)
  const allClients = await fetchData();
  currentClients = filterActiveClients(allClients);
  renderClients(currentClients);
  renderStats(currentClients);
  
  // Закриваємо модальне вікно
  closeEditModal();
  
  alert('Дані клієнта оновлено!');
};

// Закриття модального вікна при кліку на хрестик
document.querySelector('.close').onclick = closeEditModal;

// Закриття модального вікна при кліку поза ним
window.onclick = function(event) {
  const modal = document.getElementById('editModal');
  if (event.target == modal) {
    closeEditModal();
  }
};

window.onload = async function() {
  const allClients = await fetchData();
  currentClients = filterActiveClients(allClients);
  renderClients(currentClients);
  renderStats(currentClients);
};
