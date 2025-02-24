const API_URL = "http://localhost:3000/tickets";

// Загрузка списка обращений
async function loadTickets() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    
    let url = API_URL;
    
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await fetch(url);
    const tickets = await response.json();
    
    const tableBody = document.getElementById("ticketsTable");
    tableBody.innerHTML = "";

    tickets.forEach(ticket => {
        const row = document.createElement("tr");
        
        row.innerHTML = `
            <td>${ticket._id}</td>
            <td>${ticket.subject}</td>
            <td>${ticket.message}</td>
            <td>${ticket.status}</td>
            <td>
                ${ticket.status === "NEW" ? `<button class="work" onclick="updateStatus('${ticket._id}', 'IN_PROGRESS')">В работу</button>` : ""}
                ${ticket.status === "IN_PROGRESS" ? `<button class="complete" onclick="completeTicket('${ticket._id}')">Завершить</button>` : ""}
                ${ticket.status !== "COMPLETED" ? `<button class="cancel" onclick="cancelTicket('${ticket._id}')">Отменить</button>` : ""}
                ${ticket.status === "COMPLETED" ? `<button class="view" onclick="viewResolution('${ticket._id}')">Решение</button>` : ""}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Создание обращения
async function createTicket() {
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
    });

    if (response.ok) {
        document.getElementById("subject").value = "";
        document.getElementById("message").value = "";
        loadTickets();
    }
}

// Обновление статуса обращения
async function updateStatus(id, status) {
    await fetch(`${API_URL}/${id}/work`, { method: "PATCH" });
    loadTickets();
}

// Завершение обращения с вводом решения
async function completeTicket(id) {
    const resolution = prompt("Введите решение обращения:");
    if (!resolution) return;

    await fetch(`${API_URL}/${id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
    });

    loadTickets();
}

// Отмена обращения
async function cancelTicket(id) {
    const reason = prompt("Введите причину отмены:");
    if (!reason) return;

    await fetch(`${API_URL}/${id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
    });

    loadTickets();
}

// Просмотр решения завершенного обращения
async function viewResolution(id) {
    const response = await fetch(API_URL);
    const tickets = await response.json();
    const ticket = tickets.find(t => t._id === id);

    if (ticket && ticket.resolution) {
        alert(`Решение обращения:\n${ticket.resolution}`);
    } else {
        alert("Решение отсутствует.");
    }
}
async function cancelAllInProgress() {
    const response = await fetch(`${API_URL}/cancel-in-progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
        alert("Все обращения в статусе 'В работе' отменены.");
        loadTickets();
    }
}


// Загрузка обращений при загрузке страницы
document.addEventListener("DOMContentLoaded", loadTickets);
