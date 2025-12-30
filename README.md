# Инструкции по получению ключей

---

## Firebase

1. Перейти на:  
   `https://console.firebase.google.com/project/{project_name}/settings/general` → получить константы 1–7
2. Перейти на:  
   `https://console.firebase.google.com/project/{project_name}/settings/serviceaccounts/adminsdk` → Generate new private key → константы 8–10
3. `FIREBASE_DB_NAME` — имя Firestore Database

---

## Google Storage Cloud

1. Зайти на: `https://console.cloud.google.com/`
2. Выбрать или создать проект — его ID = `GCP_PROJECT_ID`
3. Выбрать или создать бакет — его name = `GCP_BUCKET_NAME`
4. В консоли GCP:  
   `IAM & Admin → Service Accounts`
    - Найти сервисный аккаунт (или создать новый)
    - Actions → Manage keys → Add key → Create new key → JSON
    - Скачать файл — это `GCP_SERVICE_KEY`

---

## Upstash Redis

1. Авторизоваться: `https://console.upstash.com/`
2. Создать базу
3. Получить константы:
    - `UPSTASH_REDIS_REST_URL`
    - `UPSTASH_REDIS_REST_TOKEN`

---

## Sendpulse

1. Авторизоваться: `https://login.sendpulse.com/`
2. Перейти на `https://login.sendpulse.com/settings/#api`
3. Получить константы:
    - `SENDPULSE_ID`
    - `SENDPULSE_SECRET`

---



# Инструкции по деплою:

---

## Local:

 1. npm install
 2. cd functions/ -> npm install

---

## Firebase:

 1. Разрешить отправлять смс для авторизации:
    `https://console.firebase.google.com/` -> Authentication -> Settings -> SMS region policy -> Allow, выбрать регионы

---

## Firebase cli:

1.firebase login
2. firebase projects:list
3. firebase use <ID_проекта>
4. Задать sendpulse переменныу в firebase secrets  
   firebase functions:secrets:set SENDPULSE_ID
   firebase functions:secrets:set SENDPULSE_SECRET
5. npm run deploy (Всё)
   firebase deploy --only firestore:rules,firestore:indexes (Правила + Индексы)
   firebase deploy --only functions (Cloud Functions)

---

## Vercel:
 1. Подключить репозиторий
 2. Создать проект
 3. Заменить команду установки зависимостей.
    Project -> Settings -> Build and deployment -> install command = npm install && cd functions && npm install
 4. Добавить переменные окружения.
    Добавлять импортом .env файла
 5. Deploy
 6. Добавить урл деплоя в white list firebase
    `https://console.firebase.google.com/` -> Authentication -> Settings -> Authorized domains -> Add domain

---

## Google cloud storage
 1. Открыть Google Cloud Storage
    `https://console.cloud.google.com/storage`
 2. Открыть бакеты
 3. Выбрать нужный бакет
 4. Настроить доступы
    Вкладка Permissions -> кнопка Grant access -> New principals = allUsers ; 
                                                  Role = Storage Object Viewer