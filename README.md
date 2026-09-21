# Shear.ly

Shear.ly — REST API для скорочення URL з підрахунком переходів та окремим сервісом аналітики.

Проєкт реалізований у рамках лабораторних робіт з дисципліни **«Архітектура розподілених систем»**.

У лабораторній роботі №2 монолітний REST-сервіс було декомпозовано на два сервіси:

- **Link Service** — робота з короткими посиланнями;
- **Analytics Service** — збір та отримання статистики переходів.

Для синхронної взаємодії між сервісами використовується **gRPC**.

---

## Функціональність

### Link Service

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
- взаємодію з Analytics Service через gRPC;
- обробку недоступності Analytics Service з поверненням `503 Service Unavailable`.

### Analytics Service

Analytics Service відповідає за:

- реєстрацію переходів за коротким кодом;
- отримання статистики окремого посилання;
- отримання загальної кількості переходів;
- зберігання аналітичних даних у власній таблиці `analytics_clicks`.

---

## Технології

- **Node.js**
- **TypeScript**
- **Express**
- **PostgreSQL**
- **Docker / Docker Compose**
- **node-postgres (`pg`)**
- **dotenv**
- **gRPC**
- **@grpc/grpc-js**
- **@grpc/proto-loader**
- **ts-proto**

---

## Архітектура

Після декомпозиції система складається з двох сервісів:

```text
                         Client
                           |
                           | HTTP REST
                           v
                +----------------------+
                |     Link Service     |
                |        :3000         |
                +----------------------+
                    |             |
                    |             | gRPC
                    |             v
                    |    +----------------------+
                    |    |  Analytics Service  |
                    |    |       :50051         |
                    |    +----------------------+
                    |             |
                    v             v
              PostgreSQL      PostgreSQL
                links       analytics_clicks
             idem_keys
```

### Власність даних

**Link Service** володіє:

- `links`;
- `idem_keys`.

**Analytics Service** володіє:

- `analytics_clicks`.

Analytics Service не виконує SQL-запити до таблиць Link Service.

---

## Структура проєкту

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
    │   └── 001_create_analytics.sql
    │
    ├── proto/
    │   └── analytics.proto
    │
    └── src/
        ├── server.ts
        ├── analytics.repository.ts
        ├── analytics.service.ts
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
```

Файли `.env` не повинні додаватися до Git.

Для прикладу конфігурації використовуються `.env.example`.

---

# Запуск PostgreSQL

PostgreSQL запускається через Docker Compose:

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

Міграція знаходиться у:

```text
analytics-service/migrations/001_create_analytics.sql
```

Створюється таблиця:

```text
analytics_clicks

├── id
├── short_code
├── click_count
└── created_at
```

Analytics Service використовує цю таблицю для зберігання статистики переходів.

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

# gRPC API

Контракт визначений у:

```text
analytics.proto
```

Analytics Service надає три методи:

```text
RegisterClick
GetLinkAnalytics
GetTotalClicks
```

## RegisterClick

Реєструє перехід за коротким кодом.

```proto
rpc RegisterClick(RegisterClickRequest)
    returns (RegisterClickResponse);
```

Запит:

```proto
message RegisterClickRequest {
    string short_code = 1;
    string user_agent = 2;
}
```

Поле `user_agent` було додано під час експерименту зі зміною схеми.

## GetLinkAnalytics

Повертає статистику окремого короткого посилання:

```proto
rpc GetLinkAnalytics(GetLinkAnalyticsRequest)
    returns (GetLinkAnalyticsResponse);
```

## GetTotalClicks

Повертає загальну кількість переходів:

```proto
rpc GetTotalClicks(GetTotalClicksRequest)
    returns (GetTotalClicksResponse);
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
Analytics gRPC server is running on port 50051
```

Analytics Service працює на:

```text
localhost:50051
```

---

# Запуск Link Service

У новому терміналі з кореня проєкту:

```powershell
npm.cmd run dev
```

Очікується повідомлення:

```text
Shear.ly server is running on port 3000
```

Link Service доступний за адресою:

```text
http://localhost:3000
```

---

# Взаємодія сервісів

Зовнішній REST API залишається без змін.

Під час перенаправлення:

```text
GET /links/r/:shortCode
```

відбувається така послідовність:

```text
Client
   |
   | GET /links/r/905e63a9
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
   | gRPC RegisterClick
   v
Analytics Service
   |
   | INSERT / UPDATE
   v
analytics_clicks
```

Після успішної реєстрації переходу Link Service виконує HTTP redirect на оригінальний URL.

---

# Перенаправлення та аналітика

Endpoint:

```http
GET /links/r/:shortCode
```

Приклад:

```bash
curl.exe -i http://localhost:3000/links/r/905e63a9
```

Успішна відповідь:

```text
HTTP/1.1 302 Found
Location: https://github.com
```

При кожному успішному перенаправленні Link Service викликає:

```text
Analytics Service → RegisterClick
```

Analytics Service збільшує `click_count` у власній таблиці:

```text
analytics_clicks
```

---

# Timeout та обробка недоступності Analytics Service

Для gRPC-запиту встановлено deadline:

```text
1 секунда
```

Якщо Analytics Service недоступний або не відповідає протягом встановленого часу, Link Service не очікує необмежено довго.

У такому випадку клієнт отримує:

```http
503 Service Unavailable
```

Приклад:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Analytics Service is unavailable"
  }
}
```

