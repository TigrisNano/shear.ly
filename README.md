# Shear.ly

Shear.ly — REST API для скорочення URL з підрахунком переходів.

Проєкт реалізований у рамках лабораторної роботи з дисципліни **«Архітектура розподілених систем»**.

## Функціональність

API підтримує:

- створення коротких посилань;
- отримання посилання за ID;
- отримання списку всіх посилань;
- перенаправлення за коротким кодом;
- підрахунок кількості переходів;
- оновлення посилання;
- видалення посилання;
- перевірку стану API та бази даних;
- валідацію URL;
- єдиний формат помилок;
- підтримку `Idempotency-Key` для безпечного повторення запитів.

## Технології

- **Node.js**
- **TypeScript**
- **Express**
- **PostgreSQL**
- **Docker / Docker Compose**
- **node-postgres (`pg`)**
- **dotenv**

## Структура проєкту

```text
shear.ly/
│
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.md
│
├── migrations/
│   ├── 001_create_links.sql
│   └── 002_create_idempotency_keys.sql
│
├── requests/
│   └── api.http
│
└── src/
    ├── app.ts
    ├── server.ts
    │
    ├── config/
    │   └── env.ts
    │
    ├── controllers/
    │   └── link.controller.ts
    │
    ├── db/
    │   └── database.ts
    │
    ├── middleware/
    │   └── error.middleware.ts
    │
    ├── repositories/
    │   ├── link.repository.ts
    │   └── idempotency.repository.ts
    │
    ├── routes/
    │   └── link.routes.ts
    │
    ├── services/
    │   └── link.service.ts
    │
    └── types/
        └── link.types.ts
```

## Вимоги

Для запуску проєкту необхідно мати:

- Node.js;
- npm;
- Docker Desktop.

Перевірити Node.js:

```bash
node --version
```

Перевірити npm:

```bash
npm --version
```

Перевірити Docker:

```bash
docker --version
```

## Налаштування змінних середовища

Конфігурація застосунку виконується через змінні середовища.

Створити файл `.env` у корені проєкту:

```env
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=shearly
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PORT=3000
```

Файл `.env` не повинен додаватися до Git.

Для прикладу конфігурації використовується `.env.example`.

## Запуск PostgreSQL

Запустити PostgreSQL через Docker Compose:

```bash
docker compose up -d
```

Перевірити стан контейнера:

```bash
docker ps
```

Очікується контейнер:

```text
shearly-postgres
```

PostgreSQL доступний на:

```text
127.0.0.1:5432
```

## Міграції бази даних

Структура бази даних описана у директорії `migrations`.

### Таблиця links

Файл:

```text
migrations/001_create_links.sql
```

Створює таблицю `links`:

```text
id
original_url
short_code
click_count
created_at
updated_at
```

### Таблиця idem_keys

Файл:

```text
migrations/002_create_idempotency_keys.sql
```

Створює таблицю для збереження результатів ідемпотентних запитів:

```text
id
key
request_hash
response_status
response_body
created_at
```

Міграції виконуються у PostgreSQL.

## Встановлення залежностей

Встановити залежності:

```bash
npm install
```

## Запуск у режимі розробки

Запустити API:

```bash
npm run dev
```

Для Windows PowerShell, якщо `npm.ps1` заблокований політикою виконання, можна використати:

```powershell
npm.cmd run dev
```

Після запуску API доступний за адресою:

```text
http://localhost:3000
```

Очікуване повідомлення:

```text
Shear.ly server is running on port 3000
```

## Production build

Створити TypeScript build:

```bash
npm run build
```

Після успішної компіляції запускається:

```bash
npm start
```

## Перевірка стану API

```http
GET /health
```

Приклад:

```bash
curl http://localhost:3000/health
```

Успішна відповідь:

```json
{
  "status": "ok"
}
```

Endpoint `/health` виконує перевірку підключення до PostgreSQL.

## API

### Створення короткого посилання

```http
POST /links
Content-Type: application/json
```

Body:

```json
{
  "originalUrl": "https://google.com"
}
```

Успішна відповідь:

```json
{
  "id": "1",
  "original_url": "https://google.com",
  "short_code": "905e63a9",
  "click_count": 0,
  "created_at": "2026-09-14T09:41:58.835Z",
  "updated_at": "2026-09-14T09:41:58.835Z"
}
```

Підтримуються URL тільки з протоколами:

```text
http
https
```

### Отримання посилання за ID

```http
GET /links/:id
```

Приклад:

```http
GET /links/1
```

### Отримання всіх посилань

```http
GET /links
```

### Перенаправлення за коротким кодом

```http
GET /links/r/:shortCode
```

Приклад:

```http
GET /links/r/905e63a9
```

У відповідь API виконує HTTP redirect на оригінальний URL.

Кожне успішне перенаправлення збільшує:

```text
click_count
```

на одиницю.

### Оновлення посилання

