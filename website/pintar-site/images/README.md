# PINTAR website — nine images

Nine images, each with one job in the story: **understand what to teach next**.
They show the educational situation, not the software. These are generation
prompts for an image model. Generate each prompt on its own, at the largest
size available, in the orientation it names.

**Status of every image: AI-generated illustration.** On the website each one
is labelled «Ilustrasi, dibuat dengan AI / Illustration, AI-generated». They
must never be presented as photographs of real PINTAR users, schools or partner
institutions. Before publication, the owner decides whether to keep them or
replace them with licensed or commissioned photography (with consent).

## How to use them

1. Generate the image from its prompt. Regenerate if hands, faces or uniforms
   look wrong, if any text is legible, or if the colour looks saturated or glossy.
2. Save it as `P1.png`, `P2.png` … (the slot number below) in this folder.
3. Run `node images.mjs` and then `node build.mjs`. The page picks it up,
   with its label and alternative text.

| Slot | Image | Orientation | Where it appears | Shown as |
|---|---|---|---|---|
| P1 | In class | Landscape 3:2 | Home, under the hero | 2:1 on desktop, 4:5 on phones |
| P2 | Preparing tomorrow's lesson | Portrait 2:3 | Home · Capabilities; Who It's For · Educators | 4:5 |
| P3 | Studying at home | Portrait 2:3 | Who It's For · Learners | 4:5 |
| P4 | A leadership meeting | Landscape 3:2 | Who It's For · Leadership | 3:2 on desktop, 4:5 on phones |
| P5 | Morning at school | Landscape 3:2 | Home, a pause before Trust; Who It's For · The institution | 2:1 on desktop, 4:3 on phones |
| P6 | The administration office | Portrait 2:3 | Who It's For · Administrators | 4:5 |
| P7 | Where evidence begins | Landscape 3:2 | Why PINTAR · The problem | 2:1 on desktop, 4:3 on phones |
| P8 | Before the conversation (no people) | Landscape 3:2 | Contact | 3:2 |
| P9 | Records that last | Landscape 3:2 | Trust & Security | 2:1 on desktop, 4:3 on phones |

The share preview (`site/assets/img/share.jpg`, 1200 × 630) is a crop of P1, used when the build is given `--origin`.

The same photographic style closes every prompt, so the nine read as one series. No image shows a PINTAR team member or a product screen.

---

## P1 · In class (landscape 3:2)

> A documentary photograph inside an Indonesian state junior secondary school (SMP) classroom on a weekday morning. A female teacher in her early forties, wearing a modest batik blouse in muted brown and indigo and a soft dusty-blue hijab, kneels beside a shared wooden two-seat desk. Two learners of about thirteen sit at the desk in the standard SMP uniform: white short-sleeved shirts and navy-blue trousers or a long navy-blue skirt; one girl wears a white school hijab. They lean in together over a printed worksheet of fraction exercises with simple fraction-bar drawings. The teacher points with a pen to one answer, and the learners follow her finger, thinking. Behind them, slightly out of focus: pale green painted walls, louvred glass windows letting in soft morning light, a whiteboard, a ceiling fan, and other learners working quietly at their desks.
>
> Composition: eye level from desk height. Keep the teacher and both learners inside the central half of the frame, with their heads between a third and two-thirds of the image height, so the picture can be cropped to a wide 2:1 banner and to a 4:5 portrait. Leave calm space on both sides. Nobody looks at the camera.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/2, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: a quiet, unposed moment. Real skin texture and natural imperfections, a lived-in room. High resolution, sharp where focused, natural depth of field.
>
> Avoid: looking at the camera, smiling for the camera, posed or staged gestures; vivid or saturated colour, HDR, a glossy or plastic look, dramatic lighting, lens flare, heavy vignette; any legible text, numbers, logos or watermarks (the worksheet is too small or soft to read); distorted hands or extra fingers; a Western-style classroom.

## P2 · Preparing tomorrow's lesson (portrait 2:3)

> A documentary photograph in the teachers' room (ruang guru) of an Indonesian school in the late afternoon, after lessons have ended. A male teacher in his mid-thirties with short black hair, wearing a plain light-coloured batik shirt, sits at a long shared wooden table and writes by hand in a lined notebook, planning the next lesson. Beside him: a tall stack of learners' thin exercise books with plain brown and blue covers, an open laptop whose screen shows a softly glowing, indistinct page of simple horizontal bars (unreadable, no logos), a glass of tea on a saucer and a pencil case. The other desks are empty; chairs pushed in. Warm, low side light falls through a window across the table.
>
> Composition: a three-quarter view from slightly behind and to the side. His face is partly visible in profile, focused on the notebook. His writing hand and the notebook are the sharpest point. Keep him in the centre of the frame with room above and below, so the image can be cropped to 4:5. He does not look at the camera.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/2, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: a quiet, unposed moment. Real skin texture and natural imperfections, a lived-in room. High resolution, sharp where focused, natural depth of field.
>
> Avoid: looking at the camera, posed gestures; vivid or saturated colour, HDR, a glossy or plastic look, dramatic lighting, lens flare, heavy vignette; any legible text, numbers, logos or watermarks (the screen and the notebook are too soft to read); distorted hands or extra fingers; a corporate office.

