const express = require('express');

function createApp() {
  const app = express();
  app.use(express.json());

  const tasks = [];
  let nextId = 1;

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/tasks', (_req, res) => {
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const { title } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'El campo title es obligatorio.' });
    }

    const task = {
      id: nextId++,
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    return res.status(201).json(task);
  });

  app.patch('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    const { title, completed } = req.body || {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'title debe ser un string no vacío.' });
      }
      task.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'completed debe ser boolean.' });
      }
      task.completed = completed;
    }

    return res.json(task);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = tasks.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    tasks.splice(index, 1);
    return res.status(204).send();
  });

  return app;
}

module.exports = { createApp };
