// JavaScript для сторінки повної статистики

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

// Функція для відображення загальної статистики
function renderSummaryCards(clients) {
  let totalAccounts = 0;
  let totalActivated = 0;
  let totalPending = 0;
  let uniqueOrgs = new Set();
  
  clients.forEach(client => {
    if (client.openDate) {
      totalAccounts++;
      uniqueOrgs.add(client.org);
    }
    if (client.activationDate) {
      totalActivated++;
    } else if (client.openDate) {
      totalPending++;
    }
  });
  
  const html = `
    <div class="summary-card">
      <div class="summary-number">${totalAccounts}</div>
      <div class="summary-label">Всього рахунків</div>
    </div>
    <div class="summary-card">
      <div class="summary-number" style="color: #4caf50;">${totalActivated}</div>
      <div class="summary-label">Активовано</div>
    </div>
    <div class="summary-card">
      <div class="summary-number" style="color: #ff9800;">${totalPending}</div>
      <div class="summary-label">Очікує активації</div>
    </div>
    <div class="summary-card">
      <div class="summary-number" style="color: #1976d2;">${uniqueOrgs.size}</div>
      <div class="summary-label">Організацій</div>
    </div>
  `;
  
  document.getElementById('summaryCards').innerHTML = html;
}

// Функція для відображення повної статистики з помісячною розбивкою
function renderFullStats(clients) {
  let orgs = {};
  let monthlyStats = {};
  
  for (const client of clients) {
    if (!orgs[client.org]) {
      orgs[client.org] = {
        totalAccounts: 0,
        activated: 0,
        pending: 0,
        monthlyBreakdown: {}
      };
    }
    
    if (client.openDate) {
      orgs[client.org].totalAccounts++;
      
      const dateParts = client.openDate.split('/');
      if (dateParts.length === 3) {
        const monthYear = `${dateParts[1]}/${dateParts[2]}`;
        
        if (!orgs[client.org].monthlyBreakdown[monthYear]) {
          orgs[client.org].monthlyBreakdown[monthYear] = 0;
        }
        orgs[client.org].monthlyBreakdown[monthYear]++;
        
        if (!monthlyStats[monthYear]) {
          monthlyStats[monthYear] = 0;
        }
        monthlyStats[monthYear]++;
      }
    }
    
    if (client.activationDate) {
      orgs[client.org].activated++;
    } else if (client.openDate) {
      orgs[client.org].pending++;
    }
  }
  
  const sortedOrgs = Object.entries(orgs).sort((a, b) => b[1].totalAccounts - a[1].totalAccounts);
  
  const allMonths = Object.keys(monthlyStats).sort((a, b) => {
    const [monthA, yearA] = a.split('/');
    const [monthB, yearB] = b.split('/');
    return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
  });
  
  let html = '<table><thead><tr><th>Організація</th><th>Всього</th><th>Активовано</th><th>Очікує</th>';
  
  for (const month of allMonths) {
    html += `<th style="background: #95d5b2; font-size: 0.8rem;">${month}</th>`;
  }
  
  html += '</tr></thead><tbody>';
  
  for (const [orgName, stats] of sortedOrgs) {
    html += `<tr>
      <td><strong>${orgName}</strong></td>
      <td style="background: #e8f5e8; font-weight: bold;">${stats.totalAccounts}</td>
      <td style="color: #4caf50; font-weight: bold;">${stats.activated}</td>
      <td style="color: #ff9800; font-weight: bold;">${stats.pending}</td>`;
    
    for (const month of allMonths) {
      const count = stats.monthlyBreakdown[month] || 0;
      const cellStyle = count > 0 ? 'background: #f0f8f0; font-weight: bold;' : 'color: #ccc;';
      html += `<td style="${cellStyle}">${count || '-'}</td>`;
    }
    
    html += '</tr>';
  }
  
  html += '<tr style="border-top: 2px solid #2d6a4f; background: #f8f9fa;">';
  html += '<td><strong>ВСЬОГО:</strong></td>';
  html += `<td style="background: #d4edda; font-weight: bold;">${Object.values(orgs).reduce((sum, org) => sum + org.totalAccounts, 0)}</td>`;
  html += `<td style="color: #4caf50; font-weight: bold;">${Object.values(orgs).reduce((sum, org) => sum + org.activated, 0)}</td>`;
  html += `<td style="color: #ff9800; font-weight: bold;">${Object.values(orgs).reduce((sum, org) => sum + org.pending, 0)}</td>`;
  
  for (const month of allMonths) {
    html += `<td style="background: #e9ecef; font-weight: bold;">${monthlyStats[month] || 0}</td>`;
  }
  
  html += '</tr></tbody></table>';
  document.getElementById('fullStatsTables').innerHTML = html;
}

// Ініціалізація сторінки
window.onload = async function() {
  const clients = await fetchData();
  renderSummaryCards(clients);
  renderFullStats(clients);
};
