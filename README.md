# protectorrtd.github.io

Сайт на GitHub Pages (Jekyll, тема `jekyll-theme-minimal` + свой макет `_layouts/default.html`).

## Структура

```
_config.yml                 настройки сайта
index.md                    главная — список статей строится автоматически
_layouts/default.html       макет: шапка, оглавление, подвал, индекс статей
_includes/head-custom.html  дополнительные теги в <head>
articles/ru/                статьи на русском
articles/en/                статьи на английском
```

## Как добавить статью

1. Создайте `.md` файл в `articles/ru/` или `articles/en/`.
2. Front matter — минимум `title` и `date`:

```yaml
---
title: "Название статьи"
date: 2026-09-03
description: "Короткое описание для превью"
---
```

`layout` и `lang` подставляются автоматически из `defaults` в `_config.yml`.

3. Закоммитьте и запушьте в ветку `main` — GitHub Pages соберёт сайт сам:

```bash
git add .
git commit -m "новая статья"
git push
```

## Настройки GitHub

Settings → Pages → Source: **Deploy from a branch** → `main` / `(root)`.

## Локальный запуск (опционально)

```bash
gem install bundler jekyll
bundle exec jekyll serve
```
