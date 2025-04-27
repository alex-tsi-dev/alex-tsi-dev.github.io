# 🛠 Установка зависимостей проекта (npm)

## 🔹 Базовая установка
```sh
npm i
```

## 🔹 Запуск проекта

```sh
npm run start
```

## 🔹 Если возникли проблемы
1. **Очисти секцию `devDependencies`** в `package.json`.
2. Выполни команду установки зависимостей вручную:
   ```sh
   npm i autoprefixer concat node-sass npm-run-all postcss-cli live-server --save-dev
   ```
3. Повтори установку:
   ```sh
   npm i
   ```

После этого зависимости должны установиться корректно. 🚀