## P3 · Studying at home (portrait 2:3)

> A documentary photograph of an Indonesian senior secondary learner, a girl of about sixteen, studying on the front terrace (teras) of a modest house in the late afternoon. She wears a simple long-sleeved T-shirt and a plain grey hijab, and sits at a low wooden table on the tiled terrace floor. She writes in an open notebook with a pencil; her phone lies face-up beside it, its screen dim and indistinct. Around her: potted plants (snake plants and a small frangipani), a terracotta-tiled floor, a painted wall with a little peeling paint, and a motor scooter partly visible, parked by the gate in the background. Soft, low, warm-neutral light from the side.
>
> Composition: profile or three-quarter view at her eye level. Her hands and the notebook are the sharpest point. Keep her in the centre of the frame with breathing room above and below, so the image can be cropped to 4:5. She does not look at the camera.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/2, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: a quiet, unposed moment. Real skin texture and natural imperfections, a lived-in home. High resolution, sharp where focused, natural depth of field.
>
> Avoid: looking at the camera, posing, a staged smile; vivid or saturated colour, golden-hour glow, HDR, a glossy or plastic look, lens flare, heavy vignette; any legible text, app interfaces, logos or watermarks; distorted hands or extra fingers; a luxury home.

## P4 · A leadership meeting (landscape 3:2)

> A documentary photograph in a modest meeting room of an Indonesian school during the day. The principal, a woman in her fifties wearing a batik blouse in muted green and brown and a cream hijab, and her deputy, a man in his forties with glasses and a plain long-sleeved shirt, sit side by side at a wooden table, discussing a printed A4 class summary that lies between them. She points with a pen to one part of the page; he listens, leaning in, considering it. On the table: a second printed page with simple bar charts, two glasses of tea, a closed folder. Behind them, out of focus: a glass cabinet with a few school trophies and framed certificates on a cream wall. Soft daylight from a window to one side.
>
> Composition: table height, a three-quarter view of both people. Keep both of them and the paper inside the central half of the frame, so the image can be cropped to 3:2 and to 4:5. Neither looks at the camera.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/2, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: a quiet, unposed moment. Real skin texture and natural imperfections, a lived-in room. High resolution, sharp where focused, natural depth of field.
>
> Avoid: looking at the camera, handshakes or posed business gestures; vivid or saturated colour, HDR, a glossy or plastic look, dramatic lighting, lens flare, heavy vignette; any legible text, numbers, names, logos, portraits of officials or watermarks; distorted hands or extra fingers; a corporate boardroom.

## P5 · Morning at school (landscape 3:2)

> A documentary photograph of an Indonesian state school courtyard early in the morning, before lessons begin, seen from the open corridor of the upper floor. A two-storey school building with long open corridors, cream walls, green-painted railings and a red-tiled roof frames a central courtyard. A flagpole with the red-and-white Indonesian flag stands in the courtyard beside a large, old shade tree. Small groups of learners in white-and-navy uniforms, carrying backpacks, walk across the courtyard towards their classrooms; seen from a distance and from above, so no face is recognisable. A light morning haze; low sun casting long, soft shadows across the swept ground.
>
> Composition: a high vantage point, wide. Keep the courtyard and the walking learners in the central band of the frame, so the image can be cropped to a wide 2:1 banner and to 4:3. Generous calm space; the building's lines are straight and level.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/4, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: a quiet, unposed moment. High resolution, sharp throughout.
>
> Avoid: recognisable faces, anyone looking at the camera; vivid or saturated colour, HDR, a glossy or plastic look, dramatic sunrise colours, lens flare, heavy vignette; any legible text, signs, banners, school names, logos or watermarks; crowds or a ceremony; a Western-style campus.

## P6 · The administration office (portrait 2:3)

