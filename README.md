# Shear.ly

Shear.ly – REST API для скорочення URL з підрахунком переходів та окремим сервісом аналітики.

Проєкт реалізований у рамках дисципліни **«Архітектура розподілених систем»**.

Система складається з двох сервісів:

- **Link Service** – робота з короткими посиланнями та REST API;
- **Analytics Service** – збір та отримання статистики переходів.

Для синхронного отримання аналітики використовується **gRPC**, а для асинхронної реєстрації переходів – **RabbitMQ**.

---

# Функціональність

## Link Service

API підтримує:

- створення коротких посилань;
- отримання посилання за ID;
- отримання списку всіх посилань;
- перенаправлення за коротким кодом;
- оновлення посилання;
- видалення посилання;
- перевірку стану API та бази даних;
- валідацію URL;
- єдиний формат помилок;
- підтримку `Idempotency-Key`;
- публікацію подій `ClickRegistered` у RabbitMQ.

## Analytics Service

Analytics Service відповідає за:

- обробку подій `ClickRegistered`;
- отримання статистики окремого посилання;
- отримання загальної кількості переходів;
- зберігання аналітичних даних у таблиці `analytics_clicks`;
- ідемпотентну обробку повідомлень;
- підтвердження повідомлень RabbitMQ тільки після успішної обробки.

---

# Технології

- **Node.js**
- **TypeScript**
- **Express**
- **PostgreSQL**
- **Docker / Docker Compose**
- **node-postgres (`pg`)**
- **dotenv**
- **RabbitMQ**
- **amqplib**
- **gRPC**
- **@grpc/grpc-js**
- **@grpc/proto-loader**
- **ts-proto**

---

# Архітектура

Система використовує синхронну взаємодію для отримання аналітичних даних та асинхронну взаємодію для реєстрації переходів.

```text
                         Client
                           |
                           | HTTP REST
                           v
                 +----------------------+
                 |     Link Service     |
                 |        :3000         |
                 +----------------------+
                    |              |
                    |              | ClickRegistered
                    |              v
                    |       +-------------+
                    |       |  RabbitMQ   |
                    |       +-------------+
                    |              |
                    |              | analytics.clicks
                    |              v
                    |       +----------------------+
                    |       |  Analytics Service   |
                    |       |       :50051          |
                    |       +----------------------+
                    |              |
                    |              | PostgreSQL
                    |              v
                    |       +----------------------+
                    |       | analytics_clicks     |
                    |       | processed_events     |
                    |       +----------------------+
                    |
                    | gRPC
                    v
             Analytics Service
```

Під час redirect основний потік не очікує виконання аналітичної операції через gRPC. Link Service публікує подію `ClickRegistered` у RabbitMQ.

Analytics Service отримує подію з черги, обробляє її та після успішної транзакції надсилає ACK.

gRPC використовується для операцій читання аналітики:

- `GetLinkAnalytics`;
- `GetTotalClicks`.

---

# Власність даних

**Link Service** володіє:

- `links`;
- `idem_keys`.

**Analytics Service** володіє:

- `analytics_clicks`;
- `processed_events`.

Analytics Service не виконує SQL-запити до таблиць Link Service.

---

# Структура проєкту

```text
shear.ly/

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
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   └── link.controller.ts
│   │
│   ├── db/
│   │   └── database.ts
│   │
│   ├── generated/
│   │   └── analytics.ts
│   │
│   ├── grpc/
│   │   └── analytics.client.ts
│   │
│   ├── messaging/
│   │   └── rabbitmq.publisher.ts
│   │
│   ├── middleware/
│   │   └── error.middleware.ts
│   │
│   ├── proto/
│   │   └── analytics.proto
│   │
│   ├── repositories/
│   │   ├── link.repository.ts
│   │   └── idempotency.repository.ts
│   │
│   ├── routes/
│   │   └── link.routes.ts
│   │
│   ├── services/
│   │   └── link.service.ts
│   │
│   └── types/
│       └── link.types.ts
│
└── analytics-service/
    │
    ├── .env
    ├── package.json
    │
    ├── migrations/
    │   ├── 001_create_analytics.sql
    │   └── 002_create_processed_events.sql
    │
    ├── proto/
    │   └── analytics.proto
    │
    └── src/
        ├── server.ts
        ├── analytics.repository.ts
        ├── analytics.service.ts
        ├── rabbitmq.consumer.ts
        │
        └── generated/
            └── analytics.ts
```