Таким чином, відмова Analytics Service не призводить до зависання REST-запиту.

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

У відповідь API виконує HTTP redirect на оригінальний URL.

При цьому статистика переходу передається до Analytics Service через gRPC.

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

Повторний запит з тим самим `Idempotency-Key` і тим самим body повертає вже збережений результат та **не створює нове посилання**.

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

## 503 Service Unavailable

Повертається, якщо Analytics Service недоступний:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Analytics Service is unavailable"
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

Вийти з PostgreSQL:

```sql
\q
```

---

# Приклад перевірки Analytics Service

Після виконання:

```bash
curl.exe -i http://localhost:3000/links/r/905e63a9
```

можна перевірити таблицю:

```sql
SELECT *
FROM analytics_clicks;
```

Приклад:

```text
 id | short_code | click_count
----+------------+------------
  1 | 905e63a9   | 2
```

Це означає, що для короткого коду `905e63a9` було зареєстровано два переходи.

---

# Schema Evolution

У рамках лабораторної роботи було виконано експеримент зі зміною gRPC-контракту.

Початкова структура:

```proto
message RegisterClickRequest {
  string short_code = 1;
}
```

Після зміни до контракту було додано нове поле:

```proto
message RegisterClickRequest {
  string short_code = 1;
  string user_agent = 2;
}
```

Було виконано такі дії:

1. поле `user_agent` додано до `analytics.proto`;
2. повторно згенеровано код тільки для Analytics Service;
3. Analytics Service перезапущено;
4. Link Service залишився зі старою версією згенерованого клієнта;
5. виконано запит через старий Link Service;
6. запит успішно оброблено новим Analytics Service.

Старий клієнт продовжив працювати, оскільки він передає поле:

```text
short_code = 1
```

а нове поле:

```text
user_agent = 2
```

не є обов'язковим для старого клієнта.

Номер існуючого поля `1` не змінювався та не використовувався повторно.

Це демонструє сумісність старого клієнта з оновленою версією gRPC-сервера.

---

# Зміни в лабораторній роботі №2

Порівняно з лабораторною роботою №1 у проєкті Shear.ly було виконано такі зміни:

- створено окремий **Analytics Service** для збору статистики переходів;
- додано окрему таблицю `analytics_clicks` для зберігання аналітичних даних;
- створено gRPC-контракт `analytics.proto`;
- реалізовано три gRPC-методи: `RegisterClick`, `GetLinkAnalytics`, `GetTotalClicks`;
- додано gRPC-клієнт у **Link Service**;
- логіку збільшення кількості переходів перенесено до Analytics Service;
- реалізовано взаємодію між сервісами через gRPC;
- зовнішній REST API Link Service залишено без змін;
- додано deadline **1 секунда** для gRPC-запиту;
- реалізовано повернення HTTP `503 Service Unavailable`, якщо Analytics Service недоступний;
- реалізовано розділення володіння даними між сервісами;
- виконано перевірку роботи системи при зупиненому Analytics Service;
- проведено експеримент **schema evolution** шляхом додавання поля `user_agent = 2`;
- перевірено, що старий Link Service продовжує працювати з оновленим Analytics Service без повторної генерації клієнта.

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
- redirect.

## Analytics Service

Відповідає за:

- статистику переходів;
- `analytics_clicks`;
- gRPC API аналітики.

## Взаємодія

Сервіси взаємодіють тільки через визначений gRPC-контракт.

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

Зупинити Link Service можна через:

```text
Ctrl + C
```

Зупинити Analytics Service:

```text
Ctrl + C
```

Зупинити PostgreSQL:

```bash
docker compose down
```

Щоб видалити також дані PostgreSQL:

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

### 5. Запустити PostgreSQL

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
Analytics gRPC server is running on port 50051
```

### 7. Запустити Link Service

У ще одному терміналі:

```powershell
npm.cmd run dev
```

Очікується:

```text
Shear.ly server is running on port 3000
```

### 8. Перевірити API

```text
GET http://localhost:3000/health
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

---

# Результат лабораторної роботи

У результаті виконання лабораторної роботи №2 монолітний REST-сервіс Shear.ly було декомпозовано на два незалежні сервіси — Link Service та Analytics Service.

Link Service продовжує надавати REST API для роботи з короткими посиланнями, а Analytics Service відповідає за статистику переходів. Синхронна взаємодія між сервісами реалізована за допомогою gRPC. Для gRPC-викликів встановлено deadline, а при недоступності Analytics Service REST API повертає `503 Service Unavailable`.

Кожен сервіс володіє власними даними, а взаємодія між ними виконується через визначений контракт `analytics.proto`. Також було проведено експеримент зі зміною gRPC-схеми та перевірено сумісність старого клієнта з оновленим сервером.
