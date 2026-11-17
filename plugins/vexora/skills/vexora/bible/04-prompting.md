# 04 · Промпты: картинка и image-to-video

## Промпт картинки — шаблон (порядок важен: генераторы сильнее слушают начало)
```
Vertical 9:16 cinematic frame.                                   ← формат
[SHOT] [ANGLE], [LENS].                                          ← композиция, ракурс, перспектива
[MAIN SUBJECT + ACTION + EMOTION].                               ← главный объект
[CHARACTER ANCHOR(S) дословно из 02-characters.md].              ← персонажи
Location: [LOCATION ANCHOR дословно из документа эпизода].       ← локация, 3 плана
Foreground: [размытый предмет]. Background: [что вдали].         ← глубина
Lighting: [ключ, заполнение, контровой, практические, объём].    ← свет
Materials: [3 материала].                                        ← текстуры
Atmosphere: [туман/пыль/дождь/пар].                              ← воздух
Palette: [2–3 цвета по акту].                                    ← цвет
Physically based materials, global illumination, ambient occlusion, [reflections], volumetric light, shallow depth of field, atmospheric perspective, subtle film grain. Stylized 3D animated feature film still.   ← стиль-хвост (постоянный)
```
Негатив (где поддерживается): `flat 2D, cel shading, outline, anime, photorealistic human, plastic skin, extra fingers, deformed hands, duplicate character, text, watermark, logo, blurry face, oversaturated, empty background`.

Правила:
- Одно действие на кадр. Генератор плохо рисует «он делает А, пока Б делает В».
- Эмоция — через конкретику: «brows raised, mouth slightly open», а не «shocked».
- Кадр для анимации: оставляй «запас» по краям под движение камеры и не ставь руки на край кадра.
- Никаких «8K, masterpiece, ultra detailed» — они не улучшают картинку, а съедают внимание модели.
- Не называть реальные студии, фильмы, художников.
- Текст в мире (табло, надписи) — 1–3 слова в кавычках; генераторы часто ошибаются → проверять, при необходимости дорисовать в монтаже.

## Под конкретные генераторы
| Генератор | Как держать персонажа | Заметки |
|---|---|---|
| Midjourney v7 | `--oref <url> --ow 100–250` (omni reference) + `--ar 9:16`; стиль `--sref` утверждённого кадра T3 | `--no` для негатива; `--style raw` чтобы меньше «красивостей» |
| Flux (Kontext / с референсом) | редактирование утверждённого кадра: «same character, now ...» | лучший вариант для сохранения лица; текст в кадре рисует хорошо |
| Ideogram / GPT-image | загрузить лист персонажа как референс | хорошо держит надписи |
| Nano Banana / Gemini image | несколько референсов (герой + локация) в один запрос | удобно для «герой в новой позе в той же локации» |
Точные имена параметров меняются — перед работой уточняй у пользователя версию генератора.

## Image-to-video — шаблон инструкции (на каждый шот)
```
SHOT [№] · [длительность] s · [генератор, режим]
START FRAME: [файл]   END FRAME (если есть): [файл]
CAMERA: [одно главное движение + скорость + ease].
CHARACTER: [что делает тело, по фазам: антиципация → действие → follow-through]. [что делает лицо/глаза].
SECONDARY: [куртка, прядь, Лумо, провода, частицы].
ENVIRONMENT: [что меняется в мире].
VFX: [эффект + момент появления].
LIGHT: [как меняется свет].
ENDS ON: [финальное положение — нужно для склейки со следующим шотом].
KEEP STATIC / DO NOT: character design unchanged, no morphing, no extra limbs, no new characters, no text, background architecture stays fixed.
```
Сам промпт для генератора — короткая английская версия (1–4 предложения, сначала камера, потом действие): генераторы видео путаются в длинных текстах.
Пример: `Slow push-in. The young man lowers the brass goggles over his eyes with his right hand, his jacket collar shifts, the floating drone drifts closer and its cyan eye brightens. Dust drifts through the light beams. Character design stays consistent, no morphing.`

Правила I2V:
- 1 шот = 1 главное действие + 1 движение камеры. Сложное — дробить на 2 шота и склеивать.
- Длительность генерации 5 с, в монтаж идёт лучшая 1–3 с.
- Для точных переходов — start + end frame (Kling, Runway, Luma, Veo поддерживают ключевые кадры).
- Если лицо «плывёт» — сократить амплитуду движения, убрать поворот головы, поставить камеру дальше.
- Быстрые эффекты (вспышки, кольца, глитч, тряска, speed ramp) лучше делать в монтаже, а не просить у генератора — так контроль и синхрон со звуком точнее.
