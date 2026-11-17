# 02 · Персонажи VEXORA

Статус: **ЧЕРНОВИК — ждёт тестовых генераций и утверждения пользователем.**
После утверждения: лучший кадр каждого ракурса сохраняется в `vexora/characters/<name>/approved/`, и только он используется как референс. Якорь (англ. текст) вставляется в промпты слово в слово, его нельзя «перефразировать для разнообразия».

---

## KIP — постоянный герой канала
**Роль:** молодой исследователь-экспериментатор (~25 лет), который проверяет на себе странные гипотезы. Любопытство сильнее осторожности. Зритель смотрит его глазами.

### Неизменные черты (identity lock)
| Что | Решение |
|---|---|
| Пропорции | стилизованные, ~5 голов роста; голова крупная, но не «чиби»; длинные ноги, узкая талия, широкие ладони |
| Голова | мягкий скруглённый квадрат, заметные скулы, маленький прямой нос, острый подбородок |
| Глаза | крупные миндалевидные, тёпло-янтарная радужка (#C98A3A), чёткий блик; густые тёмные брови — главный инструмент эмоции |
| Волосы | короткие растрёпанные угольно-чёрные, **одна серебристо-белая прядь над левым глазом** (фирменная) |
| Кожа | тёплая светлая-смуглая, мягкое подповерхностное рассеивание, без пор и морщин |
| Куртка | **Burnt Orange #E8692A** техническая куртка с высоким воротником, матовый нейлон, светоотражающие серые полосы на обоих рукавах выше локтя, нашивка-ромб с циановой точкой на левой груди |
| Низ | графитовые карго-брюки, белые массивные кроссовки с оранжевой подошвой |
| Аксессуар | **круглые очки-гогглы в латунной оправе на лбу** (на глаза опускает только в опасности) |
| Силуэт | читается по: прядь + воротник + гогглы + оранжевый цвет |

### Характер и движение
- Характер: смелый, ироничный, быстро соображает, плохо оценивает риск. Фирменная эмоция — полуулыбка одной стороной рта + поднятая правая бровь («ну-ка проверим»).
- Движение: лёгкое, пружинистое, чуть «спешит» — антиципация короткая, follow-through длинный (куртка и прядь догоняют). При страхе движения становятся резкими и мелкими. Жестикулирует правой рукой.
- Эмоциональные реакции (лист выражений): нейтрально-сосредоточен · «ну-ка» (фирменная) · изумление (брови вверх, рот «о») · ужас (зрачки сужены, плечи вверх) · решимость (брови вниз, челюсть) · смех · растерянность · тихий шок в финале (без движения, только глаза).

### Якорь для промптов (вставлять дословно)
```
KIP: a stylized young man about 25, cinematic 3D animated feature character, about five heads tall, large softly squared head with defined cheekbones and a small straight nose, big almond-shaped warm amber eyes with crisp catchlights, thick dark expressive eyebrows, short messy charcoal-black hair with a single silver-white streak falling over his left eye, warm light-tan skin with soft subsurface scattering, burnt-orange technical jacket with a high collar, matte nylon fabric, grey reflective stripes around both upper sleeves, a small diamond patch with a cyan dot on the left chest, graphite cargo pants, chunky white sneakers with orange soles, round brass-rimmed goggles resting on his forehead
```

---

## LUMO — дрон-компаньон
**Роль:** летающий наблюдатель, «камера» экспериментов Кипа; может быть рассказчиком-«логом». Даёт VEXORA узнаваемую деталь и естественный источник света в кадре.

| Что | Решение |
|---|---|
| Форма | идеальная сфера ~18 см, шов-экватор |
| Материал | матовая белая керамика, тонкие графитовые швы, лёгкие царапины |
| Глаз | один круглый объектив, светится Anomaly Cyan #38E1FF; «эмоция» = размер зрачка-диафрагмы и мигание |
| Полёт | под сферой тонкое светящееся кольцо-левитатор, мягкая дрожь в воздухе; инерция: при остановке чуть «перелетает» и возвращается |
| Свет | глаз освещает лицо Кипа циановым заполняющим светом — фирменная пара «тёплый ключ + циановое заполнение» |

### Якорь для промптов
```
LUMO: a small floating spherical drone about the size of a grapefruit, matte white ceramic shell with thin graphite seams and faint scratches, a single round camera-lens eye glowing cyan (#38E1FF), a thin glowing cyan levitation ring hovering just beneath it, casting soft cyan light on nearby surfaces
```

---

## Тестовые генерации (ЭТАП 4, до любых сцен)
Генерировать в таком порядке, утверждать каждую ступень:

### T1 · Лист персонажа Кипа (turnaround)
```
Character reference sheet, model sheet layout on a plain light grey studio background, the same character shown four times in a row: front view, three-quarter view, side profile, back view, full body, neutral A-pose, even soft studio lighting, soft contact shadows on the floor, consistent proportions in every view. KIP: [якорь KIP]. High-end stylized 3D character render, physically based materials, clean topology look, soft global illumination, no text, no labels, no watermark.
```
Соотношение: 16:9 (лист) — исключение из 9:16, это рабочий материал.

### T2 · Лист выражений
```
Expression sheet of the same character, six head-and-shoulders portraits in a 3x2 grid on a plain light grey background: calm focused, curious half-smile with raised right eyebrow, shocked with mouth open, terrified with tiny pupils, determined with lowered brows, quiet stunned stare. KIP: [якорь KIP]. Soft studio key light, consistent face and hair in every portrait, high-end stylized 3D character render, no text.
```

### T3 · Кип + Лумо в стиле VEXORA (проверка света и подписи)
```
Vertical 9:16 cinematic frame. Medium shot, slightly low angle, 35mm lens. KIP: [якорь KIP], looking up with a curious half-smile and raised right eyebrow at LUMO: [якорь LUMO] hovering beside his head. Location: a cluttered underground research lab at night, concrete walls with condensation, steel shelving with cables and glass jars in the soft-focus background, a blurred hanging cable in the foreground. Lighting: warm orange practical lamp as key light from the left, cyan glow from the drone's eye as fill on his face, thin haze catching light beams. Cool slate-teal environment, warm character. Physically based materials, global illumination, ambient occlusion, shallow depth of field, subtle film grain. Stylized 3D animated feature film still.
```

Критерии утверждения: лицо и прядь совпадают на всех ракурсах; руки — 5 пальцев; куртка того же цвета и кроя; гогглы на лбу; персонаж не «пластиковый» и не фотореалистичный; тень на полу есть.
