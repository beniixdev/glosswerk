# GlossWerk wireframe

Ez a vázlat a weboldal fő tartalmi blokkjait mutatja. A cél egy egyszerű, könnyen átlátható és reszponzív oldal kialakítása volt.

## Főoldal – asztali nézet

```text
+----------------------------------------------------------+
| LOGÓ                 MENÜPONTOK          IDŐPONTFOGLALÁS |
+----------------------------------------------------------+
|                                                          |
|  FŐCÍM ÉS RÖVID LEÍRÁS              AUTÓS HÁTTÉRKÉP      |
|  [Időpontot kérek] [Szolgáltatások]                      |
|                                                          |
+----------------------------------------------------------+
|  ELŐNY 1             ELŐNY 2             ELŐNY 3         |
+----------------------------------------------------------+
|  SZOLGÁLTATÁSOK                                         |
|  [kártya] [kártya] [kártya] [kártya]                   |
+----------------------------------------------------------+
|  MŰHELY FOTÓJA                    RÓLUNK SZÖVEG           |
+----------------------------------------------------------+
|  FOGLALÁS MENETE                                        |
|  [1. lépés]       [2. lépés]       [3. lépés]           |
+----------------------------------------------------------+
|  ÜGYFÉLVÉLEMÉNYEK                                       |
|  [vélemény]       [vélemény]       [vélemény]            |
+----------------------------------------------------------+
|  FELHÍVÁS ÉS FOGLALÁS GOMB                               |
+----------------------------------------------------------+
|  LÁBLÉC                                                  |
+----------------------------------------------------------+
```

## Mobilnézet

Mobilon a fejlécben egy menügomb jelenik meg. A szolgáltatások, lépések és vélemények egymás alá kerülnek, így nem keletkezik vízszintes görgetés.

```text
+------------------------+
| LOGÓ          MENÜGOMB |
+------------------------+
| FŐCÍM                  |
| LEÍRÁS                 |
| [FOGLALÁS]             |
| [SZOLGÁLTATÁSOK]       |
+------------------------+
| ELŐNY 1                |
| ELŐNY 2                |
| ELŐNY 3                |
+------------------------+
| SZOLGÁLTATÁS KÁRTYA    |
| SZOLGÁLTATÁS KÁRTYA    |
| ...                    |
+------------------------+
| TOVÁBBI TARTALMAK      |
| EGYMÁS ALATT           |
+------------------------+
```

## Felhasznált CSS-megoldások

- Flexbox: navigáció, kiemelt előnyök, szolgáltatáskártyák és gombcsoportok.
- CSS Grid: rólunk szakasz, foglalási lépések, vélemények és az űrlap elrendezése.
- Transition: gombok, menüpontok és szolgáltatáskártyák visszajelzése.
- Animation: a főoldali szöveg egyszeri, rövid megjelenése.
- Media query: 900, 720 és 520 képpontos töréspontok.
- `prefers-reduced-motion`: az animációk kikapcsolása, ha a felhasználó ezt kéri.
