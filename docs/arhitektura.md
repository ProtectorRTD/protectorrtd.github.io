# Как устроен сайт

## Структура

```
_config.yml                 настройки, plugins, defaults
index.md                    главная — пустая, список статей рисует макет
_layouts/default.html       единственный макет: шапка, оглавление, футер, индекс
_includes/head-custom.html  локальный override включения темы
assets/img/favicon.png      иконка вкладки браузера
articles/ru/                статьи на русском  (lang: ru-RU автоматически)
articles/en/                статьи на английском (lang: en-US автоматически)
docs/                       эта документация — НЕ публикуется
drafts/                     черновики — НЕ публикуются
```

Сборка: классическая GitHub Pages, Settings → Pages → Deploy from a branch → `main` / `(root)`.

## Как строится список статей на главной

Макет рендерит индекс только при `page.url == '/'`. Он проходит по `site.pages`
(**не** по `_posts`), берёт страницы, у которых задан `title`, группирует их по
`page.dir` и рисует заголовок раздела из мапы в `_layouts/default.html`:

```js
const DIR_LABELS = {
  'articles/ru': 'Статьи на русском',
  'articles/en': 'Articles in English',
};
```

> [!IMPORTANT]
> При добавлении новой языковой папки нужно дописать ключ в `DIR_LABELS`,
> иначе заголовок раздела будет техническим (`articles/de`).

Рядом — мапа флагов `{'en':'us','ru':'ru','ja':'jp','zh':'cn'}` и список языков
в переключателе шапки `["ru-RU", "en-US"]`. Их правят там же.

## Логотип и иконка

- **Иконка вкладки** — `assets/img/favicon.png`, путь задан в `_config.yml` (`favicon:`).
- **Логотип** в правом верхнем углу рисуется, только если заполнен `logo_src`
  в `_config.yml`. Сейчас пусто → логотипа нет. Чтобы поставить: положить файл
  в `assets/img/` и прописать `logo_src: "/assets/img/logo.png"`.

## Что было починено (сентябрь 2026)

- `index.md` объявлял `layout: home` — такого макета в `jekyll-theme-minimal` нет, сборка падала. Это была причина неработающего сайта.
- В `_config.yml` не было `plugins`, из-за чего `{% seo %}` не работал. Добавлены `jekyll-seo-tag` и `jekyll-sitemap`, а также `url`, `baseurl`, `lang`, `exclude`, `defaults`.
- Из макета убран чужой брендинг SatorImaging: Google Analytics `UA-3341541-1`, favicon и логотип с `sator-imaging.com`, копирайт в футере.
- Ссылка «Edit in Markdown» вела на `/edit/master`, ветка — `main`.
- Убрана ссылка «VS Code on Repository».
- `_includes/head-custom.html` создан локально, чтобы `{% include %}` не зависел от файла темы.