```http
PUT /links/:id
Content-Type: application/json
```

Body:

```json
{
  "originalUrl": "https://github.com"
}
```

Приклад:

```http
PUT /links/1
```

Оновлюється `original_url`, при цьому короткий код залишається незмінним.

### Видалення посилання

```http
DELETE /links/:id
```

Приклад:

```http
DELETE /links/1
```

## Idempotency-Key

Для `POST /links` підтримується заголовок:

```http
Idempotency-Key: unique-key
```

Наприклад:

```http
POST /links
Content-Type: application/json
Idempotency-Key: demo-key-001
```

Body:

```json
{
  "originalUrl": "https://github.com"
}
```

Перший запит створює коротке посилання.

Повторний запит з тим самим `Idempotency-Key` і тим самим body повертає вже збережений результат і **не створює нове посилання**.

Якщо той самий ключ використати з іншим body, API повертає:

```http
409 Conflict
```

Приклад відповіді:

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REUSED",
    "message": "Idempotency-Key was already used with a different request"
  }
}
```

Для перевірки idempotency можна виконати:

```text
POST + key + google.com
POST + same key + google.com
POST + same key + github.com
```

Очікуваний результат:

```text
1-й запит → 201 Created
2-й запит → той самий результат
3-й запит → 409 Conflict
```

## Обробка помилок

API використовує єдиний формат помилок:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

### 400 Bad Request

Використовується для помилкових даних запиту.

Приклад:

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "originalUrl must be a valid URL"
  }
}
```

### 404 Not Found

Використовується, якщо посилання не знайдено.

```json
{
  "error": {
    "code": "LINK_NOT_FOUND",
    "message": "Link not found"
  }
}
```

### 409 Conflict

Використовується при конфлікті `Idempotency-Key`.

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REUSED",
    "message": "Idempotency-Key was already used with a different request"
  }
}
```

### 500 Internal Server Error

Використовується для непередбачених помилок сервера.

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error"
  }
}
```

## HTTP-запити для тестування

Готова колекція HTTP-запитів знаходиться у:

```text
requests/api.http
```

Вона містить запити для:

- `/health`;
- створення link;
- отримання link;
- отримання всіх links;
- redirect;
- update;
- delete;
- валідації;
- `404`;
- `409`;
- `Idempotency-Key`.

Запити можна виконувати через REST Client у VS Code або будь-який інший HTTP-клієнт.

## Приклад тестування через PowerShell

Перевірка `/health`:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Створення link:

```powershell
$body = @{
    originalUrl = "https://google.com"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3000/links" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Отримання всіх links:

```powershell
Invoke-RestMethod http://localhost:3000/links
```

## Перевірка PostgreSQL

Підключитися до PostgreSQL у Docker:

```powershell
docker exec -it shearly-postgres psql -U postgres -d shearly
```

Переглянути links:

```sql
SELECT id, original_url, short_code, click_count
FROM links
ORDER BY id;
```

Переглянути idempotency keys:

```sql
SELECT key, request_hash, response_status, response_body
FROM idem_keys
ORDER BY id;
```

Вийти з PostgreSQL:

```sql
\q
```

## Зупинка PostgreSQL

```bash
docker compose down
```

Щоб видалити також дані PostgreSQL:

```bash
docker compose down -v
```

## Архітектура

Проєкт використовує розділення відповідальностей:

```text
HTTP Request
     │
     ▼
Routes
     │
     ▼
Controllers
     │
     ▼
Services
     │
     ▼
Repositories
     │
     ▼
PostgreSQL
```

### Routes

Визначають HTTP endpoints.

### Controllers

Обробляють HTTP request/response та базову валідацію.

### Services

Містять бізнес-логіку:

- генерація короткого коду;
- створення посилання;
- idempotency;
- перевірка конфліктів.

### Repositories

Виконують SQL-запити до PostgreSQL.

### Middleware

Містить централізовану обробку помилок.

## Основна модель даних

### links

```text
links
├── id
├── original_url
├── short_code
├── click_count
├── created_at
└── updated_at
```

`short_code` є унікальним.

`click_count` починається з `0` і збільшується при перенаправленні.

### idem_keys

```text
idem_keys
├── id
├── key
├── request_hash
├── response_status
├── response_body
└── created_at
```

Таблиця використовується для забезпечення ідемпотентності створення коротких посилань.

## Git

Файли конфігурації з секретними значеннями, зокрема `.env`, не повинні додаватися до репозиторію.

Для нового середовища необхідно створити власний `.env` на основі `.env.example`.

## Локальний запуск

Повний порядок запуску:

```bash
git clone <repository-url>
cd shear.ly
npm install
docker compose up -d
npm run dev
```

API після запуску доступний за адресою:

```text
http://localhost:3000
```

Перевірка:

```text
GET http://localhost:3000/health
```

Очікується:

```json
{
  "status": "ok"
}
```
