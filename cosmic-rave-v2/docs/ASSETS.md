# Происхождение ассетов

## Персонаж и анимации
Автор: Quaternius. Universal Base Characters (Superhero Male) и Universal Animation Library 1.
Лицензия: CC0 1.0 Universal.
Первичные страницы автора (проверены 2026-10-09):
- https://quaternius.com/packs/universalbasecharacters.html
- https://quaternius.com/packs/universalanimationlibrary.html
- https://creativecommons.org/publicdomain/zero/1.0/

Технический источник объединённого GLB:
https://github.com/NafisRayan/Animate-Rigged-Humanoid-No-Blender/blob/main/test/human_male.glb
GLB объединяет исходную модель и совместимые анимации Quaternius по именам костей.
Сохраняются настоящая топология, веса, скелет, текстуры и движения автора.
Локальная обработка tools/optimize_model.py: 7 используемых клипов, удаление
неиспользуемых данных, текстуры до 512px. Одежда дополнительно тонируется шейдером.
Это стилизованный персонаж, не фотореалистичная заказная модель.

## Музыка
Tunnel Pressure: оригинальная процедурная композиция и запись, 140 BPM, 4/4,
192 доли, около 82.29 сек. Синтез: tools/render_music.py; без сторонних семплов.
Файл assets/audio/track.json содержит SHA-256 и секции.
Существующий VITTY не включён в новую сборку: разрешение на распространение
в репозитории не обнаружено. Старая запись не изменена.

## Код и шрифты
Three.js 0.160.1: MIT, https://threejs.org/license/.
Manrope: SIL Open Font License, Google Fonts. При отсутствии сети system-ui.
Окружение и интерфейс создаются кодом этого проекта; сторонних изображений нет.

Снимок дерева репозитория технического источника: 5821923af517ac5fdc82505faa92a0d575fc1b1a.