> A documentary photograph in the administration office (ruang tata usaha) of an Indonesian school at the start of the school year, mid-morning. A school operator, a woman in her late twenties wearing a plain long-sleeved blouse in a muted olive colour and a dark green hijab, sits at a desk sorting a small stack of printed class cards into labelled envelopes, one class at a time. Beside her: a desktop computer with a dim, indistinct screen, a box of envelopes, a rubber stamp and ink pad, a printed class list held by a binder clip, a glass of water. Behind her, slightly out of focus: grey metal filing cabinets, ring binders on a shelf, a wall calendar, a louvred window with soft daylight.
>
> Composition: a three-quarter view at desk height. Her hands and the cards are the sharpest point; her face is in partial profile, concentrating. Keep her in the centre of the frame with room above and below, so the image can be cropped to 4:5. She does not look at the camera.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/2, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: a quiet, unposed moment. Real skin texture and natural imperfections, a lived-in office. High resolution, sharp where focused, natural depth of field.
>
> Avoid: looking at the camera, posing; vivid or saturated colour, HDR, a glossy or plastic look, dramatic lighting, lens flare, heavy vignette; any legible text, names, numbers, logos or watermarks (the cards, the list and the screen are too small or soft to read); distorted hands or extra fingers; a corporate office.

## P7 · Where evidence begins (landscape 3:2)

> A close documentary photograph of a learner's hands at a wooden school desk. A thirteen-year-old in a white school shirt (only the forearms and the edge of a sleeve are visible) works on a printed worksheet of fraction exercises with a pencil. In the margin, small handwritten working: drawn fraction bars and crossed-out attempts, showing how the learner is thinking. A worn eraser and a short pencil lie beside the sheet; the corner of a second worksheet and an open exercise book are visible. Soft morning light from a window to one side, gentle shadows of the louvres across the desk.
>
> Composition: a close, slightly high angle over the desk, the hands and the working in the centre third, shallow depth of field so the printed text falls out of focus. Leave calm space on both sides, so the image can be cropped to a wide 2:1 banner and to 4:5. No face in the frame.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/1.4, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational. Real skin texture, worn paper and wood. High resolution, sharp where focused.
>
> Avoid: legible text, letters or numbers anywhere (the worksheet and the working read as shapes, not words); a red-pen score or a grade on the paper; logos or watermarks; distorted hands or extra fingers; vivid or saturated colour, HDR, a glossy or plastic look, lens flare, heavy vignette.

## P8 · Before the conversation (landscape 3:2)

> A documentary photograph of a quiet meeting table in an Indonesian school's meeting room, a few minutes before a conversation begins. No people are in the frame. On the wooden table: an open laptop turned slightly away so its screen is not visible, a printed A4 report with simple, soft-coloured bar charts (unreadable), a notebook with a pen laid across it, two glasses of tea on glass saucers, and a small potted plant. Two wooden chairs are pulled out, as if two people have just stood up or are about to sit. Behind, out of focus: a window with louvres and soft daylight, a cream wall, a glass cabinet.
>
> Composition: table height, a gentle three-quarter angle across the table, the paper and the two glasses in the centre third. Leave calm space on both sides, so the image can be cropped to 3:2 and to 4:5.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/2, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: still and expectant. A lived-in room. High resolution, sharp where focused, natural depth of field.
>
> Avoid: people, faces or hands; a visible laptop screen or app interface; any legible text, numbers, logos, brand names or watermarks; a corporate boardroom; vivid or saturated colour, HDR, a glossy or plastic look, dramatic lighting, lens flare, heavy vignette.

## P9 · Records that last (landscape 3:2)

> A documentary photograph in the records room of an Indonesian school during the day. Tall wooden and grey metal shelves hold rows of ring binders and bound record books, their spines in muted blues, greens and browns, organised by year. A male teacher in his fifties with greying hair, wearing a plain batik shirt in muted tones, returns one binder to its place on a shelf, his hand on its spine. Soft daylight from a high louvred window falls across the shelves; dust visible in the light. A small wooden step stool and a closed cardboard archive box sit on the tiled floor.
>
> Composition: a three-quarter view from the end of the aisle, the shelves leading the eye towards him; he is in the centre third, seen in profile or from slightly behind. Keep generous calm space, so the image can be cropped to a wide 2:1 banner and to 4:3. He does not look at the camera.
>
> Photographic style: documentary photograph, shot on a Leica M11 rangefinder with a Summilux 35 mm f/1.4 lens at f/2.8, available natural light only. Muted, desaturated, true-to-life colour; soft contrast with a gentle highlight roll-off and slightly lifted blacks; fine natural grain, like Kodak Portra 400. Calm, cinematic and observational: a quiet, unposed moment. Real skin texture, worn paper and wood. High resolution, sharp where focused, natural depth of field.
>
> Avoid: looking at the camera, posing; any legible text, labels, years, names, logos or watermarks on the spines or shelves; padlocks, safes, servers or any security cliché; vivid or saturated colour, HDR, a glossy or plastic look, dramatic lighting, lens flare, heavy vignette; distorted hands or extra fingers.