---

# Вимоги

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

---

# Налаштування змінних середовища

## Link Service

Створити файл `.env` у корені проєкту:

```env
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=shearly
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

POSTGRES_REPLICA_HOST=127.0.0.1
POSTGRES_REPLICA_PORT=5433

RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USER=shear
RABBITMQ_PASSWORD=shear_password

PORT=3000
```

## Analytics Service

Створити файл:

```text
analytics-service/.env
```

з таким вмістом:

```env
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=shearly
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

GRPC_PORT=50051

RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USER=shear
RABBITMQ_PASSWORD=shear_password

CONSUMER_CRASH_DELAY_MS=0
```

`CONSUMER_CRASH_DELAY_MS` використовується для контрольованого тестування повторної доставки повідомлень. У штатному режимі значення повинно бути `0`.

Файли `.env` не повинні додаватися до Git.

Для прикладу конфігурації використовуються `.env.example`.

---

# Запуск інфраструктури

PostgreSQL та RabbitMQ запускаються через Docker Compose:

```bash
docker compose up -d
```

Перевірити стан контейнерів:

```bash
docker ps
```

Основні контейнери:

```text
shearly-postgres
shearly-postgres-replica
shearly-rabbitmq
```

PostgreSQL доступний на:

```text
127.0.0.1:5432
```

Репліка PostgreSQL доступна на:

```text
127.0.0.1:5433
```

RabbitMQ AMQP:

```text
127.0.0.1:5672
```

RabbitMQ Management UI:

```text
http://localhost:15672
```

Облікові дані RabbitMQ:

```text
Username: shear
Password: shear_password
```

---

# Міграції бази даних

## Link Service

### Таблиця `links`

Файл:

```text
migrations/001_create_links.sql
```

Створює таблицю:

```text
links

├── id
├── original_url
├── short_code
├── click_count
├── created_at
└── updated_at
```

### Таблиця `idem_keys`

Файл:

```text
migrations/002_create_idempotency_keys.sql
```

Створює таблицю:

```text
idem_keys

├── id
├── key
├── request_hash
├── response_status
├── response_body
└── created_at
```

## Analytics Service

### Таблиця `analytics_clicks`

Файл:

```text
analytics-service/migrations/001_create_analytics.sql
```

Створює таблицю:

```text
analytics_clicks

├── id
├── short_code
├── click_count
└── created_at
```

### Таблиця `processed_events`

Файл:

```text
analytics-service/migrations/002_create_processed_events.sql
```

Створює таблицю:

```text
processed_events

├── event_id
└── processed_at
```

`event_id` є первинним ключем та використовується для ідемпотентної обробки повідомлень RabbitMQ.

---

# Встановлення залежностей

Для Link Service:

```bash
npm install
```

Для Analytics Service:

```bash
cd analytics-service
npm install
cd ..
```

---

# RabbitMQ

Для асинхронної реєстрації переходів використовується RabbitMQ.

Основні параметри:

```text
Exchange: shearly.events
Type: direct
Routing key: click.registered
Queue: analytics.clicks
```

Exchange та queue є durable.

Повідомлення публікуються як persistent.

---

# Подія ClickRegistered

Під час успішного redirect Link Service створює подію:

```json
{
  "eventId": "uuid",
  "eventType": "ClickRegistered",
  "shortCode": "c7436671",
  "occurredAt": "2026-10-06T13:57:51.000Z"
}
```

Подія публікується в exchange:

```text
shearly.events
```

з routing key:

```text
click.registered
```

RabbitMQ передає повідомлення в чергу:

```text
analytics.clicks
```

Analytics Service споживає повідомлення з цієї черги.

---

# Взаємодія сервісів

Під час перенаправлення:

```http
GET /links/r/:shortCode
```

виконується така послідовність:

```text
Client
   |
   | GET /links/r/c7436671
   v
Link Service
   |
   | пошук посилання
   v
PostgreSQL
   |
   | link
   v
Link Service
   |
   | ClickRegistered
   v
RabbitMQ
   |
   | analytics.clicks
   v
Analytics Service
   |
   | BEGIN
   | processed_events
   | analytics_clicks
   | COMMIT
   |
   | ACK
   v
RabbitMQ
```

