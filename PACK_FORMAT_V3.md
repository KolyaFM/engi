# Пакет знаний .engi, schemaVersion 3

`.engi` — ZIP с `bundle.json` и файлами `media/`. Новый `manifest.json` содержит `format: "engi-pack"`, `schemaVersion: 3`, `name`, `createdAt`, `files` (путь, размер, SHA-256, MIME). Builder заполняет manifest автоматически. `packId`, `packVersion` и внутренние ID в новом пакете не нужны.

## Правила

- У сущности и каждой ссылки обязательны `name` и `type`.
- Название, тип и алиасы — запрос на сопоставление, а не уникальный ключ.
- `aliases` содержат переводы и другие написания. `externalIds` — необязательные внешние каталожные идентификаторы, например `{"wikidata":"Q5582"}`.
- Для одноимённых объектов `qualifiers` содержит реальные свойства, например `{"Автор":{"name":"...","type":"Человек"}}`. Свойство должно быть известно или описано в `properties`.
- Объекты для обучения перечисляются в `deck.members` явно. Авторы, города и прочие справочные записи не становятся участниками сами собой.
- Новые поля объявляются в корневом `properties`: `name`, `aliases`, `valueType`, `multiple`, `learnable`; ограничения `subjectTypes` / `targetTypes` и вопросы необязательны.
- Факт: `property`, `value`, `source` или `sources`, `verification`, необязательный `learnable`. Подтверждённый факт требует источника. Отсутствие источника допустимо только для непроверенного факта.
- `verification`: `unverified` по умолчанию; `direct`, `verified`, `user_confirmed` допускают обучение. Не указывайте эти статусы без проверки.
- Изображение: `file`, `role`, `sourceUrl`, `license`, необязательные `primary` / `recognition`. Файл PNG, JPEG или WebP обязан находиться в архиве.
- Для вопроса со всеми значениями многозначного поля сущность указывает `completeProperties: ["Автор"]`. Это утверждение о полноте списка; не ставьте его при частичном списке.

## Пример

```json
{
  "schemaVersion": 3,
  "name": "Моя колода",
  "entities": [
    {
      "name": "Винсент ван Гог",
      "type": "Человек",
      "aliases": ["Ван Гог", "Vincent van Gogh"]
    },
    {
      "name": "Звёздная ночь",
      "type": "Картина",
      "facts": [
        {
          "property": "Автор",
          "value": {"name": "Винсент ван Гог", "type": "Человек"},
          "source": {"kind": "manual", "name": "Проверить перед обучением"},
          "verification": "unverified"
        }
      ],
      "images": [
        {
          "file": "media/starry-night.jpg",
          "role": "artwork",
          "sourceUrl": "https://example.org/source",
          "license": "Укажите реальную лицензию",
          "primary": true,
          "recognition": true
        }
      ]
    }
  ],
  "deck": {
    "name": "Моя колода",
    "members": [{"name": "Звёздная ночь", "type": "Картина"}],
    "learning": {
      "properties": ["Автор"],
      "imageRecognition": true
    }
  }
}
```

Это образец структуры: URL и лицензию нужно заменить реальными, файл — добавить в `media/`. Готовые примеры без медиа находятся в `examples/`.

## Значения

| valueType | Формат value |
|---|---|
| entity | `{"name":"...","type":"...","aliases":["..."]}` |
| text | `"Текст"` |
| number | `123` либо `{"value":123,"unit":"см"}` |
| boolean | `true` / `false` |
| date | `1889`, `"1889"`, `"1889-06"`, `"1889-06-01"` |
| date, приблизительно | `{"value":1889,"approximate":true}` или `"circa 1889"` |
| date, диапазон | `{"start":1889,"end":1890}` |

`properties` внутри сущности может быть кратким словарём `{"Дата рождения":"1853-03-30"}`. Такие записи импортируются непроверенными; для обучения используйте расширенный `facts` с источником и реальным статусом проверки.

## Сборка

```powershell
pnpm pack:build ./pack-source ./my-pack.engi
```

Лимиты: архив до 512 МБ, каждый файл / JSON до 16 МБ. Технические ключи `id`, `entityId`, `factId`, `valueEntityId`, `tagId`, `mediaId`, `deckId`, `packId` запрещены в декларативном содержимом. Внутренняя резервная копия сохраняет технические ID: это другой формат.
