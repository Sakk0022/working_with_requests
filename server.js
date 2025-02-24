require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());

// Раздача статических файлов (фронтенда)
app.use(express.static(path.join(__dirname, 'public')));

const client = new MongoClient(process.env.MONGO_URI);
let db;

client.connect()
  .then(() => {
    db = client.db();
    console.log("✅ Подключено к MongoDB");
  })
  .catch(err => console.error("Ошибка подключения к MongoDB:", err));

// Создать обращение
app.post('/tickets', async (req, res) => {
    const { subject, message } = req.body;
    const newTicket = { subject, message, status: 'NEW', createdAt: new Date() };
    const result = await db.collection('tickets').insertOne(newTicket);
    res.json(result);
});

// Взять обращение в работу
app.patch('/tickets/:id/work', async (req, res) => {
    const { id } = req.params;
    await db.collection('tickets').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'IN_PROGRESS' } });
    res.json({ message: "Обращение взято в работу" });
});

// Завершить обращение
app.patch('/tickets/:id/complete', async (req, res) => {
    const { id } = req.params;
    const { resolution } = req.body;
    await db.collection('tickets').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'COMPLETED', resolution } });
    res.json({ message: "Обращение завершено" });
});

// Отменить обращение
app.patch('/tickets/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    await db.collection('tickets').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'CANCELLED', cancelReason: reason } });
    res.json({ message: "Обращение отменено" });
});

// Получить список обращений с фильтрацией по дате
app.get('/tickets', async (req, res) => {
    const { date, startDate, endDate } = req.query;
    let filter = {};
    
    if (date) {
        filter.createdAt = {
            $gte: new Date(date),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        };
    }
    
    if (startDate && endDate) {
        filter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // Добавили конец дня
        };
    }

    const tickets = await db.collection('tickets').find(filter).toArray();
    res.json(tickets);
});



// Отменить все обращения в статусе "в работе"
app.patch('/tickets/cancel-in-progress', async (req, res) => {
    const result = await db.collection('tickets').updateMany({ status: 'IN_PROGRESS' }, { $set: { status: 'CANCELLED' } });
    res.json({ message: `${result.modifiedCount} обращений отменено` });
});

// Отдавать фронтенд при открытии главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`));
