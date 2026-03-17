const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

async function request(app, path, options = {}) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  server.close();
  return { status: response.status, body };
}

test('GET /health devuelve ok', async () => {
  const { status, body } = await request(createApp(), '/health');
  assert.equal(status, 200);
  assert.deepEqual(body, { status: 'ok' });
});

test('flujo básico de tareas', async () => {
  const app = createApp();

  const created = await request(app, '/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Primera tarea' })
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.title, 'Primera tarea');
  assert.equal(created.body.completed, false);

  const listed = await request(app, '/api/tasks');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.length, 1);

  const updated = await request(app, `/api/tasks/${created.body.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true })
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.completed, true);

  const deleted = await request(app, `/api/tasks/${created.body.id}`, {
    method: 'DELETE'
  });

  assert.equal(deleted.status, 204);
});