Після публікації події Link Service виконує HTTP redirect на оригінальний URL.

Аналітична операція виконується асинхронно та не залежить від безпосереднього виконання consumer у момент redirect.

---

# Analytics Service Consumer

Consumer реалізований у:

```text
analytics-service/src/rabbitmq.consumer.ts
```

Він:

1. підключається до RabbitMQ;
2. створює durable exchange та queue;
3. прив'язує queue до exchange;
4. отримує `ClickRegistered`;
5. перевіряє `eventId`;
6. записує подію в `processed_events`;
7. збільшує `click_count`;
8. виконує `COMMIT`;
9. надсилає `ACK`.

Для consumer використовується:

```text
noAck = false
```

Тобто повідомлення підтверджується вручну.

ACK надсилається тільки після успішного завершення транзакції PostgreSQL.

---

# Ідемпотентність Consumer

Для захисту від повторної доставки використовується таблиця:

```text
processed_events
```

Перевірка виконується за допомогою:

```sql
INSERT INTO processed_events (event_id)
VALUES ($1)
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;
```

Обробка події виконується в одній транзакції:

```text
BEGIN
  |
  | INSERT processed_events
  |
  | UPDATE analytics_clicks
  |
COMMIT
  |
  v
ACK
```

Якщо `eventId` уже існує, повторна доставка не змінює `analytics_clicks`.

Таким чином, consumer є ідемпотентним.

---

# At-least-once delivery

RabbitMQ consumer використовує manual ACK.

Якщо повідомлення було отримано, але ACK не був відправлений, RabbitMQ може повторно доставити це повідомлення.

Для перевірки цього сценарію використовується:

```env
CONSUMER_CRASH_DELAY_MS=10000
```

Після успішної транзакції consumer очікує перед відправленням ACK.

Якщо consumer примусово завершити під час цієї паузи, повідомлення залишиться непідтвердженим.

Після повторного запуску Analytics Service RabbitMQ доставляє повідомлення повторно.

Приклад логів:

```text
Received ClickRegistered: eventId=e04ee81e-1dd7-4deb-b680-9ca2a15706eb, shortCode=c7436671
Event processed: eventId=e04ee81e-1dd7-4deb-b680-9ca2a15706eb, shortCode=c7436671
Waiting 10000ms before ACK: eventId=e04ee81e-1dd7-4deb-b680-9ca2a15706eb
```

Після завершення consumer без ACK RabbitMQ показує повідомлення в черзі:

```text
analytics.clicks    1    0
```

Після повторного запуску:

```text
Received ClickRegistered: eventId=e04ee81e-1dd7-4deb-b680-9ca2a15706eb, shortCode=c7436671
Duplicate event ignored: eventId=e04ee81e-1dd7-4deb-b680-9ca2a15706eb, shortCode=c7436671
ACK sent: eventId=e04ee81e-1dd7-4deb-b680-9ca2a15706eb, processed=false
```

Одна й та сама подія була доставлена двічі, але повторного ефекту в базі даних не відбулося.

---

# Перевірка RabbitMQ

Переглянути черги:

```powershell
docker exec shearly-rabbitmq rabbitmqctl list_queues name messages consumers
```

При активному consumer:

```text
name              messages    consumers
analytics.clicks  0           1
```

Якщо consumer тимчасово зупинений і є необроблені повідомлення:

```text
name              messages    consumers
analytics.clicks  1           0
```

Після повторного запуску consumer повідомлення обробляються та підтверджуються.

---

# gRPC API

gRPC використовується для операцій читання аналітики.

Контракт визначений у:

```text
analytics.proto
```

Analytics Service надає методи:

```text
GetLinkAnalytics
GetTotalClicks
```

Реєстрація переходу під час redirect більше не виконується через синхронний `RegisterClick`. Замість цього використовується подія `ClickRegistered` через RabbitMQ.

---

# Генерація gRPC-коду

gRPC-контракт знаходиться у:

```text
analytics-service/proto/analytics.proto
```

Для Link Service копія контракту знаходиться у:

```text
src/proto/analytics.proto
```

Генерація коду Analytics Service:

