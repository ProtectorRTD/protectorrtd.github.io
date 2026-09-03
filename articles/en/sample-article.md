---
title: "Sample article in English"
lang: en-US
date: 2026-09-03
description: "Article template: copy this file, rename it, change the title and the text."
author:
  - "ProtectoRTD"
---

## How to add a new article

1. Copy this file into `articles/en/` under a new name, e.g. `router-setup.md`.
2. Change `title`, `date` and `description` in the front matter.
3. Write the body in Markdown below.
4. `git add . && git commit -m "new article" && git push` — GitHub Pages builds the site for you.

The article shows up automatically in the index on the front page, under
"Articles in English". Sorting is by the `date` field, newest first.

## What you can use

Regular Markdown: **bold**, *italic*, `code`, [links](https://github.com/ProtectorRTD).

```js
console.log('Syntax highlighting works');
```

> [!TIP]
> GitHub callout blocks are supported too: `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`.

| Column | Value  |
| ------ | ------ |
| Tables | work   |