```powershell
cd analytics-service

npx.cmd protoc `
  --plugin=protoc-gen-ts_proto=.\node_modules\.bin\protoc-gen-ts_proto.cmd `
  --ts_proto_out=.\src\generated `
  --ts_proto_opt=outputServices=grpc-js `
  --proto_path=.\proto `
  .\proto\analytics.proto
```

Генерація коду Link Service:

```powershell
npx.cmd protoc `
  --plugin=protoc-gen-ts_proto=.\node_modules\.bin\protoc-gen-ts_proto.cmd `
  --ts_proto_out=.\src\generated `
  --ts_proto_opt=outputServices=grpc-js `
  --proto_path=.\src\proto `
  .\src\proto\analytics.proto
```

---

# Запуск Analytics Service

Перейти до каталогу:

```powershell
cd analytics-service
```

Запустити сервіс:

```powershell
npm.cmd run dev
```

Очікується повідомлення:

```text
RabbitMQ consumer started: queue=analytics.clicks
```

Analytics Service працює з gRPC на:

```text
localhost:50051
```

та одночасно споживає повідомлення з RabbitMQ.

---

# Запуск Link Service

У новому терміналі з кореня проєкту:

```powershell
npm.cmd run dev
```

Link Service доступний за адресою:

```text
http://localhost:3000
```

---

# Перенаправлення та аналітика

Endpoint:

```http
GET /links/r/:shortCode
```

Приклад:

```powershell
Invoke-WebRequest http://localhost:3000/links/r/905e63a9 -MaximumRedirection 0 -ErrorAction SilentlyContinue
```

Успішна відповідь:

```text
HTTP/1.1 302 Found
Location: https://...
```

Після знаходження короткого посилання Link Service публікує:

```text
ClickRegistered
```

у RabbitMQ.

Після цього Analytics Service асинхронно збільшує `click_count`.

---

# API

## Створення короткого посилання

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

Приклад відповіді:

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

---

## Отримання посилання за ID

```http
GET /links/:id
```

Приклад:

```http
GET /links/1
```

---

## Отримання всіх посилань

```http
GET /links
```

---

## Перенаправлення за коротким кодом

```http
GET /links/r/:shortCode
```

Приклад:

```http
GET /links/r/905e63a9
```

API виконує HTTP redirect на оригінальний URL.

Реєстрація переходу виконується асинхронно через RabbitMQ.

---

## Оновлення посилання

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

---

## Видалення посилання

```http
DELETE /links/:id
```

Приклад:

```http
DELETE /links/1
```

---

# Idempotency-Key

Для:

```http
POST /links
```

підтримується заголовок:

```http
Idempotency-Key: unique-key
```

Приклад:

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

Повторний запит з тим самим `Idempotency-Key` і тим самим body повертає вже збережений результат та не створює нове посилання.

Якщо той самий ключ використати з іншим body, API повертає:

```http
409 Conflict
```

Приклад:

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REUSED",
    "message": "Idempotency-Key was already used with a different request"
  }
}
```

---

# Обробка помилок

API використовує єдиний формат помилок:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "originalUrl must be a valid URL"
  }
}
```

## 404 Not Found

```json
{
  "error": {
    "code": "LINK_NOT_FOUND",
    "message": "Link not found"
  }
}
```

## 409 Conflict

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REUSED",
    "message": "Idempotency-Key was already used with a different request"
  }
}
```

## 500 Internal Server Error

Використовується для непередбачених помилок сервера:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error"
  }
}
```

---

# Перевірка стану API

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

Endpoint `/health` перевіряє підключення Link Service до PostgreSQL.

---

# HTTP-запити для тестування

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
- валідації URL;
- `404`;
- `409`;
- `Idempotency-Key`.

Запити можна виконувати через REST Client у VS Code або інший HTTP-клієнт.

---

# Перевірка PostgreSQL

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

Переглянути аналітику:

```sql
SELECT id, short_code, click_count, created_at
FROM analytics_clicks
ORDER BY id;
```

Переглянути оброблені події:

```sql
SELECT event_id, processed_at
FROM processed_events
ORDER BY processed_at;
```

Вийти з PostgreSQL:

```sql
\q
```

---

# Приклад перевірки асинхронної аналітики

Після виконання:

```powershell
Invoke-WebRequest http://localhost:3000/links/r/c7436671 -MaximumRedirection 0 -ErrorAction SilentlyContinue
```

можна перевірити таблицю:

```sql
SELECT *
FROM analytics_clicks
WHERE short_code = 'c7436671';
```

Приклад:

```text
short_code | click_count
------------+------------
c7436671   | 4
```

Окремо можна перевірити оброблені події:

```sql
SELECT event_id, processed_at
FROM processed_events
ORDER BY processed_at DESC;
```

Кожна успішно оброблена подія має унікальний `event_id`.

---

# Перевірка повторної доставки

Для контрольованого експерименту в `analytics-service/.env` можна встановити:

```env
CONSUMER_CRASH_DELAY_MS=10000
```

Після запуску Analytics Service та виконання redirect consumer виведе:

```text
Received ClickRegistered: eventId=..., shortCode=c7436671
Event processed: eventId=..., shortCode=c7436671
Waiting 10000ms before ACK: eventId=...
```

Якщо consumer примусово завершити до ACK, повідомлення залишиться в RabbitMQ.

Перевірка:

```powershell
docker exec shearly-rabbitmq rabbitmqctl list_queues name messages consumers
```

Очікуваний результат:

```text
analytics.clicks    1    0
```

Після повторного запуску consumer та сама подія буде отримана повторно:

```text
Received ClickRegistered: eventId=...
Duplicate event ignored: eventId=...
ACK sent: eventId=..., processed=false
```

При цьому `click_count` не збільшиться вдруге.

Після завершення експерименту необхідно повернути:

```env
CONSUMER_CRASH_DELAY_MS=0
```

---

# Schema Evolution

gRPC-контракт підтримує розширення повідомлень без зміни номерів уже існуючих полів.

Наприклад, до:

```proto
message RegisterClickRequest {
  string short_code = 1;
}
```

може бути додане нове поле:

```proto
message RegisterClickRequest {
  string short_code = 1;
  string user_agent = 2;
}
```

Номер існуючого поля `1` не змінюється та не використовується повторно.

Такий підхід дозволяє старим клієнтам продовжувати взаємодіяти з оновленим сервером.

---

# Архітектурні принципи

Проєкт використовує розділення відповідальностей.

## Link Service

Відповідає за:

- REST API;
- короткі посилання;
- `links`;
- `idem_keys`;
- idempotency;
- redirect;
- публікацію подій `ClickRegistered`.

## Analytics Service

Відповідає за:

- статистику переходів;
- `analytics_clicks`;
- `processed_events`;
- обробку подій RabbitMQ;
- gRPC API для читання аналітики.

## Взаємодія

Для запису події:

```text
Link Service
     |
     | ClickRegistered
     v
RabbitMQ
     |
     v
Analytics Service
```

Для читання аналітики:

```text
Link Service
     |
     | gRPC
     v
Analytics Service
```

Analytics Service не має прямого доступу до таблиць Link Service.

---

# Зупинка сервісів

Зупинити Link Service:

```text
Ctrl + C
```

Зупинити Analytics Service:

```text
Ctrl + C
```

Зупинити інфраструктуру:

```bash
docker compose down
```

Щоб видалити також дані PostgreSQL та RabbitMQ:

```bash
docker compose down -v
```

---

# Локальний запуск

Повний порядок запуску:

### 1. Клонувати репозиторій

```bash
git clone <repository-url>
```

### 2. Перейти до проєкту

```bash
cd shear.ly
```

### 3. Встановити залежності Link Service

```bash
npm install
```

### 4. Встановити залежності Analytics Service

```bash
cd analytics-service
npm install
cd ..
```

### 5. Запустити інфраструктуру

```bash
docker compose up -d
```

### 6. Запустити Analytics Service

В окремому терміналі:

```powershell
cd analytics-service
npm.cmd run dev
```

Очікується:

```text
RabbitMQ consumer started: queue=analytics.clicks
```

### 7. Запустити Link Service

У ще одному терміналі:

```powershell
npm.cmd run dev
```

### 8. Перевірити API

```text
http://localhost:3000/health
```

Очікується:

```json
{
  "status": "ok"
}
```

---

# Production build

Для Link Service:

```bash
npm run build
```

Після успішної компіляції:

```bash
npm start
```

Analytics Service наразі запускається у режимі розробки:

```powershell
cd analytics-service
npm.cmd run dev
```
