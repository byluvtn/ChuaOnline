# Ghi chÃº bÃ n giao

## Cháº¡y dá»± Ã¡n
- `npm install`
- `npm run dev` cháº¡y cáº£ API (cá»•ng 3001) vÃ  Vite (cá»•ng 5173).
- `npm run typecheck` kiá»ƒm tra kiá»ƒu. `npm run build` cho báº£n production.
- ThÆ° má»¥c `data` khÃ´ng náº±m trong repo, copy riÃªng náº¿u cáº§n dá»¯ liá»‡u cÅ©.

## Commit gáº§n nháº¥t: 605c05d (round 1 + round 2 merged)
Push lÃªn `origin/main` (byluvtn/ChuaOnline).

---

## Round 1 â€” tÆ°á»£ng, kiáº¿n trÃºc, há»“, trá»i, sÃ¢n, chá»¯ Viá»‡t (XONG)

### ÄÃ£ lÃ m
- **TÆ°á»£ng Pháº­t Tá»• & Quan Ã‚m dá»±ng láº¡i báº±ng primitive** (`src/statues.ts`):
  MeshStandardMaterial, roughness 0.4â€“0.7, castShadow + receiveShadow. `buddhaGroup` /
  `guanyinGroup` (buildBuddha / buildQuanAm, giá»¯ export + tÃªn `halo` + `userData.glow`).
  Buddha: lotus base (Cylinder 24seg #d4a373), 12 cÃ¡nh sen scale (0.28,0.45,0.14) #f4978e,
  chÃ¢n kiáº¿t giÃ , cÃ  sa TubeGeometry #e0a93b roughness 0.3 / metalness 0.4, Dhyana Mudra,
  Ä‘áº§u + Ushnisha + bÃºi tÃ³c + háº¡t ngá»c, tai dáº¹t dÃ i, halo Torus (R 1.3, á»‘ng 0.08, emissive #ffb703)
  8 ngá»n lá»­a, máº·t CanvasTexture. Quan Ã‚m: Ã¡o tráº¯ng Cylinder 0.35â†’0.85, dáº£i lá»¥a TubeGeometry
  CatmullRom (chá»¯ U sau lÆ°ng), tay pháº£i cáº§m liá»…u #70e000, tay trÃ¡i bÃ¬nh cam lá»™ LatheGeometry
  #e0a93b, khÄƒn trÃ¹m Ä‘áº§u, mÅ© miá»‡n vÃ ng + tÆ°á»£ng Pháº­t nhá». KÃ­ch thÆ°á»›c nhÃ¢n vá»›i FIG_SCALE Ä‘á»ƒ giá»¯
  "dáº¥u chÃ¢n" cÅ© trong sÃ¢n.
- **Há»“ cÃ¡ vá» giá»¯a khuÃ´n viÃªn**: `LAKE = {x:0, z:22, a:9, b:6.5}`, cáº§u cong cháº¡y Báº¯câ€“Nam
  (`BRIDGE = {x:0, z0:14.2, z1:29.8, hw:1.15, peak:1.4}`), `bridgeY`/`inLake`/`resolveWater`/
  `blocked` viáº¿t láº¡i theo trá»¥c z. Quáº£ng trÆ°á»ng thu gá»n r8.4 táº¡i (0,6).
- **Sá»­a kiáº¿n trÃºc** (`src/compound.ts::sealArchitectureJoints`): bÃ¹ dougong/há»™p tiáº¿p xÃºc giá»¯a
  cá»™tâ€“kÃ¨oâ€“mÃ¡i (maxGap ~0.32â€“1.4), Ä‘áº·t fascia ring dÆ°á»›i mÃ¡i. Gá»i á»Ÿ corridor, towers, hall, gate, pagoda.
- **Báº§u trá»i xanh yÃªn bÃ¬nh** (`world.ts::MOODS` + `sereneSky`): vo-luong `#dcefff`/`#5aa7e0`,
  tu-bi `#e7f2ff`/`#4f9bd8`, an-lac hoÃ ng hÃ´n tÃ­m nháº¡t. Háº¿t tÃ´ng bÃ£o cÃ¡t sa máº¡c.
- **Máº·t sÃ¢n sáº¡ch** (`paveCompound`): gá»¡ háº¿t bá»¥i cá» khá»‘i cá»©ng, lÃ¡t gáº¡ch pháº³ng + quáº£ng trÆ°á»ng trÃ²n
  + lawn pháº³ng quanh há»“; Ä‘Ã i sen to cá»§a tÆ°á»£ng váº«n giá»¯.
- **Cá»™t chá»¯ Viá»‡t**: `vietnameseColumnTexture` + `vietnamesePlaqueTexture` thay chá»¯ HÃ¡n; cÃ¢u Ä‘á»‘i 2 cá»™t
  tiá»n Ä‘Æ°á»ng lÃ  tiáº¿ng Viá»‡t ("Cá»­a thiá»n rá»™ng má»Ÿ...", "LÃ²ng tá»‹nh an nhiÃªn..."), hoÃ nh phi Äáº I HÃ™NG Báº¢O
  ÄIá»†N / PHáº¬T NHáº¬T TÄ‚NG HUY, báº£ng chuÃ´ng/trá»‘ng Quan Ã‚m/tam quan cÅ©ng Ä‘á»•i. `relabelColumns()` quÃ©t
  `userData.inscription`.
- **Face + glow dÃ¹ng chung material/geometry cache** trong statues.ts Ä‘á»ƒ clone tÆ°á»£ng trong chÃ¡nh Ä‘iá»‡n khÃ´ng náº·ng.

### ChÆ°a xong / cáº§n kiá»ƒm tra láº¡i
1. **Tá»· lá»‡ tÆ°á»£ng Quan Ã‚m**: Ã¡o tráº¯ng vá» chÃ³p Ä‘á»c nhÆ° "chuÃ´ng Ãºp" khi vÃ o thÃ¡p (Ä‘Ã£ tháº¥y qua áº£nh
   `shots/chibi-guanyin.png` vÃ  `chibi-quanam-face.png`). Cáº§n thu háº¹p vá» Ã¡o dÆ°á»›i + loe khÄƒn trÃ¹m.
2. **Tay Pháº­t bá»‹ nÃ©n vÃ o thÃ¢n** á»Ÿ gÃ³c chÃ­nh diá»‡n chÃ¡nh Ä‘iá»‡n; ngá»±c cÃ  sa gáº§n nhÆ° khÃ´ng tháº¥y vÃ¬
   vá» Ã¡o mÃ u vÃ ng bá»c kÃ­n thÃ¢n â€” muá»‘n giá»‘ng áº£nh máº«u thÃ¬ bá» shell phÃ­a trÆ°á»›c hoáº·c há»Ÿ ngá»±c pháº£i rÃµ hÆ¡n.
3. **Cáº£nh bÃ¡o "khe kiáº¿n trÃºc cÃ²n láº¡i"**: sau khi siáº¿t logic ká», hall cÃ²n ~28 khe lá»›n (>0.9m) cáº§n
   chá»‰nh tay; sealArchitectureJoints Æ°u tiÃªn khe má»™t trá»¥c, cáº·p chÃ©o gÃ³c bá» qua.
4. **TÆ°á»£ng khÃ´ng kiá»ƒm thá»­ runtime Ä‘á»§ gÃ³c** â€” chá»‰ dÃ¹ng `steps-chibi.mjs`/`steps-statues.mjs` chá»¥p headless.
   ChÆ°a verify khi 5 tÆ°á»£ng trong chÃ¡nh Ä‘iá»‡n cÃ¹ng hiá»ƒn thá»‹ (clone `buddhaGroup` cÃ³ thá»ƒ lá»‡ch glow).
5. **CÃ¡ koi bÆ¡i vÃ o trong há»“ to**: ellipse rx/rz dá»±a trÃªn `LAKE.a/b` má»›i, nhÆ°ng bÃ¡n kÃ­nh lotus/pad chÆ°a
   Ä‘iá»u chá»‰nh theo há»“ lá»›n â€” cáº§n kiá»ƒm tra cÃ¡ khÃ´ng bÆ¡i xuyÃªn lÃ¡ sen khi há»“ Ä‘Ã£ dá»i.

---

## Round 2 â€” cÃ¡ koi, bá»“ Ä‘oÃ n, láº¡y Pháº­t, tá»¥ng kinh, nhiá»‡m vá»¥, shop (XONG vá» code)

### ÄÃ£ lÃ m
- **CÃ¡ koi váº½ láº¡i** (`src/koi.ts`): má»—i con lÃ  Group â€” thÃ¢n chÃ©p sphere kÃ©o dÃ i + Ä‘áº§u trÃ²n, máº¯t Ä‘en,
  rÃ¢u, vÃ¢y lÆ°ng má»ng, 2 vÃ¢y ngá»±c, vÃ¢y Ä‘uÃ´i xÃ²e váº«y trong `update()` (`rotation.y = sin(t*6.5+pha)*0.45`).
  4 máº«u CanvasTexture: Kohaku, Yamabuki, Shiro Utsuri, Hi. 9 con, giá»¯ ellipse + sign(s) hÆ°á»›ng nhÆ° cÅ©.
- **Bá»“ Ä‘oÃ n rá»™ng +30%**: cylinder r 0.44â†’0.49, chiáº¿u 1.43Ã—1.36, bÆ°á»›c hÃ ng 1.9 / bÆ°á»›c cá»™t 1.7 â†’
  7Ã—7Ã—2 = 98 chá»—. 8 cÃ¡nh sen InstancedMesh quanh má»—i bá»“ Ä‘oÃ n (há»“ng/tráº¯ng xen káº½, ngá»­a 0.55 rad).
- **Láº¡y Pháº­t tá»± cháº¡y tá»›i bá»“ Ä‘oÃ n** (`src/main.ts::startBow` + `nearestFreeSeat`): báº¥m "Láº¡y Pháº­t" â†’
  tÃ¬m bá»“ Ä‘oÃ n trá»‘ng gáº§n nháº¥t toÃ n sÃ¢n (bá» giá»›i háº¡n 3.2m), set `clickTarget`, nhÃ¢n váº­t tá»± Ä‘i bá»™ tá»›i,
  tá»›i nÆ¡i (<0.5m) â†’ `setSitting(true)` rá»“i láº¡y. Tá»± báº¥m di chuyá»ƒn giá»¯a Ä‘Æ°á»ng huá»· hÃ nh trÃ¬nh.
- **Cá»­a sá»• tá»¥ng kinh** (`src/panels.ts::renderChant`, `shared/game.ts::SUTRAS`): nÃºt "Tá»¥ng kinh"
  má»Ÿ panel (PanelKind `'chant'`), chá»n BÃ¡t NhÃ£ TÃ¢m Kinh / ChÃº Äáº¡i Bi / Niá»‡m Pháº­t A Di ÄÃ  (108 láº§n),
  cháº¿ Ä‘á»™ Ä‘á»c karaoke (line highlight + scrollIntoView), tá»± gÃµ mÃµ theo nhá»‹p (nÃºt báº­t/táº¯t + slider
  40â€“120/phÃºt, máº·c Ä‘á»‹nh 60). HoÃ n thÃ nh 1 biáº¿n â†’ `socket.emit('sutra:done', id)` â†’ server cá»™ng theo
  `ACTION_RULES.chant` (há»— trá»£ boost `nen_sap_ong`, `trang_hat`).
- **Nhiá»‡m vá»¥ má»Ÿ rá»™ng** (`shared/game.ts`, `server/`):
  - 14 nhiá»‡m vá»¥ ngÃ y (láº¡y 5 vÃ  10, tháº¯p hÆ°Æ¡ng 3 vÃ  5, tá»¥ng 2, Ä‘Ã¨n 1 vÃ  3, chat 3 vÃ  5, thiá»n 2 vÃ  5 phÃºt,
    tá»¥ng 1 bÃ i, mua 1 mÃ³n, viáº¿ng 3 chÃ¹a, tÃ­ch cÃ´ng Ä‘á»©c) + 3 nhiá»‡m vá»¥ tuáº§n (`w_merit100`, `w_bow50`,
    `w_sutra10`, id prefix `w_`).
  - `questKey()` dÃ¹ng `day_key` cho ngÃ y vÃ  `week_key` (ISO tuáº§n) cho tuáº§n â€” khÃ´ng Ä‘á»•i schema.
  - Nhiá»‡m vá»¥ tuáº§n reset thá»© Hai (UTC). ThÆ°á»Ÿng lá»›n hÆ¡n daily.
  - ThÆ°á»Ÿng má»‘c cáº¥p: `LEVEL_BONUS = { coinsPerLevel: 10, meritPerLevel: 5 }`, server tá»± cá»™ng + emit
    `level:bonus` khi `levelOf(after) > levelOf(before)`, lÆ°u báº£ng `level_rewards`.
  - Thanh tiáº¿n Ä‘á»™ cáº¥p trong cá»­a sá»• Nhiá»‡m vá»¥ (cáº¥p hiá»‡n táº¡i + cÃ²n bao nhiÃªu cÃ´ng Ä‘á»©c lÃªn cáº¥p).
- **Shop má»Ÿ rá»™ng** (`shared/game.ts::ITEMS`, `SHOP_CATEGORIES`, `panels.ts::renderShop`):
  22 mÃ³n trong 11 tab (Lá»… váº­t, CÃ¢y Pháº­t, Ão trÃ ng, TrÃ ng háº¡t, Bá»“ Ä‘oÃ n, MÅ©, PhÃ¡p khÃ­, MÃ¢y,
  Linh thÃº, Diá»u, Äá»“ linh thÃº). `category`, `minLevel`, `boostMerit`. "Mua 5 Â· giÃ¡" cho consumable.
  KhÃ³a theo cáº¥p (`minLevel` thiáº¿u thÃ¬ `ðŸ”’ Cáº§n cáº¥p X`). Giá»¯ nguyÃªn `shop:buy`, `inv:equip`, `renderBag`.
  KhÃ´ng thÃªm tiá»n tá»‡ má»›i â€” chá»‰ Sen.

### ChÆ°a xong / chÆ°a kiá»ƒm chá»©ng
1. **`startBow` chÆ°a test runtime**: chá»‰ typecheck; chÆ°a chá»¥p video nhÃ¢n váº­t cháº¡y tá»›i bá»“ Ä‘oÃ n rá»“i láº¡y.
   TrÆ°á»ng há»£p `sitting` sáºµn â†’ láº¡y `doAction('bow')` táº¡i chá»—; chÆ°a thá»­ khi Ä‘ang ngá»“i rá»“i báº¥m Láº¡y.
2. **Tá»¥ng kinh unfinished edge case**: Ä‘Ã³ng panel giá»¯a chá»«ng â†’ `cleanup` stops timer/moh (ok),
   nhÆ°ng `myActionUntil` / `me.anim = 'chant'` khÃ´ng reset vÃ¬ client khÃ´ng gá»­i `chant` ná»¯a â€”
   nhÃ¢n váº­t giá»¯ pose cháº¯p tay cho Ä‘áº¿n khi `myActionUntil` háº¿t (2.5s, ok).
3. **`level:bonus` chÆ°a chá»¥p UI**: chá»‰ toast, chÆ°a cÃ³ panel hiá»ƒn thá»‹ lá»‹ch sá»­ má»‘c cáº¥p.
4. **Boost items chÆ°a rÃ  trong `character.ts`**: `nen_sap_ong`, `trang_hat` cá»™ng cÃ´ng Ä‘á»©c nhÆ°ng
   khÃ´ng cÃ³ visual gáº¯n trÃªn nhÃ¢n váº­t (chá»‰ `mu_sen`, `hao_quang`, `khan_do`, `ao_trang` lÃ  accessory cÃ³ model).
5. **Shop chÆ°a test Ä‘áº§y Ä‘á»§ 11 tab** â€” chá»‰ chá»¥p tab Lá»… váº­t; cÃ¡c mÃ³n `minLevel` chÆ°a thá»­ vá»›i profile cáº¥p tháº¥p.
6. **`tools/steps-round2.mjs`** lÃ  script chá»¥p headless ad-hoc, khÃ´ng vÃ o CI; cáº§n copy flag `STEPS=` khi dÃ¹ng.
7. **Anh em giá»¯a chÃ¡nh Ä‘iá»‡n chÆ°a khá»›p vá»›i há»“ má»›i**: vá»‹ trÃ­ Ä‘Ã i sen tÆ°á»£ng Quan Ã‚m trong thÃ¡p +
   tÆ°á»£ng Pháº­t sÃ¢n TÃ¢y (BUDDHA_YARD) váº«n giá»¯ toáº¡ Ä‘á»™ cÅ©, chÆ°a verify cÃ³ bá»‹ há»“ má»›i che khi nhÃ¬n tá»« lá»‘i vÃ o.
8. `hoanhPhiTexture` / `coupletTexture` váº«n cÃ²n export trong textures.ts (khÃ´ng dÃ¹ng ná»¯a, Ä‘á»ƒ láº¡i
   cho caller khÃ¡c náº¿u cáº§n; náº¿u muá»‘n sáº¡ch, xoÃ¡ sau).

---

## GÄ1 GÃ³i 1 â€” GÃ¡c Trá»‘ng (commit b3ee146)

### ÄÃ£ lÃ m
- `layout.ts`: `DRUM = {x:34, z:-6}` + vÃ²ng cáº¥m `blocked()` r7.
- `temple.ts`: `COLUMN_LABELS.trong`; `tower()` dÃ¹ng Ä‘Ãºng cáº·p báº£ng theo `coupletId` (thÃ¡p chuÃ´ng váº«n dÃ¹ng `chuong`); dá»±ng `drumTower` (trá»‘ng trá»¥ náº±m ngang R0.85 dÃ i 1.1, 2 máº·t da bÃ², vÃ nh vÃ ng + 16 Ä‘inh tÃ¡n/máº·t, chÃ¢n gá»— + Ä‘áº¿), glowSpr, zone `trong` r7, 3 `pathRect` lÃ¡t Ä‘Ã¡, `ringDrum()` (drumHit decay, rung/náº£y ~0.4s trong `update()`). `tower()` nay log `gapdump tower <sign>` á»Ÿ DEV.
- `couplets.ts`: `COUPLETS.trong`. `world.ts`: phÆ¡i `ringDrum`. `main.ts`: timer tá»± gÃµ trá»‘ng má»—i 45s (`lastDrum`, lá»‡ch pha 22s so vá»›i chuÃ´ng).
- `tools/steps-drum.mjs`, `tools/steps-drum-walk.mjs`: script chá»¥p + Ä‘i thá»­.

### Káº¿t quáº£ kiá»ƒm chá»©ng
- `npm run typecheck`: pass (sau khi sá»­a trÃ¹ng tÃªn biáº¿n `dt`).
- gapdump: THÃP CHUÃ”NG filled=5 remaining=0; THÃP TRá»NG filled=5 remaining=0.
- Äi thá»­ nhÃ¢n váº­t tháº­t (Ä‘áº·t vá»‹ trÃ­ rá»“i giá»¯ phÃ­m): tá»« (30,-6) giá»¯ D 1.5s chá»‰ tá»›i x=30.19 (bá»‹ cháº·n); tá»« (34,-2.5) giá»¯ W dá»«ng á»Ÿ z=-2.69; zone `trong` + popup cÃ¢u Ä‘á»‘i hiá»‡n Ä‘Ãºng.

### ChÆ°a cháº¯c cháº¯n / lÆ°u Ã½
- `main.ts:769` KHÃ”NG pháº£i tÆ°Æ¡ng tÃ¡c á»Ÿ khu chuÃ´ng mÃ  lÃ  timer 45s tá»± Ä‘á»™ng; Ä‘Ã£ nhÃ¢n báº£n Ä‘Ãºng kiá»ƒu Ä‘Ã³ cho trá»‘ng. ChÆ°a cÃ³ tÆ°Æ¡ng tÃ¡c chá»§ Ä‘á»™ng gÃµ trá»‘ng/chuÃ´ng.
- áº¢nh `drum-walk-couplet.png` vÃ  cÃ¡c áº£nh walk chá»¥p khi camera chÆ°a bÃ¡m nhÃ¢n váº­t (freeze) nÃªn khÃ´ng pháº£i gÃ³c nhÃ¬n thÃ¡p trá»‘ng; áº£nh nghiá»‡m thu Ä‘Ãºng spec lÃ  `drum-plaza-both.png` (chuÃ´ng + trá»‘ng má»™t khung) vÃ  `drum-front.png` (cáº­n cáº£nh).
- ChÆ°a kiá»ƒm chá»©ng riÃªng báº±ng áº£nh hiá»‡u á»©ng `ringDrum` (cÃ³ `drum-hit.png` nhÆ°ng chá»¥p 150ms sau khi gá»i, rung biÃªn Ä‘á»™ nhá»).

---

## GÄ1 â€” Thá»‘ng nháº¥t kiáº¿n trÃºc thÃ¡p chuÃ´ng/trá»‘ng

### ÄÃ£ lÃ m
- `temple.ts` `tower()` viáº¿t láº¡i theo chuá»—i chuáº©n: bá»‡ Ä‘Ã¡ 2 táº§ng â†’ chÃ¢n cá»™t Ä‘Ã¡ â†’ cá»™t Ä‘á» â†’ xÃ  dÆ°á»›i/trÃªn â†’ Ä‘áº¥u cá»§ng â†’ vÃ nh xÃ  â†’ mÃ¡i 1 (ngá»“i sÃ¡t vÃ nh xÃ ) â†’ cá»• mÃ¡i 4 cá»™t + tÆ°á»ng Ä‘á» ná»­a chiá»u cao â†’ mÃ¡i 2 â†’ Ä‘áº¿ chÃ³p + chÃ³p vÃ ng. Chuáº©n Ä‘Æ°á»£c ghi trong comment Ä‘áº§u `tower()`.
- ChuÃ´ng háº¡ trá»¥c treo cÃ²n `by+3.55` Ä‘á»ƒ náº±m dÆ°á»›i xÃ .
- `tools/steps-tower-unify.mjs`, `tools/steps-tower-probe.mjs`: script chá»¥p.

### Kiá»ƒm chá»©ng
- typecheck pass. gapdump: THÃP CHUÃ”NG filled=74 remaining=0; THÃP TRá»NG filled=74 remaining=0.
- Probe: miáº¿ng bÃ¹ quanh thÃ¡p trá»‘ng Ä‘á»u lÃ  dáº§m nhá» trong khung thÃ¡p. Khá»‘i mÃ¡i "thá»«a" sau thÃ¡p trá»‘ng lÃ  báº£o thÃ¡p (38,-14), khÃ´ng pháº£i lá»—i.

### ChÆ°a cháº¯c cháº¯n
- ChÆ°a Ã¡p chuáº©n cho thÃ¡p Quan Ã‚m (`qa`) vÃ  báº£o thÃ¡p: khÃ¡c kiá»ƒu (Ä‘Ã i 4 cá»™t má»Ÿ cÃ³ tÆ°á»£ng; thÃ¡p 5 táº§ng), cáº§n quyáº¿t Ä‘á»‹nh riÃªng.
- ChÃ³p vÃ ng nhÃ¬n tá»« xa hÆ¡i lá»‡ch tÃ´ng vá»›i thÃ¢n Ä‘á»; chÆ°a chá»‰nh.
- Trá»‘ng: pivot `by+1.7`, glow `by+3.2` chÆ°a chá»¥p láº¡i sÃ¡t khung má»›i.

---

## Cháº¡y / chá»¥p kiá»ƒm tra
- `STEPS=./steps-chibi.mjs` hoáº·c `steps-round2.mjs` vá»›i `node tools/shot.mjs <prefix> http://localhost:5173/ 1280 800`.
  CÃ¡c steps tá»± báº­t `window.__co.freeze = true` Ä‘á»ƒ khoÃ¡ camera.
- Tá»‘t nháº¥t chá»¥p sau `npm run dev` + chá» Vite sáºµn sÃ ng (hiá»‡n dev server cÃ³ thá»ƒ Ä‘Ã£ táº¯t khi phiÃªn nÃ y káº¿t thÃºc).
- `shots/` Ä‘Ã£ track trong repo; round 2 chá»¥p gá»“m `round2-*.png`.

## Sau khi push
- Commit `605c05d`. Náº¿u cáº§n sá»­a tiáº¿p: Æ°u tiÃªn (1) runtime verify `startBow` báº±ng cÃ¡ch má»Ÿ chÃ¹a tháº­t,
  (2) thu háº¹p Ã¡o Quan Ã‚m trong thÃ¡p, (3) tinh chá»‰nh khe kiáº¿n trÃºc cÃ²n láº¡i, (4) cÃ¢n nháº¯c bá» export
  `hoanhPhiTexture`/`coupletTexture` khÃ´ng dÃ¹ng.
---

## GÄ1 GÃ³i 5 â€” Thá»§y ÄÃ¬nh (commit 873bf47)

### ÄÃ£ lÃ m
- `layout.ts`: `PIER {x0:-10.6,x1:-4.4,z:23,hw:1.6,y:0.55}`, `PIER_RAMP` 1.3 (Ä‘oáº¡n dá»‘c á»Ÿ Ä‘áº§u bá», trÃ¡nh nhÃ¢n váº­t nháº£y báº­c), `PIER_FLOOR` (sÃ n Ä‘Ã¬nh, y 0.77). `groundY()` nÃ¢ng theo cáº§u gá»— + sÃ n Ä‘Ã¬nh; `resolveWater()` bá» qua hÃ¬nh chá»¯ nháº­t PIER (ná»›i 0.2).
- `temple.ts`: nhÃ³m `thuy-dinh`: cáº§u gá»— cÃ³ dá»‘c + cá»c chÃ¬m, sÃ n Ä‘Ã¡, 4 cá»™t Ä‘á», mÃ¡i `roofGeometry(5.8,5,1.6,0.6)` + chÃ³p vÃ ng, báº£ng `THá»¦Y ÄÃŒNH` quay ÄÃ´ng, Ä‘Ã¨n lá»“ng, lan can 3 phÃ­a (Báº¯c, Nam, ÄÃ´ng; há»Ÿ phÃ­a TÃ¢y Ä‘á»ƒ vÃ o), 3 chá»— ngá»“i (ÄÃ´ng/Báº¯c/Nam), collider 4 cá»™t + lan can, zone `thuyDinh` r4.5. Bá» Ä‘Ã¡ bá» há»“ náº±m trÃªn Ä‘Æ°á»ng cáº§u.
- `couplets.ts`: `thuyDinh`. `Seat` thÃªm cá» `rest`; `main.ts::nearestFreeSeat` bá» qua gháº¿ `rest` khi báº¥m Láº¡y Pháº­t (khÃ´ng kÃ©o ngÆ°á»i chÆ¡i ra giá»¯a há»“), nhÆ°ng nÃºt Thiá»n (limit 3.2m) váº«n ngá»“i Ä‘Æ°á»£c.
- `main.ts` dev hook `__co.walkTo(x,z)`; `tools/steps-thuydinh*.mjs`.

### Kiá»ƒm chá»©ng
- typecheck pass; gapdump thuyDinh filled=5 remaining=0.
- Äi thá»­ tháº­t: bá» TÃ¢y â†’ lÃªn dá»‘c â†’ sÃ n Ä‘Ã¬nh y=0.77 â†’ ngá»“i Ä‘Æ°á»£c (ry 0); lan can cháº·n á»Ÿ xâ‰ˆ-4.95, zâ‰ˆ21.75 vÃ  24.25; (-5,19.5) bá»‹ Ä‘áº©y ra bá» nhÆ° cÅ©; cáº§u trá»¥c Ä‘i tá»›i Ä‘á»‰nh y=1.52.
- Äáº§u cáº§u gá»— (x0=-10.6) khÃ´ng Ä‘Ã¨ bá»“n hoa (áº£nh b3), khÃ´ng pháº£i dá»‹ch PIER xuá»‘ng 24.2.

### ChÆ°a lÃ m / chÆ°a cháº¯c cháº¯n
- Má»¥c má»Ÿ rá»™ng 4 (tháº£ Ä‘Ã¨n khi vÃ o zone `thuyDinh`): khÃ´ng lÃ m. `main.ts` chá»‰ tháº£ Ä‘Ã¨n qua nÃºt "Tháº£ Ä‘Ã¨n nguyá»‡n" (modal Ä‘iá»u Æ°á»›c, `doAction('lantern', wish)`), khÃ´ng cÃ³ Ä‘iá»ƒm gá»i theo zone.
- Cáº£nh bÃ¡o cÅ© trong spec: nhÃ¢n váº­t Ä‘i bá»™ tá»›i gháº¿ báº±ng ngá»“i/Thiá»n, chÆ°a cÃ³ hÃ nh Ä‘á»™ng "ngá»“i gháº¿ Ä‘Ã¬nh" riÃªng.

---

## GÄ1 GÃ³i 6 â€” TÆ°á»£ng La HÃ¡n dá»c hai hÃ nh lang

### ÄÃ£ lÃ m
- `statues.ts`: `buildArhat(variant 0|1|2)`: thÃ¢n lathe bo trÃ²n + Ã¡o trÃ ng 3 mÃ u tráº§m (vÃ ng Ä‘áº¥t, xÃ¡m lam, nÃ¢u), Ä‘áº§u trá»c dÃ¹ng láº¡i `buildHead` + `faceTexture` (máº¯t cong nháº¯m, khÃ´ng táº¡c há»‘c máº¯t/sá»‘ng mÅ©i), 3 tÆ° tháº¿ tay: Ä‘á»ƒ trong lÃ²ng / má»™t tay nÃ¢ng / Ã´m bÃ¡t. Cao ~1.15 khi ngá»“i.
- `temple.ts`: 20 tÆ°á»£ng (10/bÃªn) trÃªn bá»‡ Ä‘Ã¡ 0.8Ã—0.55Ã—0.8, z = -17.5 + 1.8k (k=0..9), quay máº·t vÃ o trá»¥c, collider r0.42.

### Vá»‹ trÃ­ (Ä‘Ã£ tÃ­nh láº¡i, spec cÅ© lá»‡ch)
- Spec ghi "z so le 0.9 so vá»›i cá»™t", nhÆ°ng bÆ°á»›c 1.82 tá»« -18.2 lÃ m cá»™t (z = -18.4 + 3.6j) trÃ¹ng tÆ°á»£ng á»Ÿ k cháºµn. DÃ¹ng z = -17.5 + 1.8k thÃ¬ má»i tÆ°á»£ng cÃ¡ch cá»™t Ä‘Ãºng 0.9.
- Gháº¿ dÃ i (hÃ ng trong, z = -16.6, -9.4, -2.2) trÃ¹ng slot k=1, 5, 9 â†’ cÃ¡c slot Ä‘Ã³ vÃ  k=0, 4, 8 á»Ÿ hÃ ng ngoÃ i (+sideÃ—1.5); k=2,3,6,7 á»Ÿ hÃ ng trong (-sideÃ—1.5). KhÃ´ng cáº§n dá»‹ch Â±0.3.

### Kiá»ƒm chá»©ng
- typecheck pass; gapdump arhats filled=0 remaining=0.
- Äi thá»­ tháº­t dá»c tÃ¢m lá»‘i Ä‘i (x=Â±20.5) tá»« z=-0.4 tá»›i -18.5 á»Ÿ cáº£ hai hÃ nh lang, khÃ´ng káº¹t.
- áº¢nh trong `shots/arhat-*.png`.

### ChÆ°a cháº¯c cháº¯n
- TÆ°á»£ng á»Ÿ hÃ ng trong cÃ¡ch gháº¿ dÃ i ~0.4 vá» ngang (gháº¿ lá»‡ch 1.3, tÆ°á»£ng lá»‡ch 1.5); chá»‰ so le vá» z, nhÃ¬n gáº§n hÆ¡i sÃ¡t.
- 3 máº«u tÆ°á»£ng clone dÃ¹ng chung geometry/material; chÆ°a Ä‘o hiá»‡u nÄƒng trÃªn mÃ¡y yáº¿u (20 bá»‡ + 20 tÆ°á»£ng).
---

## GÄ3 Má»¥c 21 â€” TÄƒng xÃ¡ + Trai Ä‘Æ°á»ng dá»c tÆ°á»ng TÃ¢y (commit `aa97684`; code Quan Ã‚m + gá»™p mesh á»Ÿ `0dfbf6d`)

Má»¥c 22 (Äiá»‡n Máº«u), 23 (NhÃ  khÃ¡ch), 24 (Thiá»n Ä‘Æ°á»ng) Ä‘Ã£ cÃ³ tá»« commit `d25a7e4`.

### ÄÃ£ lÃ m
- `layout.ts`: `TANG_XA_TAY (âˆ’42.6, âˆ’14.5)`, `TRAI_DUONG (âˆ’42.6, âˆ’1)` (+ `_PLAT`, `_DOOR`). `*_DOOR` lÃ  Ä‘iá»ƒm trá»‘ng trÆ°á»›c cá»­a (x = âˆ’39.0) Ä‘á»ƒ gáº¯n NPC/shop sau. `groundY()` nÃ¢ng bá»‡ 0.2; `blocked()` thÃªm dáº£i x < âˆ’37.5 (z âˆ’21.5..3.5) vÃ  hai hÃ nh lang chá»«a cho lá»‘i cá»­a.
- `temple.ts::longHouse()`: nhÃ  dÃ i tháº¥p (Ä‘á»‰nh mÃ¡i ~6.2), trá»¥c dÃ i Báº¯câ€“Nam, hiÃªn 6 cá»™t Ä‘á» + cá»­a sá»•, Ä‘Ã¨n lá»“ng, báº£ng tÃªn + 2 cÃ¢u Ä‘á»‘i tiáº¿ng Viá»‡t. Trai Ä‘Æ°á»ng cÃ³ thÃªm á»‘ng khÃ³i vÃ  bÃ n báº¿p. Collider cá»™t, tÆ°á»ng háº­u, hai há»“i, tÆ°á»ng trÆ°á»›c (chá»«a cá»­a giá»¯a). Zone `tangXaTay`, `traiDuong` r7. `pathRect` ná»‘i tá»« hiÃªn ra Ä‘Æ°á»ng dá»c x = âˆ’28.
- `couplets.ts`: `tangXaTay`, `traiDuong`.
- `compound.ts`: VÆ°á»n Thiá»n bá» bá»¥i tre x = âˆ’44 vá»›i z > âˆ’23 vÃ  hÃ ng rÃ o Nam vá»›i x < âˆ’38 Ä‘á»ƒ nhÆ°á»ng chá»—.

### Kiá»ƒm chá»©ng
- typecheck pass. gapdump: tang-xa-tay filled=167 remaining=0; trai-duong filled=187 remaining=0.
- Äi thá»­ tháº­t: vÃ o cá»­a giá»¯a tá»›i x=âˆ’42.4 (z âˆ’14.5), tá»›i x=âˆ’41.8 (z âˆ’1). Ra ngoÃ i cá»­a, tÆ°á»ng cháº·n á»Ÿ xâ‰ˆâˆ’41.4/âˆ’41.1. Zone popup TÄƒng xÃ¡ hiá»‡n Ä‘Ãºng.
- áº¢nh: `shots/gd3-21-*.png`, `gd3-21a-*.png` (4 hÆ°á»›ng + trá»¥c), `gd3-21p-tangxa-inside.png`. Script: `tools/steps-tangxa*.mjs`, `steps-phan-a.mjs`.

### ChÆ°a cháº¯c cháº¯n
- Ná»™i tháº¥t má»›i lÃ  khá»‘i Ä‘Æ¡n giáº£n (bá»‡ gá»—, bÃ n báº¿p); chÆ°a cÃ³ bÃ n gháº¿/bá»“ Ä‘oÃ n riÃªng.
- Biá»ƒn "TÄ‚NG XÃ" cá»§a nhÃ  TÃ¢y trÃ¹ng chá»¯ vá»›i tÄƒng xÃ¡ phÃ­a Báº¯c `TANG_XA` (22, âˆ’56). TÃªn biáº¿n `TANG_XA_TAY`/`tangXaTay` trÃ¡nh trÃ¹ng; chá»¯ trÃªn biá»ƒn chÆ°a Ä‘á»•i.
- Vá»‹ trÃ­ lá»‡ch masterplan (âˆ’40, âˆ’16) thÃ nh (âˆ’42.6, âˆ’14.5) Ä‘á»ƒ trÃ¡nh hÃ ng rÃ o vÃ  tre VÆ°á»n Thiá»n.

### Bá»• sung sau commit `5b40c7b`
- **ThÃ¡p Quan Ã‚m â†’ sÃ¢n tÆ°á»£ng:** bá» thÃ¡p, giá»¯ tÆ°á»£ng, Ä‘á»‘i xá»©ng sÃ¢n Pháº­t Tá»• (`BUDDHA_YARD`). `temple.ts`: khá»‘i `qyard` gá»“m 3 báº­c Ä‘Ã¡ bÃ¡t giÃ¡c + `buildQuanAm()` scale 1.15, y=1.2, `rotation.y = -Ï€/2 - 0.3`; collider r=4. `layout.ts`: bá» `QUAN_ROT`, `QUAN_PLAT`, nhÃ¡nh QUAN trong `groundY()`; `blocked()` bÃ¡n kÃ­nh 9 quanh QUAN. `couplets.ts`: bá» zone `thap`. `server/npcs.ts` váº«n import `QUAN` (khÃ´ng Ä‘á»•i). áº¢nh `shots/gd3-qa-*.png`. HÆ°á»›ng quay máº·t cá»§a tÆ°á»£ng chÆ°a Ä‘Æ°á»£c xÃ¡c nháº­n.
- **Gá»™p mesh:** `temple.ts::mergeStaticByMaterial(root)` gá»i trong `longHouse` sau `sealArchitectureJoints`, gá»™p theo material (bá» qua mesh cÃ³ `userData.inscription`). Má»—i nhÃ  tá»« â‰ˆ300 xuá»‘ng 11 mesh; scene 4542 â†’ 3935 mesh, sá»‘ tam giÃ¡c khÃ´ng Ä‘á»•i. Biá»ƒn/báº£ng khÃ´ng gáº¯n cá» `inscription` cÅ©ng cÃ³ thá»ƒ bá»‹ gá»™p; áº£nh `shots/gd3-21m-*.png` nhÃ¬n á»•n. Script: `tools/steps-cost.mjs`.
- **FPS (chÆ°a káº¿t luáº­n):** `tools/shot.mjs` máº·c Ä‘á»‹nh dÃ¹ng SwiftShader (0.4â€“0.9 FPS, vÃ´ nghÄ©a). Äo GPU tháº­t cáº§n báº£n sao táº¡m cá»§a `shot.mjs` Ä‘á»•i sang `--use-angle=metal`. Sau gá»™p, báº­t/táº¯t nhÃ : TÃ¢y 29.3/41.8, TÃ¢y-rá»™ng 19.2/29.2; sÃ¢n chÃ­nh â‰ˆ10 dÃ¹ báº­t hay táº¯t nhÃ . Láº§n Ä‘o thá»© hai (`tools/steps-fps2.mjs`) dao Ä‘á»™ng ráº¥t lá»›n. ChÆ°a tháº¥y báº±ng chá»©ng rÃµ vá» sá»¥t FPS báº¥t thÆ°á»ng nhÆ°ng sá»‘ Ä‘o nhiá»…u, nÃªn **chÆ°a coi lÃ  Ä‘Ã£ Ä‘Ã³ng bÄƒng layout**. NÃªn Ä‘o láº¡i trÃªn trÃ¬nh duyá»‡t tháº­t.
- **Sá»± cá»‘ file:** lá»‡nh `rm -f shots/probe-*.png` xÃ³a nháº§m 4 file. 3 file Ä‘Ã£ tracked (`probe-drum-from-north.png`, `probe-drum-from-south.png`, `probe-probe.png`) Ä‘Ã£ khÃ´i phá»¥c báº±ng `git checkout --`. `shots/probe-plaza-wide.png` chÆ°a tracked nÃªn máº¥t vÄ©nh viá»…n.

---

## R1.1 â€” Äiá»ƒm danh 7 ngÃ y + streak (commit `8e6a5cb`; bÆ°á»›c 0 sá»­a biá»ƒn `101d2a5`)

### ÄÃ£ lÃ m
- **BÆ°á»›c 0:** biá»ƒn nhÃ  TÃ¢y Ä‘á»•i thÃ nh "TÄ‚NG XÃ TÃ‚Y" (`temple.ts`). `signTexture` (`textures.ts`) tá»± thu cá»¡ chá»¯ khi chá»¯ rá»™ng quÃ¡ 440px; biá»ƒn cÅ© khÃ´ng Ä‘á»•i. áº¢nh `shots/r11-sign-tangxatay.png`.
- `shared/game.ts`: `CHECKIN_REWARDS` (7 ngÃ y, ngÃ y 7 kÃ¨m `den_hoa_dang`), `CheckinState`, `CheckinAck`.
- `server/db.ts`: báº£ng `checkins` (táº¡o lÃºc boot, `CREATE TABLE IF NOT EXISTS`), `checkinState()`, `claimCheckin()` (má»™t lá»‡nh upsert nguyÃªn tá»­, `rowsAffected` quyáº¿t Ä‘á»‹nh). DÃ¹ng nguyÃªn `dayKey()` (ngÃ y UTC, reset 07:00 giá» VN), khÃ´ng sá»­a `dayKey()`.
- `server/index.ts`: `checkin:get`, `checkin:claim` (thÃªm item trÆ°á»›c, rá»“i `grantRewards`), vÃ  emit `checkin` sau `pushQuests` trong handler `join`.
- Client: `src/features/checkin.ts` (panel 7 Ã´, âœ“ / sÃ¡ng / má», dÃ²ng "Chuá»—i Ä‘iá»ƒm danh: X ngÃ y Â· Tá»•ng lÆ°á»£t: Y"), nÃºt "Äiá»ƒm danh" trong `menu.ts` + icon `checkin` + cháº¥m Ä‘á» (`.checkinDot`) báº­t khi vÃ o chÃ¹a chÆ°a nháº­n, táº¯t sau khi nháº­n. CSS á»Ÿ `menu.css`.

### Kiá»ƒm chá»©ng
- typecheck pass.
- `node tools/steps-verify-checkin.mjs` (server riÃªng + DB táº¡m trong thÆ° má»¥c táº¡m, khÃ´ng Ä‘á»¥ng DB tháº­t/Turso): 19/19 PASS.
  - Láº§n Ä‘áº§u: streak 1, ngÃ y 1, +3 cÃ´ng Ä‘á»©c/+5 xu, profile Ä‘áº©y vá» client.
  - Láº§n 2 cÃ¹ng ngÃ y (ká»ƒ cáº£ 5 lá»‡nh song song): cháº·n, profile khÃ´ng Ä‘á»•i.
  - last_day = hÃ´m qua: streak 2, ngÃ y 2, +5/+5.
  - last_day = 2 ngÃ y trÆ°á»›c: state hiá»ƒn thá»‹ 0, claim vá» streak 1, ngÃ y 1.
  - streak 6 + hÃ´m qua: ngÃ y 7, +30/+30, tÃºi +1 `den_hoa_dang`; ngÃ y káº¿ tiáº¿p: streak 8, ngÃ y chu ká»³ 1.
- áº¢nh: `shots/r11-menu-dot.png` (nÃºt Äiá»ƒm danh + cháº¥m Ä‘á»), `r11-panel-before.png`, `r11-panel-after.png`. Script chá»¥p: `tools/steps-r11-checkin.mjs`.

### ChÆ°a cháº¯c cháº¯n
- Streak/ngÃ y game theo UTC (reset 07:00 VN); chÆ°a cÃ³ hÃ m giá» VN, thuá»™c R1.4.
- ChÆ°a thá»­ trÃªn mobile/cáº£m á»©ng. ThÃ´ng bÃ¡o thÆ°á»Ÿng dÃ¹ng `ctx.toast`, chÆ°a cÃ³ hiá»‡u á»©ng riÃªng.
- Báº£ng `checkins` tá»± táº¡o trÃªn Turso khi server Render khá»Ÿi Ä‘á»™ng láº¡i; chÆ°a deploy.
- ChÆ°a lÃ m R1.2 (hÃ²m thÆ°) vÃ  cÃ¡c má»¥c khÃ¡c.

---

## R1.2 â€” HÃ²m thÆ° + quÃ  chÃ o má»«ng (commit `ed8da1b`)

### ÄÃ£ lÃ m
- `shared/game.ts`: `MailGift`, `MailItem`, `MailAck`.
- `server/db.ts`: báº£ng `mail` + index `idx_mail_player` vÃ  báº£ng `app_meta` (táº¡o lÃºc boot). HÃ m `sendMail` (bá» item láº¡ qua `ITEM_BY_ID` + log cáº£nh bÃ¡o, gÃ³i rá»—ng lÆ°u NULL), `mailList`, `mailUnread`, `markMailRead`, `claimMail` (UPDATE cÃ³ Ä‘iá»u kiá»‡n `claimed = 0 AND gift IS NOT NULL`, má»i truy váº¥n khÃ³a `player_id`). GÃ³i quÃ  `MAIL_STARTER_GIFT` = 20 cÃ´ng Ä‘á»©c, 30 xu, `huong_tram` Ã—2, `nen_sap_ong` Ã—1, `den_hoa_dang` Ã—1; ná»™i dung thÆ° chÃ o má»«ng/ra máº¯t lÃ  háº±ng sá»‘ `WELCOME_MAIL`/`LAUNCH_MAIL` á»Ÿ má»™t chá»—.
- ThÆ° chÃ o má»«ng: gá»i sau INSERT trong `createGuest()` vÃ  nhÃ¡nh INSERT cá»§a `register()`; nhÃ¡nh nÃ¢ng cáº¥p khÃ¡ch khÃ´ng gá»­i. Lá»—i gá»­i thÆ° chá»‰ log, khÃ´ng lÃ m há»ng táº¡o tÃ i khoáº£n.
- ThÆ° ra máº¯t: `grantLaunchMail()` cháº¡y lÃºc boot ngay sau khi táº¡o báº£ng, trong má»™t transaction: náº¿u `app_meta.mail_launch_v1` chÆ°a cÃ³ thÃ¬ `INSERT ... SELECT` cho má»i `players` rá»“i ghi cá». Log `[db] mail launch grant: N thÆ°`. TrÃªn production tá»± cháº¡y á»Ÿ láº§n boot Ä‘áº§u sau deploy, khÃ´ng cáº§n lá»‡nh tay.
- `server/index.ts`: emit `mail { unread }` trong `join`; `mail:list`, `mail:read` (mailId pháº£i lÃ  sá»‘ há»¯u háº¡n), `mail:claim` (addItem tá»«ng mÃ³n trÆ°á»›c, rá»“i `grantRewards`).
- Client: `src/features/mail.ts` (nÃºt "HÃ²m thÆ°" + cháº¥m Ä‘á» `.mailDot`, panel danh sÃ¡ch / chi tiáº¿t / nÃºt Nháº­n quÃ , thÃ´ng bÃ¡o báº±ng `ctx.toast`), icon `mail` trong `icons.ts`, CSS `.mrow`/`.mgift`... trong `menu.css`, ná»‘i vÃ o `menu.ts`.

### Kiá»ƒm chá»©ng
- `npm run typecheck` pass.
- `node tools/steps-verify-mail.mjs` (DB táº¡m, khÃ´ng Ä‘á»¥ng DB tháº­t/Turso): 30/30 PASS, gá»“m:
  - KhÃ¡ch má»›i: 1 thÆ° welcome, event `mail` unread = 1. ÄÄƒng kÃ½ má»›i: 1 thÆ° welcome. KhÃ¡ch nÃ¢ng cáº¥p: váº«n 1 thÆ°.
  - Nháº­n quÃ : cÃ´ng Ä‘á»©c 40â†’60, xu 0â†’30 (Ä‘Ãºng +20/+30), tÃºi Ä‘á»§ 3 mÃ³n; nháº­n láº§n 2 vÃ  4 lá»‡nh song song bá»‹ cháº·n, profile khÃ´ng Ä‘á»•i.
  - NgÆ°á»i chÆ¡i B claim/read thÆ° cá»§a C: bá»‹ cháº·n, `read_at` váº«n NULL, `claimed` = 0.
  - Äá»c thÆ°: unread giáº£m, Ä‘á»c láº¡i khÃ´ng lá»—i, mailId khÃ´ng pháº£i sá»‘ tráº£ lá»—i gá»n.
  - Ra máº¯t: 2 ngÆ°á»i chÆ¡i cÅ©, boot 2 láº§n liÃªn tiáº¿p (log 2 thÆ° rá»“i 0 thÆ°), má»—i ngÆ°á»i Ä‘Ãºng 1 thÆ° `launch`; ngÆ°á»i chÆ¡i táº¡o sau khi cá» set khÃ´ng cÃ³ thÆ° launch; boot láº§n 3 khÃ´ng phÃ¡t thÃªm.
  - ThÆ° khÃ´ng quÃ  (`sendMail(..., null)`): claim bá»‹ cháº·n, Ä‘á»c bÃ¬nh thÆ°á»ng.
- áº¢nh (chá»¥p trÃªn DB táº¡m báº±ng `tools/steps-r12-mail.mjs`): `shots/r12-menu-dot.png` (nÃºt HÃ²m thÆ° + cháº¥m Ä‘á»), `r12-list.png` (danh sÃ¡ch, thÆ° chÆ°a Ä‘á»c cÃ³ cháº¥m, dÃ²ng tÃ³m táº¯t quÃ ), `r12-open.png` (thÆ° má»Ÿ ra vá»›i nÃºt Nháº­n quÃ ), `r12-claimed.png` (nÃºt "ÄÃ£ nháº­n quÃ "). ChÆ°a nÃ©n: mÃ¡y chÆ°a cÃ³ pngquant/oxipng, áº£nh giá»¯ nguyÃªn báº£n PNG cá»§a `shot.mjs`, giá»‘ng r11-*.

### ChÆ°a cháº¯c cháº¯n
- Test ra máº¯t dÃ¹ng DB cÅ© tá»± dá»±ng (chá»‰ báº£ng `players` rá»“i boot); chÆ°a cháº¡y trÃªn báº£n sao DB tháº­t 72 tÃ i khoáº£n.
- ChÆ°a thá»­ mobile/cáº£m á»©ng. Danh sÃ¡ch giá»›i háº¡n 50 thÆ°, chÆ°a cÃ³ phÃ¢n trang. ChÆ°a cÃ³ xÃ³a thÆ° (theo spec).
- Cháº¥m Ä‘á» chá»‰ cáº­p nháº­t khi Ä‘á»c/nháº­n hoáº·c vÃ o chÃ¹a; thÆ° má»›i gá»­i lÃºc Ä‘ang online (R3.1) sáº½ cáº§n event Ä‘áº©y riÃªng.
- ChÆ°a deploy: báº£ng `mail`/`app_meta` vÃ  thÆ° ra máº¯t sáº½ tá»± táº¡o á»Ÿ boot Ä‘áº§u trÃªn Render/Turso.
- ChÆ°a lÃ m R1.3 trá»Ÿ Ä‘i.

---

## R1.3 â€” VÃ²ng quay may máº¯n + ghi bÃ¹ "CÃ³ gÃ¬ má»›i" + sá»­a UI Ä‘iá»‡n thoáº¡i
Baseline má»›i: `main` sau 4 commit R1.3 (trÆ°á»›c Ä‘Ã³ `1ee97b0`). Commit: `d75ff79` (ghi bÃ¹ news), `72d13ec` (vÃ²ng quay), `ce58118` (UI Ä‘iá»‡n thoáº¡i), cá»™ng commit HANDOFF nÃ y.

### ÄÃ£ lÃ m
- **BÆ°á»›c 0 (`d75ff79`):** `src/data/news.ts` thÃªm entry "HÃ²m thÆ° nhÃ  chÃ¹a" vÃ  "Äiá»ƒm danh má»—i ngÃ y", `LATEST_NEWS_ID` 1 â†’ 2 (cáº£ Ä‘á»£t chá»‰ tÄƒng má»™t láº§n). Quy Æ°á»›c Ä‘á»©ng: má»—i tÃ­nh nÄƒng ra máº¯t pháº£i cÃ³ entry trong file nÃ y, náº¿u khÃ´ng coi nhÆ° chÆ°a xong nghiá»‡m thu.
- **VÃ²ng quay (`72d13ec`):** `shared/game.ts` cÃ³ `SPIN_SEGMENTS` (8 Ã´, tá»•ng weight 100), `drawSpinSegment(rng)` thuáº§n, kiá»ƒu `SpinState`/`SpinAck`. `server/index.ts`: emit `spin { used }` lÃºc join, `spin:get`, `spin:play`. LÆ°á»£t quay dÃ¹ng láº¡i `minigame_daily` (game `'quay'`, cap 1) qua `db.claimMinigame`, khÃ´ng cÃ³ báº£ng má»›i. LÆ°á»£t bá»‹ tiÃªu TRÆ¯á»šC khi rÃºt Ã´; thÆ°á»Ÿng Ä‘i qua `grantRewards` (nhiá»‡m vá»¥ merit, bonus lÃªn cáº¥p, `pushProfile`), item qua `db.addItem`. `moh`/`memory` khÃ´ng Ä‘á»•i.
- Client: `src/features/spin.ts` (vÃ²ng 8 Ã´ báº±ng CSS `conic-gradient` + nhÃ£n xoay, kim cá»‘ Ä‘á»‹nh á»Ÿ Ä‘á»‰nh, nÃºt QUAY á»Ÿ tÃ¢m), tháº» Ä‘áº§u tiÃªn "VÃ²ng quay may máº¯n" trong `games.ts`, cháº¥m Ä‘á» `.gamesDot` á»Ÿ nÃºt TrÃ² chÆ¡i (`menu.ts`, `initSpin`). Quy Æ°á»›c gÃ³c: Ã´ i chiáº¿m `[iÃ—45Â°, (i+1)Ã—45Â°)` theo chiá»u kim Ä‘á»“ng há»“ tá»« Ä‘á»‰nh; ack `segment = k` â†’ xoay tá»›i `360Ã—5 + (360 âˆ’ (kÃ—45 + 22.5))` Ä‘á»™, 4,5 s `cubic-bezier(0.12, 0.8, 0.08, 1)`. Entry news "VÃ²ng quay may máº¯n" Ä‘Ã£ thÃªm (khÃ´ng tÄƒng `LATEST_NEWS_ID`).
- **EV vÃ²ng quay (ghi theo spec):** â‰ˆ 16,1 cÃ´ng Ä‘á»©c + 11 xu + 7% HÆ°Æ¡ng tráº§m má»—i lÆ°á»£t. Ã” lá»›n nháº¥t Äáº I CÃT 100 cÃ´ng Ä‘á»©c + 100 xu (weight 5) náº±m trong tráº§n Pháº§n B (merit â‰¤ 100, xu â‰¤ 200). ChÆ°a Ä‘á»•i sá»‘ nÃ o.
- **Sá»­a UI Ä‘iá»‡n thoáº¡i (`ce58118`)**, chá»‰ trong `@media (max-width: 760px)` / `body.touch`: `#chat` má»Ÿ lÃ  flex cá»™t, `max-height: min(46dvh, 100dvh âˆ’ 442px âˆ’ safe-area)` (sá»‘ thá»© hai giá»¯ cáº¡nh dÆ°á»›i chat cÃ¡ch nÃºt Má»Ÿ rá»™ng, khÃ´ng cháº¡m joystick trÃªn mÃ n tháº¥p), `#msgs` co giÃ£n vÃ  cuá»™n trong, `#chatForm` dÃ­nh Ä‘Ã¡y, `#chat` z-index 9 (> joystick 8), `#chatInput` 16px, `#chatToggle` 40Ã—40. Khi thanh menu thu gá»n, nÃºt Má»Ÿ rá»™ng chuyá»ƒn thÃ nh nÃºt ná»•i `left: 12px; bottom: calc(228px + safe-area)`, 64Ã—56px. Desktop, kÃ©o/tháº£ joystick, logic thu gá»n, ná»™i dung chat khÃ´ng Ä‘á»•i.

### Kiá»ƒm chá»©ng
- `npm run typecheck` pass (trÆ°á»›c má»—i commit).
- `node tools/steps-verify-spin.mjs` (DB táº¡m, spawn server tháº­t): táº¥t cáº£ PASS:
  - KhÃ¡ch má»›i: event `spin` used=false; `spin:get` used=false.
  - `spin:play`: ok, segment âˆˆ [0,7], ack merit/coins/item khá»›p `SPIN_SEGMENTS[segment]`; profile tÄƒng â‰¥ thÆ°á»Ÿng Ã´ (láº§n cháº¡y cuá»‘i: Ã´ +25 â†’ merit 0â†’30 do bonus lÃªn cáº¥p, coins 0â†’10); tÃºi +1 Ä‘Ãºng mÃ³n náº¿u Ã´ cÃ³ item.
  - Láº§n 2 cÃ¹ng ngÃ y: ok=false, used=true, profile khÃ´ng Ä‘á»•i. 4 lá»‡nh song song: Ä‘Ãºng 1 ok, `minigame_daily` count = 1.
  - PhÃ¢n phá»‘i 20.000 láº§n: +10=22,4% | 15 xu=15,9% | +15=18,5% | 30 xu=11,5% | +25=11,9% | HÆ°Æ¡ng tráº§m=7,3% | +40=7,6% | Äáº I CÃT=5,0%. Má»i Ã´ trÃºng â‰¥ 1; Äáº I CÃT trong 2â€“9%; Ã´ weight â‰¥ 16 â‰¥ ná»­a ká»³ vá»ng.
  - `minigameCount('moh')` váº«n 0 sau khi quay; `minigame:reward 'moh'` váº«n nháº­n +3/+2. DÃ²ng `quay` cá»§a hÃ´m qua (UTC) â†’ `spin:play` váº«n ok.
- áº¢nh vÃ²ng quay (`tools/steps-r13-spin.mjs`, DB táº¡m, 1280Ã—800): `shots/r13-dot.png` (cháº¥m Ä‘á» á»Ÿ TrÃ² chÆ¡i), `r13-wheel.png` (8 Ã´ Ä‘á»c Ä‘Æ°á»£c + nÃºt QUAY), `r13-result.png`. Äá»‘i chiáº¿u tay: láº§n chá»¥p cuá»‘i kim chá»‰ Ã´ "15 xu" (rot = 2092,5Â°, gÃ³c dÆ°á»›i kim 67,5Â° â†’ Ã´ 1) vÃ  dÃ²ng káº¿t quáº£ "ChÃºc má»«ng: 15 xu!"; sau khi quay cháº¥m Ä‘á» táº¯t vÃ  tháº» TrÃ² chÆ¡i Ä‘á»•i thÃ nh "ÄÃ£ quay hÃ´m nay Â· Mai quay tiáº¿p nhÃ©".
- áº¢nh Ä‘iá»‡n thoáº¡i (`tools/steps-r13-mobile.mjs`, Chrome headless, `?touch=1`, 390Ã—844 vÃ  360Ã—740, DB táº¡m): `shots/r13-m-chat-open.png`, `r13-m-chat-typing.png`, `r13-m-bar.png`, `r13-m360-chat-open.png`, `r13-m360-bar.png`. Sá»‘ Ä‘o tháº­t á»Ÿ 390Ã—844: chat 242Ã—388 (top 138, bottom 526), Ã´ nháº­p trong khung vÃ  lÃ  pháº§n tá»­ nháº­n cháº¡m (`elementFromPoint` = `chatInput`), joystick top 628 â†’ cÃ¡ch chat 102px; `#msgs` scrollHeight/clientHeight = 1086/292 (cuá»™n trong). Cháº¡m vÃ o Ã´ nháº­p â†’ focus; gÃµ + Enter â†’ tin "Con xin gÃµ thá»­ trÃªn Ä‘iá»‡n thoáº¡i" xuáº¥t hiá»‡n cuá»‘i danh sÃ¡ch. NÃºt Má»Ÿ rá»™ng 64Ã—56 á»Ÿ (17, 555)â€“(81, 611), cÃ¡ch joystick 17px, báº¥m Ä‘Æ°á»£c (`elementFromPoint` = `mtoggle`, báº¥m láº¡i thÃ¬ má»Ÿ thanh). 360Ã—740: chat bottom 436, joystick top 524, nÃºt Má»Ÿ rá»™ng cÃ¡ch joystick 17px.
- KÃ©o joystick khi chat Ä‘ang má»Ÿ: nhÃ¢n váº­t di chuyá»ƒn Ä‘Æ°á»£c (z 9,55 â†’ 7,36 á»Ÿ 390Ã—844; 9,4 â†’ 7,2 á»Ÿ 360Ã—740).
- áº¢nh desktop 1280Ã—800 `shots/r13-desktop.png`: chat váº«n 340px neo Ä‘Ã¡y trÃ¡i (rect 12,452â€“352,708), bá»‘ cá»¥c khÃ´ng Ä‘á»•i.

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- ChÆ°a thá»­ trÃªn Ä‘iá»‡n thoáº¡i tháº­t: bÃ n phÃ­m áº£o tháº­t cÃ³ Ä‘áº©y/che khung chat hay khÃ´ng chÆ°a Ä‘Æ°á»£c kiá»ƒm; áº£nh chá»¥p dÃ¹ng giáº£ láº­p cáº£m á»©ng cá»§a Chrome headless.
- Giáº£ láº­p `pointer: coarse` cá»§a `shot.mjs` khÃ´ng báº­t `body.touch`; script mobile pháº£i dÃ¹ng `?touch=1`.
- VÃ²ng quay chÆ°a thá»­ vá»›i máº¡ng cháº­m/ngáº¯t giá»¯a chá»«ng trÃªn mÃ¡y tháº­t; thiáº¿t káº¿ Ä‘Ã£ báº£o Ä‘áº£m quÃ  vÃ o tÃ i khoáº£n trÆ°á»›c khi ack. Náº¿u máº¥t ack, client hiá»ƒn thá»‹ láº¡i tráº¡ng thÃ¡i "Ä‘Ã£ quay" á»Ÿ láº§n vÃ o sau (event `spin` lÃºc join).
- NgÃ y quay tÃ­nh theo `dayKey()` UTC (nhÆ° moh/memory), chÆ°a lÃ  má»‘c 07:00 VN nhÆ° vÄƒn báº£n UI nÃ³i; thuá»™c R1.4 cÃ¹ng Ä‘iá»ƒm danh.
- Cháº¥m Ä‘á» TrÃ² chÆ¡i chá»‰ cáº­p nháº­t khi vÃ o chÃ¹a hoáº·c sau khi quay; khÃ´ng Ä‘áº©y trá»±c tiáº¿p lÃºc qua ngÃ y (R3.1).
- áº¢nh PNG chÆ°a nÃ©n (chÆ°a cÃ³ pngquant/oxipng).
- ChÆ°a deploy; khÃ´ng cÃ³ báº£ng DB má»›i nÃªn khÃ´ng cáº§n migration.
- ChÆ°a lÃ m R1.4 trá»Ÿ Ä‘i.

---

## R1.4 â€” Há»‡ sá»‘ cÃ´ng Ä‘á»©c theo giá» lá»… & ngÃ y Ã¢m lá»‹ch
Baseline má»›i: `main` sau commit `7517090` (trÆ°á»›c Ä‘Ã³ `0adb61e`), cá»™ng commit HANDOFF nÃ y.

### ÄÃ£ lÃ m
- **`shared/time.ts` (má»›i, thuáº§n, dÃ¹ng chung server/client):** `ictParts(d)` (Intl `Asia/Ho_Chi_Minh` + `formatToParts`), `solarToLunar(d, m, y)` (thuáº­t toÃ¡n Há»“ Ngá»c Äá»©c, mÃºi +7, tá»± cÃ i, khÃ´ng thÃªm package), `meritBoost(d)` tráº£ `{ mult, session, lunarDay, holy }`; háº±ng `SESSION_HOURS = [5, 12, 20]`, `SESSION_MULT = 2`, `LUNAR_MULT = 1.5`. Cá»­a sá»• giá» lá»… lÃ  `[h:00, h+1:00)` giá» ICT; ngÃ y Ã¢m tÃ­nh tá»« NGÃ€Y ICT (khÃ´ng pháº£i ngÃ y UTC).
- **Server (`server/index.ts`):** `action` (sau khi Ã¡p váº­t pháº©m boost) vÃ  `sutra:done` tÃ­nh `finalMerit = Math.round(merit Ã— meritBoost(new Date()).mult)` rá»“i `grantRewards`. Xu giá»¯ nguyÃªn (action +1, kinh +0). Ack `sutra:done` tráº£ sá»‘ Ä‘Ã£ nhÃ¢n. LÃºc join, sau `spin`, emit `boost` (má» neo hiá»ƒn thá»‹). Thiá»n, Ä‘iá»ƒm danh, vÃ²ng quay, thÆ°, nhiá»‡m vá»¥, minigame KHÃ”NG Ä‘á»•i; `dayKey()` (UTC) KHÃ”NG Ä‘á»•i.
- **Client:** `#boostBanner` trong `index.html` (cáº¡nh `#medBanner`), style á»Ÿ `src/style.css`, logic `src/features/boost.ts` (`initBoost` ná»‘i trong `menu.ts` cáº¡nh `initSpin`): nghe `boost` tá»« server rá»“i tá»± tÃ­nh láº¡i má»—i 30 giÃ¢y báº±ng `meritBoost(new Date())`, chá»‰ Ä‘á»ƒ hiá»ƒn thá»‹. Vá»‹ trÃ­: `top: 186px` (desktop, `body.touch` vÃ  `max-width: 760px` cÃ¹ng 186px); `#medBanner` á»Ÿ `top: 142px`, nÃªn banner há»‡ sá»‘ náº±m dÆ°á»›i banner thiá»n, khÃ´ng chá»“ng.
- **News:** entry "Giá» lá»… nhÃ¢n cÃ´ng Ä‘á»©c" Ä‘á»©ng Ä‘áº§u `NEWS`, `LATEST_NEWS_ID` 2 â†’ 3.

### Báº£ng há»‡ sá»‘ vÃ  lÃ m trÃ²n
| Äiá»u kiá»‡n (giá»/ngÃ y ICT) | Há»‡ sá»‘ |
|---|---|
| KhÃ´ng cÃ³ | Ã—1 |
| Giá» tá»¥ng kinh 05:00, 12:00, 20:00 (má»—i cá»­a sá»• Ä‘Ãºng 60 phÃºt) | Ã—2 |
| MÃ¹ng 1 hoáº·c Ráº±m Ã¢m lá»‹ch (cáº£ ngÃ y) | Ã—1,5 |
| Giá» tá»¥ng kinh trÃ¹ng MÃ¹ng 1/Ráº±m | Ã—3 |

`Math.round(merit Ã— há»‡ sá»‘)`, 0,5 lÃ m trÃ²n lÃªn. Gá»‘c 1 â†’ 2 / 2 / 3; gá»‘c 2 â†’ 3 / 4 / 6; gá»‘c 5 â†’ 8 / 10 / 15; gá»‘c 15 â†’ 23 / 30 / 45 (á»©ng vá»›i Ã—1,5 / Ã—2 / Ã—3).

### Chá»¯ ná»•i "+N cÃ´ng Ä‘á»©c" (BÆ°á»›c 3)
Thuá»™c trÆ°á»ng há»£p **suy ra tá»« delta profile**: `updateProfileHud` (`src/main.ts:233`) so `profile.merit` má»›i vá»›i `lastMerit`, nÃªn tá»± Ä‘Ãºng sá»‘ Ä‘Ã£ nhÃ¢n, khÃ´ng pháº£i sá»­a. Toast tá»¥ng kinh (`src/panels.ts:217`) dÃ¹ng `r.merit` tá»« ack nÃªn cÅ©ng Ä‘Ãºng. LÆ°u Ã½ cÃ³ sáºµn tá»« trÆ°á»›c: chá»¯ ná»•i tÃ­nh cáº£ bonus lÃªn cáº¥p náº¿u cÃ¹ng Ä‘á»£t cáº­p nháº­t profile.

### Kiá»ƒm chá»©ng
- `npm run typecheck` pass.
- `node tools/steps-verify-boost.mjs` (DB táº¡m, server tháº­t): Táº¤T Cáº¢ PASS (31 kiá»ƒm tra):
  - `solarToLunar`: 17/02/2026 â†’ 01/01/2026; 29/01/2025 â†’ 01/01/2025; 10/02/2024 â†’ 01/01/2024; 06/10/2025 â†’ 15/08/2025; 17/09/2024 â†’ 15/08/2024; 11/11/2026 â†’ ngÃ y Ã¢m 3 (khÃ´ng thuá»™c {1, 15}).
  - `meritBoost` 10 má»‘c ICT trong spec Ä‘á»u Ä‘Ãºng (04:59 Ã—1; 05:00 Ã—2; 05:59 Ã—2; 06:00 Ã—1; 12:30 Ã—2; 20:00 Ã—2; 21:00 Ã—1; 17/02/2026 08:00 Ã—1,5; 05:15 Ã—3; 06/10/2025 13:00 Ã—1,5). ThÃªm 2 má»‘c ranh giá»›i ngÃ y ICT/UTC: 17/02/2026 00:30 ICT (váº«n 16/02 theo UTC) â†’ Ã—1,5; 16/02/2026 23:30 ICT â†’ Ã—1.
  - Báº£ng lÃ m trÃ²n 4 hÃ ng Ã— 3 cá»™t Ä‘Ãºng.
  - E2E: event `boost` lÃºc join khá»›p helper; tháº¯p hÆ°Æ¡ng +round(1Ã—mult), xu +1; cÃ³ HÆ°Æ¡ng tráº§m: +round(5Ã—mult), mÃ³n bá»‹ tiÃªu (1 â†’ 0), xu +1; `sutra:done` ack `merit` = round(2Ã—mult), DB khá»›p ack, xu +0. LÃºc cháº¡y lÃ  12:3x ICT (giá» tá»¥ng kinh) nÃªn mult thá»±c = 2: tháº¯p hÆ°Æ¡ng +2, HÆ°Æ¡ng tráº§m +10, kinh +4.
  - Há»“i quy: khÃ¡ch má»›i (merit Ä‘áº·t sáºµn 100 Ä‘á»ƒ khÃ´ng lÃªn cáº¥p, nÃªn khÃ´ng cÃ³ bonus cáº¥p) Ä‘iá»ƒm danh ngÃ y 1: ack vÃ  DB Ä‘Ãºng +3 cÃ´ng Ä‘á»©c / +5 xu, khÃ´ng bá»‹ nhÃ¢n.
- áº¢nh (`tools/steps-r14-shots.mjs` qua `tools/shot.mjs`, DB táº¡m, 1280Ã—800; Ä‘á»“ng há»“ client giáº£ láº­p báº±ng `Page.addScriptToEvaluateOnNewDocument` ghi Ä‘Ã¨ `Date`, chá»‰ trong phiÃªn chá»¥p, khÃ´ng cÃ³ mÃ£ debug trong production): `shots/r14-banner.png` (Ä‘á»“ng há»“ giáº£ 05:30 ICT 11/11/2026, banner "Giá» tá»¥ng kinh Â· CÃ´ng Ä‘á»©c Ã—2"), `shots/r14-news.png` (entry "Giá» lá»… nhÃ¢n cÃ´ng Ä‘á»©c" trÃªn cÃ¹ng), `shots/r14-banner-with-meditation.png` (Ä‘Ã£ chÃ¨n `#medBanner` báº±ng script Ä‘á»ƒ kiá»ƒm khÃ´ng chá»“ng; Ä‘á»c tá»« áº£nh, `#medBanner` káº¿t thÃºc khoáº£ng y=175, `#boostBanner` báº¯t Ä‘áº§u khoáº£ng y=186, cÃ¡ch khoáº£ng 10px).

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- E2E server chá»‰ cháº¡y Ä‘Æ°á»£c á»Ÿ mult thá»±c lÃºc cháº¡y (Ã—2 lÃºc 12:3x ICT); cÃ¡c má»‘c Ã—1, Ã—1,5, Ã—3 chá»‰ Ä‘Æ°á»£c kiá»ƒm á»Ÿ má»©c unit (`meritBoost` + báº£ng lÃ m trÃ²n), chÆ°a qua socket vÃ¬ server dÃ¹ng Ä‘á»“ng há»“ tháº­t.
- Láº§n cháº¡y cuá»‘i cá»§a script áº£nh khÃ´ng in log (stdout bá»‹ cháº·n do script cháº¡y quÃ¡ timeout cá»§a cÃ´ng cá»¥); khoáº£ng cÃ¡ch banner ghi á»Ÿ trÃªn Ä‘á»c tá»« áº£nh, khÃ´ng pháº£i sá»‘ Ä‘o `getBoundingClientRect`.
- (ÄÃ£ xá»­ lÃ½ á»Ÿ rider R1.5: banner áº©n khi chat má»Ÿ trÃªn Ä‘iá»‡n thoáº¡i.) Ban Ä‘áº§u chÆ°a thá»­ trÃªn Ä‘iá»‡n thoáº¡i: offset 186px dÃ¹ng chung cho má»i cá»¡, chat má»Ÿ á»Ÿ `top: 138px` cháº¡m banner.
- Banner dá»±a vÃ o Ä‘á»“ng há»“ mÃ¡y khÃ¡ch Ä‘á»ƒ tá»± cáº­p nháº­t má»—i 30 giÃ¢y; mÃ¡y khÃ¡ch sai giá» chá»‰ lÃ m banner lá»‡ch, sá»‘ tháº­t váº«n do server quyáº¿t Ä‘á»‹nh.
- NgÃ y Ä‘iá»ƒm danh/vÃ²ng quay/minigame váº«n theo `dayKey()` UTC (UI nÃ³i 07:00 VN); khÃ´ng Ä‘á»•i trong R1.4 theo spec.
- ChÆ°a cÃ³ thÃ´ng bÃ¡o Ä‘áº©y khi sáº¯p tá»›i giá» lá»… (R4.3). ChÆ°a deploy; khÃ´ng cÃ³ báº£ng DB má»›i.
- ChÆ°a lÃ m R1.5 trá»Ÿ Ä‘i.

## R1.5 â€” Thá»‘ng kÃª tÃ­ch lÅ©y trá»n Ä‘á»i & má»‘c thÃ nh tá»±u (+ rider banner giá» lá»… trÃªn Ä‘iá»‡n thoáº¡i)
Baseline má»›i: `main` sau commit `8b87c49` (trÆ°á»›c Ä‘Ã³ `44a8628` feat R1.5, `0d10619` docs), cá»™ng commit HANDOFF nÃ y.

### ÄÃ£ lÃ m
- **DB (`server/db.ts`):** báº£ng `player_stats` (`bows`, `chants`, `lanterns`, `meditate_sec`, `beads_rounds`) vÃ  `stat_rewards` (PK `player_id, milestone_id`). HÃ m `bumpStat(id, key, delta)` upsert nguyÃªn tá»­ báº±ng `INSERT â€¦ ON CONFLICT DO UPDATE â€¦ RETURNING`, tráº£ giÃ¡ trá»‹ má»›i; tÃªn cá»™t chá»‰ láº¥y tá»« báº£ng Ã¡nh xáº¡ cá»‘ Ä‘á»‹nh `STAT_COLUMNS`, khÃ´ng ná»™i suy chuá»—i tá»« client. `getStatValue`, `getStats` (Ä‘á»§ 5 sá»‘, 0 náº¿u chÆ°a cÃ³ dÃ²ng), `claimStatReward` (INSERT OR IGNORE â†’ boolean, theo máº«u `claimLevelReward`), `claimedStatRewards`.
- **Äiá»ƒm Ä‘áº¿m (`server/index.ts`, helper `countStat`/`countStatSafe`):** `action` sau cá»•ng cooldown vÃ  sau nhÃ¡nh early-return palms/beads: `bow` â†’ bows, `chant` â†’ chants, `lantern` â†’ lanterns; `incense` KHÃ”NG Ä‘áº¿m. `sutra:done` (sau cá»•ng cooldown) â†’ chants +1. Tick thiá»n: má»—i ngÆ°á»i Ä‘ang ngá»“i +10 giÃ¢y `meditate_sec` (cÃ¹ng vÃ²ng `grantRewards`). Äáº¿m náº±m sau khi thÆ°á»Ÿng gá»‘c xong; lá»—i Ä‘áº¿m chá»‰ log `[stats]`, khÃ´ng lÃ m há»ng hÃ nh Ä‘á»™ng.
- **Má»‘c (`shared/game.ts`):** `STAT_MILESTONES` 12 má»‘c Ä‘Ãºng nhÆ° spec (bow 100/300/1000, chant 50/200/500, lamp 20/50/150, med 30/60/180 phÃºt tÃ­nh báº±ng giÃ¢y), kiá»ƒu `StatKey`, `PlayerStats`, `StatsState`, `MilestoneEvent`, thÃªm `StatsAck`.
- **Trao thÆ°á»Ÿng:** sau má»—i `bumpStat`, vá»›i tá»«ng má»‘c Ä‘Ã£ vÆ°á»£t: `claimStatReward` TRÆ¯á»šC, rá»“i `addItem` (náº¿u cÃ³), `addRewards(pid, 0, coins)`, `pushProfile`, emit `milestone` vÃ  `stats`. Chá»‰ xu + váº­t pháº©m, khÃ´ng cÃ´ng Ä‘á»©c, khÃ´ng qua `grantRewards` (khÃ´ng kÃ­ch hoáº¡t nhiá»‡m vá»¥ 'merit' hay bonus cáº¥p).
- **Socket:** emit `stats` lÃºc join (sau `boost`); handler `stats:get` tráº£ `StatsAck { ok, state }`.
- **Client:** `src/features/stats.ts` (`initStats` ná»‘i trong `menu.ts` cáº¡nh `initBoost`: nghe `stats`, nghe `milestone` â†’ `ctx.toast`; `renderStatsSection` váº½ tá»« cache rá»“i gá»i `stats:get` lÃ m má»›i). `src/features/levels.ts` thÃªm má»¥c "ThÃ nh tá»±u tÃ­ch lÅ©y": 4 dÃ²ng (Láº¡y Pháº­t / Tá»¥ng kinh / Tháº£ Ä‘Ã¨n / Ngá»“i thiá»n, thiá»n hiá»ƒn thá»‹ báº±ng phÃºt), thanh tiáº¿n Ä‘á»™ tá»« ngÆ°á»¡ng trÆ°á»›c tá»›i ngÆ°á»¡ng sau, 3 chip (Ä‘Ã£ nháº­n = vÃ ng + âœ“, má»‘c káº¿ = viá»n sÃ¡ng, chÆ°a tá»›i = má»), háº¿t má»‘c thÃ¬ ghi "ÄÃ£ Ä‘áº¡t táº¥t cáº£ cÃ¡c má»‘c". CSS á»Ÿ cuá»‘i `src/menu.css` (`.st*`).
- **News:** entry "ThÃ nh tá»±u tÃ­ch lÅ©y" Ä‘á»©ng Ä‘áº§u `NEWS`, `LATEST_NEWS_ID` 3 â†’ 4.

### Rider: banner giá» lá»… vs khung chat trÃªn Ä‘iá»‡n thoáº¡i (`src/features/boost.ts`)
`render` áº©n `#boostBanner` khi `matchMedia('(max-width: 760px)')` khá»›p VÃ€ `#chat` khÃ´ng cÃ³ class `collapsed`. Cáº­p nháº­t tá»©c thÃ¬ nhá» `MutationObserver` trÃªn thuá»™c tÃ­nh `class` cá»§a `#chat` (bao cáº£ nÃºt `#chatToggle` láº«n mÃ£ khÃ¡c) vÃ  listener `change` cá»§a media query, cá»™ng nhá»‹p 30 giÃ¢y sáºµn cÃ³. KhÃ´ng Ä‘á»•i CSS vá»‹ trÃ­; desktop vÃ  Ä‘iá»‡n thoáº¡i-khi-chat-Ä‘Ã³ng giá»¯ nguyÃªn.

### Kiá»ƒm chá»©ng
- `npm run typecheck` pass (trÆ°á»›c cáº£ hai commit).
- `node tools/steps-verify-stats.mjs` (DB táº¡m, server tháº­t, helper `.mts`): Táº¤T Cáº¢ PASS (19 kiá»ƒm tra). Cooldown: má»—i kind dÃ¹ng má»™t khÃ¡ch riÃªng; ca "láº¡y láº§n 2" chá» â‰¥ 1,2 giÃ¢y sau 0,9 giÃ¢y sáºµn cÃ³ (cooldown láº¡y 2 giÃ¢y).
  - KhÃ¡ch má»›i: `stats:get` vÃ  event join Ä‘á»u 5 sá»‘ 0, `claimed` rá»—ng.
  - bow/chant/lantern má»—i kind +1 Ä‘Ãºng cá»™t, cÃ¡c cá»™t khÃ¡c giá»¯ 0; incense khÃ´ng Ä‘á»•i gÃ¬.
  - `sutra:done` (bÃ i Ä‘áº§u trong SUTRAS) lÃ m chants tá»« 1 lÃªn 2.
  - Thiá»n: ngá»“i ~26 giÃ¢y â†’ `meditate_sec = 30` (bá»™i sá»‘ 10, â‰¥ 2 tick).
  - bows Ä‘áº·t sáºµn 99 qua `bumpStat`, láº¡y 1 láº§n â†’ Ä‘Ãºng 1 event `bow100`, xu +21 (1 cá»§a hÃ nh Ä‘á»™ng + 20 má»‘c), `claimed` chá»©a `bow100`; láº¡y tiáº¿p â†’ khÃ´ng event má»›i, xu +1.
  - Má»‘c cÃ³ quÃ : bows 399 â†’ `bow300` táº·ng 1 Náº¿n sÃ¡p ong, xu +51.
  - `claimStatReward` gá»i 2 láº§n cÃ¹ng má»‘c â†’ true rá»“i false.
  - Ngáº¯t káº¿t ná»‘i, vÃ o láº¡i cÃ¹ng tÃ i khoáº£n: stats vÃ  claimed giá»¯ nguyÃªn, event join khá»›p.
  - Há»“i quy: tháº¯p hÆ°Æ¡ng cÃ´ng Ä‘á»©c = `Math.round(1 Ã— mult)` táº¡i thá»i Ä‘iá»ƒm cháº¡y (cháº¡y lÃºc mult = 1: +1 cÃ´ng Ä‘á»©c, +1 xu).
- áº¢nh (DB táº¡m `/tmp/co-r15/db.db`, `tools/shot.mjs`):
  - `shots/r15-panel.png` (1280Ã—800, script `tools/steps-r15-panel.mjs` dá»±ng tÃ i khoáº£n cÃ³ bows 137, chants 62, lanterns 8, thiá»n 2400 giÃ¢y, má»‘c Ä‘Ã£ nháº­n bow100/chant50/med30): Ä‘á»§ 4 dÃ²ng, thanh tiáº¿n Ä‘á»™, chip Ä‘á»c Ä‘Æ°á»£c.
  - `shots/r15-m-banner-chat-open.png` vÃ  `shots/r15-m-banner-chat-closed.png` (390Ã—844, `?touch=1`, `tools/steps-r15-banner.mjs`, Ä‘á»“ng há»“ client giáº£ láº­p 05:30 ICT nhÆ° R1.4). Sá»‘ Ä‘o tá»« script: chat má»Ÿ â†’ `banner hidden=true`; chat thu gá»n â†’ banner hiá»‡n "Giá» tá»¥ng kinh Â· CÃ´ng Ä‘á»©c Ã—2", banner top=186 bottom=234, chat top=138 bottom=180, khoáº£ng cÃ¡ch 6px, khÃ´ng chá»“ng.

### LÆ°u Ã½
- **`beads_rounds`:** cá»™t cÃ³ sáºµn nhÆ°ng chÆ°a Ä‘áº¿m vÃ  chÆ°a cÃ³ má»‘c. Sá»± kiá»‡n "hoÃ n thÃ nh 1 vÃ²ng 108 háº¡t" chá»‰ tá»“n táº¡i khi R2.2 (giao diá»‡n láº§n háº¡t) lÃ m xong; Ä‘áº¿m sá»‘ láº§n báº¥m animation beads lÃ  vÃ´ nghÄ©a. Má»‘c trÃ ng háº¡t bá»• sung trong spec R2.2 (thÃªm vÃ o `STAT_MILESTONES` + dÃ²ng thá»© 5 trong `stats.ts`).
- **Sá»‘ liá»‡u báº¯t Ä‘áº§u tá»« 0** cho má»i ngÆ°á»i chÆ¡i khi tÃ­nh nÄƒng lÃªn sÃ³ng, khÃ´ng há»“i tá»‘ (khÃ´ng cÃ³ dá»¯ liá»‡u nguá»“n). Tin "CÃ³ gÃ¬ má»›i" nÃ³i "tá»« nay" Ä‘á»ƒ pháº£n Ã¡nh Ä‘Ãºng Ä‘iá»u nÃ y.
- Hai hÃ nh Ä‘á»™ng liÃªn tiáº¿p cÃ¹ng vÆ°á»£t má»‘c chá»‰ nháº­n thÆ°á»Ÿng má»™t láº§n nhá» `INSERT OR IGNORE`. Náº¿u ngÆ°á»i chÆ¡i vÆ°á»£t nhiá»u má»‘c cÃ¹ng má»™t bÆ°á»›c (vÃ­ dá»¥ helper cá»™ng lá»›n), vÃ²ng láº·p trao háº¿t cÃ¡c má»‘c Ä‘Ã£ Ä‘á»§ ngÆ°á»¡ng.
- ThÆ°á»Ÿng má»‘c cá»™ng xu trá»±c tiáº¿p nÃªn khÃ´ng hiá»‡n chá»¯ ná»•i cÃ´ng Ä‘á»©c; ngÆ°á»i chÆ¡i tháº¥y toast "Äáº¡t má»‘c thÃ nh tá»±uâ€¦".
- Khi cháº¡y áº£nh banner, script pháº£i chá» vÃ o chÃ¹a xong (`__co.me()`) rá»“i má»›i Ä‘á»c banner; láº§n Ä‘áº§u gáº·p banner rá»—ng chá»‰ do chÆ°a vÃ o chÃ¹a, khÃ´ng pháº£i lá»—i mÃ£.

### Viá»‡c cÃ²n treo
- Má»‘c trÃ ng háº¡t + Ä‘áº¿m `beads_rounds` (R2.2). Bia Ä‘Ã¡ vinh danh (R3.3). ChÆ°a deploy.
- ChÆ°a cháº¡y E2E báº±ng trÃ¬nh duyá»‡t tháº­t cho toast `milestone` (chá»‰ kiá»ƒm báº±ng socket); mÃ£ toast lÃ  má»™t dÃ²ng `ctx.toast`.
- Quy Æ°á»›c Ä‘á»©ng: má»—i tÃ­nh nÄƒng má»›i thÃªm entry vÃ o Ä‘áº§u `NEWS` vÃ  tÄƒng `LATEST_NEWS_ID`.

## UI Ä‘iá»‡n thoáº¡i â€” thu nhá» HUD (dá»c compact + cháº¿ Ä‘á»™ ngang) (commit `3631a8f` dá»c, `cee1cdd` ngang)

### ÄÃ£ lÃ m
- Chá»‰ sá»­a CSS (`src/style.css`, `src/menu.css`), khÃ´ng Ä‘á»¥ng TS hay DOM. Desktop (> 760px, khÃ´ng pháº£i mÃ n ngang tháº¥p) giá»¯ nguyÃªn: xem `shots/uim-desktop.png`.
- **Dá»c (`@media (max-width: 760px)`):** theo báº£ng spec. Marquee 22px; há»“ sÆ¡ top 30, avatar 34, thanh cáº¥p 80Ã—5; `#online` top 78; nÃºt hÃ nh Ä‘á»™ng 48Ã—48 (icon 20, nhÃ£n 9.5), cá»™t `right: 6`, `gap: 5`, cao 366px (tá»« 470px); chat cáº£m á»©ng top 116, rá»™ng `min(228px, 58vw)`, cao tá»‘i Ä‘a `min(38dvh, 100dvh âˆ’ 380px âˆ’ safe)`; banner giá» lá»…/boost top 106/144; joystick 104 (`left: 14`, stick 46 táº¡i 29/29, `#joyGrip` 30); `#couplet` bottom 148. NÃºt `teacher/zone` min-width 64, nhÃ£n 10px/max 84px. Menu: nÃºt 54Ã—50, padding/gap 3, icon 19/nhÃ£n 9, nÃºt Thu gá»n cáº£m á»©ng 54Ã—50 (min 48) táº¡i bottom `208px + safe`.
- **Giá»¯ nguyÃªn theo spec:** `#soundBtn` 38Ã—38, `#chatToggle` cáº£m á»©ng 40Ã—40, `#chatInput` font 16px.
- **Ngang (má»›i):** Ä‘iá»u kiá»‡n cá»§a khá»‘i HUD mobile má»Ÿ rá»™ng thÃ nh `(max-width: 760px), (orientation: landscape) and (max-height: 500px)`; thÃªm khá»‘i `@media (orientation: landscape) and (max-height: 500px)` á»Ÿ cuá»‘i `style.css` vÃ  cuá»‘i pháº§n menu cá»§a `menu.css`, Ä‘Ãºng báº£ng vá»‹ trÃ­ trong spec.
- Pháº§n ghi Ä‘Ã¨ riÃªng cho `#joyGrip` 30px vÃ  nÃºt teacher/zone náº±m á»Ÿ má»™t khá»‘i media riÃªng cuá»‘i `style.css` (vÃ¬ cÃ¡c quy táº¯c gá»‘c cá»§a chÃºng Ä‘á»©ng sau khá»‘i mobile chÃ­nh trong file nÃªn pháº£i Ä‘áº·t sau má»›i tháº¯ng).

### Lá»‡ch nháº¹ so vá»›i spec (cáº§n biáº¿t)
- `.pinfo { line-height: 1.1 }`, `.pinfo b { display: block }`, `.bar { margin-top: 3px }` trong media mobile: vá»›i Ä‘Ãºng cÃ¡c sá»‘ cá»§a spec, há»“ sÆ¡ cao 52px nÃªn Ä‘Ã¨ `#online` (top 78) 4px. Ba dÃ²ng nÃ y kÃ©o há»“ sÆ¡ xuá»‘ng 47px, háº¿t chá»“ng.
- Khá»‘i ngang: `#actions` thÃªm `flex-wrap: wrap-reverse; align-content: flex-start; max-height: calc(100dvh - 142px - safe)`. Vá»›i 7 nÃºt Ã— 48 + gap = 366px, cá»™t Ä‘Æ¡n vÆ°á»£t quÃ¡ 390px chiá»u cao nÃªn trÃ n lÃªn trÃªn mÃ n hÃ¬nh (nÃºt Ä‘áº§u á»Ÿ y = âˆ’46) vÃ  Ä‘Ã¨ cá»¥m `#topright`. Giá» cá»™t tá»± tÃ¡ch thÃ nh 2 cá»™t khi háº¿t chá»—: á»Ÿ 844Ã—390 lÃ  2 cá»™t, há»™p 101Ã—207, khÃ´ng trÃ n. Spec ghi "cá»™t hÃ nh Ä‘á»™ng dá»c bÃªn pháº£i", váº«n Ä‘Ãºng nhÆ°ng lÃ  2 cá»™t dá»c á»Ÿ mÃ¡y 390px cao.
- Chat cáº£m á»©ng á»Ÿ khá»‘i ngang: `max-height: 56dvh` Ä‘áº·t trÃªn `body.touch #chat:not(.collapsed)` (cÃ¹ng Ä‘á»™ Ä‘áº·c hiá»‡u vá»›i quy táº¯c max-height cá»§a khá»‘i mobile) chá»© khÃ´ng pháº£i `body.touch #chat`, náº¿u khÃ´ng sáº½ bá»‹ quy táº¯c `calc(100dvh âˆ’ 380px â€¦)` tháº¯ng vÃ  khung chat co vá» 0 á»Ÿ mÃ n ngang.

### Kiá»ƒm chá»©ng
- `npm run typecheck` pass.
- Sá»‘ Ä‘o tá»« `tools/steps-uim.mjs` (`UIM=portrait|chat|landscape|desktop`, cháº¡y báº±ng `tools/shot.mjs`, `?touch=1`), kiá»ƒm tra chá»“ng chÃ©o giá»¯a profile, online, topright, banner, chat, actions, joystick, menu, couplet:
  - `shots/uim-portrait.png` (390Ã—844): cá»™t hÃ nh Ä‘á»™ng 366px (y 406â€“772), nÃºt 48Ã—48, nhÃ£n "Tháº¯p hÆ°Æ¡ng" khÃ´ng trÃ n (`scrollWidth â‰¤ clientWidth`); joystick 104Ã—104; menu cao 58px; khÃ´ng chá»“ng nhau.
  - `shots/uim-chat.png` (390Ã—844, Ä‘á»“ng há»“ giáº£ 05:30 ICT): chat má»Ÿ cao 158px (giá»›i háº¡n 38dvh = 321px); `#boostBanner` hidden (rider R1.5 cÃ²n Ä‘Ãºng); Ã´ nháº­p hiá»‡n Ä‘á»§, font 16px; gÃµ "xin chao" + Enter ra tin trong `#msgs`.
  - `shots/uim-landscape.png` (844Ã—390): profile (28), online cáº¡nh profile (left 190, top 34), 2 cá»™t hÃ nh Ä‘á»™ng á»Ÿ y 113â€“320, joystick 96, menu cao 54 sÃ¡t Ä‘Ã¡y (y 332â€“386); khÃ´ng pháº§n tá»­ nÃ o quÃ¡ 390. Giao nhau duy nháº¥t Ä‘o Ä‘Æ°á»£c lÃ  `#couplet` vá»›i `#menu`, nhÆ°ng `#couplet` chá»‰ lÃ  há»™p áº©n má» khi khÃ´ng phÃ¡t (opacity 0).
  - `shots/uim-desktop.png` (1280Ã—800): cÃ¡c há»™p khá»›p giÃ¡ trá»‹ CSS gá»‘c (nÃºt hÃ nh Ä‘á»™ng 78Ã—78, menu 64Ã—62, há»“ sÆ¡ 210Ã—62); má»i quy táº¯c má»›i Ä‘á»u náº±m trong media mobile/ngang nÃªn khÃ´ng cháº¡m desktop (khÃ´ng chá»¥p báº£n trÆ°á»›c Ä‘á»ƒ so tá»«ng pixel).
- ChÆ°a kiá»ƒm tay trÃªn Ä‘iá»‡n thoáº¡i tháº­t (báº¥m láº§n lÆ°á»£t 7 nÃºt hÃ nh Ä‘á»™ng) â€” viá»‡c cá»§a ngÆ°á»i dÃ¹ng.

### LÆ°u Ã½
- `src/menu.css` trong working tree cÃ²n cÃ¡c dÃ²ng `.bd-*` (giao diá»‡n láº§n háº¡t, R2.2) chÆ°a commit tá»« trÆ°á»›c, khÃ´ng thuá»™c spec nÃ y nÃªn khÃ´ng Ä‘Æ°a vÃ o commit; cÅ©ng váº­y cho cÃ¡c file `server/`, `shared/`, `src/main.ts`, `src/menu.ts`, `src/data/news.ts`, `src/features/stats.ts`.

## R2.2 â€” Láº§n háº¡t 108 (giao diá»‡n láº§n trÃ ng háº¡t + thÆ°á»Ÿng vÃ²ng + má»‘c thÃ nh tá»±u)
Baseline: `main` sau commit `8d7fb8b`; khÃ´ng Ä‘á»•i schema DB.

### ÄÃ£ lÃ m
- **Server (`server/index.ts`):** `Session.beadStart?: number` (bá»™ nhá»›). `beads:start` ghi `Date.now()` (gá»i láº¡i = ghi Ä‘Ã¨), ack `{ ok: true }`. `beads:done` luÃ´n xÃ³a má»‘c; thiáº¿u má»‘c, `elapsed < 45_000` hoáº·c `> 30 phÃºt` â†’ `{ ok: false }`, khÃ´ng Ä‘áº¿m, khÃ´ng thÆ°á»Ÿng. Há»£p lá»‡: `countStatSafe(s, 'beads_rounds')` (luÃ´n Ä‘áº¿m, ká»ƒ cáº£ háº¿t lÆ°á»£t, má»‘c báº¯n qua `countStat`), rá»“i `claimMinigame(pid, 'lanhat', 5)`; náº¿u Ä‘Æ°á»£c thÆ°á»Ÿng: `merit = Math.round(10 Ã— meritBoost().mult)`, `grantRewards(s, merit, 5)`, `questEvent(s, 'beads')`. Ack `{ ok: true, rewarded, merit }`, rá»“i emit `beads { rewarded: minigameCount('lanhat') }`; cÅ©ng emit lÃºc join cáº¡nh `spin`. Háº±ng sá»‘ `BEAD_ROUND_MIN_MS`, `BEAD_ROUND_REWARD`, `BEAD_DAILY_CAP` Ä‘áº·t cáº¡nh `MINIGAMES` (khai bÃ¡o cá»¥c bá»™ trong khá»‘i connection, cÃ¹ng chá»— vá»›i `MG_COOLDOWN_MS`; `BEAD_ROUND_MAX_MS = 30 phÃºt` thÃªm cáº¡nh). NhÃ¡nh animation beads trong `action` giá»¯ nguyÃªn.
- **Má»Ÿ rá»™ng cÃ³ chá»§ Ä‘Ã­ch R1.4:** cÃ´ng Ä‘á»©c cá»§a vÃ²ng nhÃ¢n há»‡ sá»‘ giá» lá»… (`meritBoost`, `Math.round`), nháº¥t quÃ¡n vá»›i tháº¯p hÆ°Æ¡ng/tá»¥ng kinh. Xu (5) khÃ´ng nhÃ¢n.
- **Má»‘c (`shared/game.ts`):** thÃªm `bead5` (5 vÃ²ng, 20 xu), `bead25` (25, 50 xu + HÆ°Æ¡ng tráº§m), `bead100` (100, 120 xu + ÄÃ¨n hoa Ä‘Äƒng); kiá»ƒu `BeadsState`, `BeadsAck`. `stats.ts` thÃªm track thá»© 5 "ðŸ“¿ VÃ²ng háº¡t", Ä‘Æ¡n vá»‹ máº·c Ä‘á»‹nh láº¥y sá»‘, má»‘c tá»« `STAT_MILESTONES`.
- **Client:** `src/features/beads.ts` (`initBeads`, `openBeads`, `beadsPending`); nÃºt menu "Láº§n háº¡t" (icon `beads`) + cháº¥m Ä‘á» khi vÃ²ng Ä‘Ã£ thÆ°á»Ÿng hÃ´m nay < 5. Panel: vÃ²ng SVG 108 cháº¥m (háº¡t má»‘c 27/54/81 to hÆ¡n, tÃ´ Ä‘á» khi Ä‘Ã£ láº§n), háº¡t lá»›n 132px, sá»‘ Ä‘áº¿m `n / 108`, Space/cháº¡m/click (`pointerdown`). Láº§n cháº¡m Ä‘áº§u cá»§a vÃ²ng emit `beads:start` trÆ°á»›c khi Ä‘áº¿m; Ä‘á»§ 108 emit `beads:done` vÃ  hiá»‡n ba dáº¡ng dÃ²ng káº¿t quáº£ Ä‘Ãºng chá»¯ trong spec; nÃºt "Báº¯t Ä‘áº§u vÃ²ng má»›i". ÄÃ³ng panel: bá» vÃ²ng dá»Ÿ phÃ­a client, há»§y listener phÃ­m vÃ  nhá»‹p hiá»‡n diá»‡n.
- **Hiá»‡n diá»‡n trong phÃ²ng:** `MenuCtx.act(kind)` má»›i, `main.ts` ná»‘i vÃ o `doAction`. Khi vÃ²ng Ä‘ang dá»Ÿ, panel gá»i `ctx.act('beads')` ngay lÃºc báº¯t Ä‘áº§u rá»“i má»—i 2,5 giÃ¢y (cooldown phÃ­a game lÃ  2,4 giÃ¢y nÃªn khÃ´ng bá»‹ nuá»‘t); dá»«ng khi hoÃ n thÃ nh hoáº·c Ä‘Ã³ng panel. KhÃ´ng sá»­a animation beads.
- **News:** entry "Láº§n háº¡t 108" Ä‘á»©ng Ä‘áº§u, `LATEST_NEWS_ID` 4 â†’ 5.
- Ghi chÃº á»Ÿ má»¥c "UI Ä‘iá»‡n thoáº¡i" á»Ÿ trÃªn vá» cÃ¡c dÃ²ng `.bd-*` chÆ°a commit nay Ä‘Ã£ lá»—i thá»i: chÃºng Ä‘Æ°á»£c commit cÃ¹ng R2.2.

### Kiá»ƒm chá»©ng
- `npm run typecheck` pass.
- `node tools/steps-verify-beads.mjs` (DB táº¡m, server tháº­t; cÃ¡c ca cáº§n chá» cháº¡y song song nÃªn máº¥t má»™t láº§n chá» ~47 giÃ¢y, tá»•ng ~80 giÃ¢y): Táº¤T Cáº¢ PASS (27 kiá»ƒm tra): done khi chÆ°a start â†’ false, rounds 0; start rá»“i done ngay â†’ false; start láº¡i giá»¯a chá»«ng ghi Ä‘Ã¨ má»‘c (Ä‘Ã£ trÃ´i 20 giÃ¢y tá»« láº§n Ä‘áº§u váº«n bá»‹ cháº·n); vÃ²ng há»£p lá»‡ â†’ `{ ok: true, rewarded: true }`, cÃ´ng Ä‘á»©c +`Math.round(10 Ã— mult)` (lÃºc cháº¡y mult = 1 nÃªn +10), xu +5, rounds = 1, event `beads { rewarded: 1 }`; seed `beads_rounds = 4` â†’ vÃ²ng káº¿ nháº­n Ä‘Ãºng má»™t event `bead5`, xu +25 (5 vÃ²ng + 20 má»‘c), `claimStatReward('bead5')` láº§n hai = false; seed `minigame_daily lanhat = 5` â†’ `{ ok: true, rewarded: false, merit: 0 }`, rounds +1, cÃ´ng Ä‘á»©c/xu khÃ´ng Ä‘á»•i; reconnect â†’ `stats:get` cÃ³ beadsRounds 5 vÃ  claimed chá»©a `bead5`; há»“i quy incense `Math.round(1 Ã— mult)` + 1 xu, action `beads` khÃ´ng cÃ´ng Ä‘á»©c/xu vÃ  khÃ´ng Ä‘áº¿m vÃ²ng.
- áº¢nh (`tools/steps-r22-beads.mjs` qua `tools/shot.mjs`, DB táº¡m; `MODE=desktop|mobile`): `shots/r22-panel.png` (1280Ã—800, 54/108, háº¡t má»‘c 27/54 tháº¥y rÃµ), `shots/r22-done.png` (dÃ²ng "HoÃ n thÃ nh má»™t vÃ²ng Â· +10 cÃ´ng Ä‘á»©c Â· +5 xu" + nÃºt Báº¯t Ä‘áº§u vÃ²ng má»›i), `shots/r22-m-panel.png` (390Ã—844, háº¡t lá»›n 128px táº¡i y 335â€“463, `scrollWidth` cá»§a trang = 390, panel 338px trong tháº» 363px, khÃ´ng trÃ n).

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- Há»‡ sá»‘ giá» lá»… khÃ¡c Ã—1 chá»‰ kiá»ƒm Ä‘Æ°á»£c qua cÃ´ng thá»©c; E2E cháº¡y á»Ÿ mult thá»±c lÃºc cháº¡y (Ã—1).
- áº¢nh dÃ¹ng sá»± kiá»‡n `pointerdown` giáº£ láº­p qua CDP, chÆ°a thá»­ cháº¡m tháº­t trÃªn Ä‘iá»‡n thoáº¡i; chÆ°a kiá»ƒm tay phÃ­m Space ngoÃ i trÃ¬nh duyá»‡t headless.
- NgÃ y thÆ°á»Ÿng theo `dayKey()` UTC nhÆ° cÃ¡c minigame khÃ¡c (UI cÃ¡c nÆ¡i váº«n nÃ³i 07:00 VN).
- ChÆ°a deploy.

## Rider â€” bong bÃ³ng chat tÃ´ng kÃ­nh tá»‘i
- `src/character.ts::say()`: chá»‰ Ä‘á»•i 3 mÃ u. Ná»n `rgba(255,250,238,.97)` â†’ `rgba(38,24,14,.88)`, viá»n `rgba(120,80,30,.55)` â†’ `rgba(246,217,138,.75)`, chá»¯ `#2a170a` â†’ `#FAF3E3` (cÃ¹ng bá»™ `--glass`/`--gold2`/`--cream` cá»§a HUD). ÄuÃ´i bong bÃ³ng dÃ¹ng chung fillStyle cá»§a ná»n nÃªn tá»± Ä‘á»•i. KÃ­ch thÆ°á»›c canvas, font, ngáº¯t dÃ²ng, Ä‘uÃ´i, thá»i gian hiá»‡n, scale sprite vÃ  báº£ng tÃªn giá»¯ nguyÃªn. Ãp dá»¥ng cho má»i nhÃ¢n váº­t, ká»ƒ cáº£ NPC.
- `npm run typecheck` pass. áº¢nh `shots/bubble-dark.png` (390Ã—844, `?touch=1`, tin gá»­i qua form chat tháº­t, `tools/steps-bubble-dark.mjs`): ná»n nÃ¢u tá»‘i, viá»n vÃ ng nháº¡t, chá»¯ kem Ä‘á»c rÃµ, báº£ng tÃªn bÃªn dÆ°á»›i khÃ´ng Ä‘á»•i.
- ChÆ°a kiá»ƒm trÃªn Ä‘iá»‡n thoáº¡i tháº­t.

## VÃ¡ R2.2 â€” háº¡ sÃ n thá»i gian vÃ²ng háº¡t 45s â†’ 30s
- `server/index.ts`: `BEAD_ROUND_MIN_MS` 45_000 â†’ 30_000. LÃ½ do: ngÆ°á»i chÆ¡i tháº­t láº§n Ä‘á»§ 108 háº¡t trÃªn Ä‘iá»‡n thoáº¡i dÆ°á»›i 45 giÃ¢y vÃ  bá»‹ bÃ¡o "VÃ²ng chÆ°a há»£p lá»‡" (nhá»‹p báº¥m nhanh nháº¥t ~0,3 giÃ¢y/háº¡t â‰ˆ 32 giÃ¢y/vÃ²ng). Giá»¯ nguyÃªn má»i thá»© khÃ¡c: má»‘c háº¿t háº¡n 30 phÃºt, cap 5 vÃ²ng/ngÃ y, thÆ°á»Ÿng 10 cÃ´ng Ä‘á»©c/5 xu, cÃ¡ch Ä‘áº¿m stat, ná»™i dung chá»¯ trong panel.
- `tools/steps-verify-beads.mjs`: ca chá» há»£p lá»‡ tá»« ~46 giÃ¢y xuá»‘ng ~32 giÃ¢y; thÃªm ca biÃªn (done á»Ÿ ~29 giÃ¢y â†’ `{ ok: false }`, rounds = 0; done á»Ÿ ~32 giÃ¢y â†’ há»£p lá»‡); ca ghi Ä‘Ã¨ má»‘c Ä‘á»•i tá»« 20 giÃ¢y sang ~31 giÃ¢y. Káº¿t quáº£: Táº¤T Cáº¢ PASS 28/28 (trÆ°á»›c 27), tá»•ng ~59 giÃ¢y (trÆ°á»›c ~80 giÃ¢y). `npm run typecheck` pass.
- Grep code cÃ²n má»™t chá»— nháº¯c 45 giÃ¢y: `tools/steps-r22-beads.mjs` (script chá»¥p áº£nh, chá» 46,5 giÃ¢y vÃ  log "Ä‘á»§ 45s"). KhÃ´ng sá»­a vÃ¬ ngoÃ i pháº¡m vi spec; script váº«n cháº¡y Ä‘Ãºng vá»›i sÃ n má»›i, chá»‰ chá» lÃ¢u hÆ¡n cáº§n thiáº¿t. CÃ¡c má»¥c R2.2 phÃ­a trÃªn trong file nÃ y ghi 45 giÃ¢y lÃ  lá»‹ch sá»­, khÃ´ng sá»­a.
- KhÃ´ng Ä‘á»•i giao diá»‡n, khÃ´ng Ä‘á»•i tin "CÃ³ gÃ¬ má»›i" (`LATEST_NEWS_ID` giá»¯ 5).

## A2.1 â€” Má»Ÿ rá»™ng khuÃ´n viÃªn: ÄÃƒ XONG Â§1 (layout.ts) + Â§3 (hÃ nh lang + La HÃ¡n)
Nguá»“n thiáº¿t káº¿: `phan-a2/phan-a2-mo-rong-chua-online.md` (khÃ´ng cÃ³ file spec A2.1 riÃªng). Baseline: `main` sau commit `dfc0fcd`. Commit: `dce2a94` (layout), `dab445e` (hÃ nh lang + La HÃ¡n); Ä‘Ã£ push `origin/main`.

### ÄÃ£ lÃ m
- **Â§1 `src/layout.ts`:** `CORR.half` 1.9 â†’ 2.6 (hÃ nh lang rá»™ng 3.8 â†’ 5.2). `groundY()` vÃ  `src/features/map.ts` dÃ¹ng `CORR.half` nÃªn tá»± theo, khÃ´ng sá»­a thÃªm.
- **Â§3 `src/temple.ts` (khá»‘i hÃ nh lang):** mÃ¡i `slabG` rá»™ng 2.7 â†’ 3.4; cá»™t `off` Â±1.7 â†’ Â±2.4; vá»‹ trÃ­ táº¥m mÃ¡i `s * 1.18` â†’ `s * 1.62`; Ä‘Ã¨n lá»“ng `off` Â±1.15 â†’ Â±1.65; gháº¿ Ä‘Ã¡ `side * 1.3` â†’ `side * 1.7`; báº£ng hiá»‡u cá»™t `CORR.x - 1.7` â†’ `CORR.x - 2.4`.
- **La HÃ¡n:** 10 â†’ 6 tÆ°á»£ng má»—i bÃªn, `z = -16.5 + 3k` (k = 0..5), cÃ¡ch nhau 3, xáº¿p mÃ©p NGOÃ€I hÃ nh lang `x = side * CORR.x + side * 2.0`. Bá» `ARHAT_INNER` (khÃ´ng cÃ²n hÃ ng trong), cáº­p nháº­t comment tÆ°Æ¡ng á»©ng.
- **Collider:** thÃªm collider cho gháº¿ Ä‘Ã¡ hÃ nh lang (`r: 0.5`); collider tÆ°á»£ng La HÃ¡n giá»¯ `r: 0.42`, tá»± theo vá»‹ trÃ­ má»›i.

### Kiá»ƒm chá»©ng
- `npm run typecheck` pass; grep khÃ´ng cÃ²n tham chiáº¿u `ARHAT_INNER`.
- ChÆ°a chá»¥p áº£nh / chÆ°a cháº¡y game Ä‘á»ƒ nhÃ¬n hÃ nh lang má»›i; chÆ°a Ä‘á»‘i chiáº¿u cá»™t má»›i vá»›i `blocked()` (vÃ¹ng cáº¥m cÃ¢y/hoa quanh hÃ nh lang á»Ÿ `layout.ts` dÃ²ng 121, 143 cÃ²n theo bá» rá»™ng cÅ©).

### Pháº§n cÃ²n láº¡i cá»§a A2.1 (Â§4â€“Â§13), chia cho cÃ¡c session sau
Spec gá»‘c cá»§a `phan-a2/...md` Ä‘Ã¡nh sá»‘ theo má»¥c 1â€“9 (khÃ´ng cÃ³ Â§10â€“Â§13 trong file Ä‘á»c Ä‘Æ°á»£c); thá»© tá»± gÃ³i Ä‘á» xuáº¥t á»Ÿ má»¥c 9 cá»§a spec:
1. **A2.1 (tiáº¿p):** má»Ÿ map (tÆ°á»ng Â±62, Báº¯c âˆ’82), dá»i/ná»›i nhÃ  (hai viá»‡n, thiá»n Ä‘Æ°á»ng, phÃ²ng cÃ´ng Ä‘á»©c, vÆ°á»n phÃ³ng sinh, thÃ¡p nhá»), phá»‘ trÆ°á»›c cá»•ng, máº¡ng Ä‘Æ°á»ng 4 cáº¥p (má»¥c 1â€“2). ChÆ°a lÃ m: Ä‘á»•i `WALL`, tá»a Ä‘á»™ cÃ¡c nhÃ , `blocked()` cho vÃ¹ng má»›i.
2. **A2.2:** trá»‹ Ä‘Æ¡ trÃªn mÃ¡y tháº­t (merge mesh cho `buildHouse`/`extraHouse`/am cá»•, pre-warm, Ä‘o frame-time) + lá»—i láº» (chuÃ´ng treo ngÆ°á»£c, collider) â€” má»¥c 4 + 7.
3. **A2.3:** ná»™i tháº¥t 6 nhÃ  â€” má»¥c 3.
4. **A2.4:** Äiá»‡n Tam Tháº¿ + bá»™ ba tÆ°á»£ng â€” má»¥c 5.
5. **A2.5:** NPC má»Ÿ rá»™ng + ca trá»±c/nghá»‰ + di chuyá»ƒn theo máº¡ng Ä‘Æ°á»ng â€” má»¥c 6.

### Prompt sáºµn Ä‘á»ƒ má»Ÿ session má»›i lÃ m tiáº¿p Â§4 + Â§5
```
Äá»c HANDOFF.md (má»¥c "A2.1" cuá»‘i file) vÃ  phan-a2/phan-a2-mo-rong-chua-online.md má»¥c 4 (Trá»‹ Ä‘Æ¡ trÃªn mÃ¡y tháº­t) + má»¥c 5 (Äiá»‡n Tam Tháº¿ â€” dá»±ng tá»« zero). A2.1 Â§1 + Â§3 Ä‘Ã£ xong (CORR.half 2.6, 6 La HÃ¡n/bÃªn) â€” khÃ´ng lÃ m láº¡i.
Pháº¡m vi session nÃ y: CHá»ˆ má»¥c 4 vÃ  má»¥c 5 cá»§a spec. KhÃ´ng má»Ÿ rá»™ng sang má»Ÿ map, ná»™i tháº¥t, NPC.
Má»¥c 4: má»Ÿ rá»™ng mergeStaticByMaterial cho buildHouse, extraHouse, builder am cá»•; pre-warm (renderer.compile + náº¡p trÆ°á»›c texture báº£ng hiá»‡u); nghiá»‡m thu báº±ng frame-time trÃªn mÃ¡y tháº­t theo tuyáº¿n cá»‘ Ä‘á»‹nh qua 5 nhÃ , cÃ³ sá»‘ liá»‡u trÆ°á»›c/sau.
Má»¥c 5: dá»±ng Äiá»‡n Tam Tháº¿ táº¡i TAM_THE (0,-54): ná»n cao ~3.0, báº­c lÃªn tá»« Ä‘Æ°á»ng trá»¥c, bá»™ ba tÆ°á»£ng A Di ÄÃ  (trÃ¡i) - ThÃ­ch Ca (giá»¯a, lá»›n nháº¥t) - Di Láº·c (pháº£i), ban thá» phÃ­a trÆ°á»›c; máº«u tÆ°á»£ng theo Concept A Di ÄÃ .webp / Concept Di Láº·c.webp.
Sau khi xong: typecheck, commit theo cá»¥m, push, cáº­p nháº­t HANDOFF.md.
```

### LÆ°u Ã½
- Working tree cÃ²n nhiá»u file untracked khÃ´ng thuá»™c pháº¡m vi (áº£nh `shots/*.png`, `Báº£n Ä‘á»“ Pháº§n A2 v7.png`, `Concept *.webp` á»Ÿ gá»‘c vÃ  trong `phan-a2/`); khÃ´ng Ä‘Æ°a vÃ o commit.

## A2.1 (tiáº¿p) â€” ÄÃƒ XONG Â§1 cÃ²n láº¡i + Â§4 + Â§5 (layout, nhÃ , hÃ ng rÃ o + cá»•ng hai viá»‡n)
Nguá»“n: `spec-a2-1-mo-rong-ban-do-chua-online.md`. Baseline: `d58bdea`.

### ÄÃ£ lÃ m
- **`src/layout.ts`:** `WALL` x 62 / zN -82 / zS 45; dá»i `PAGODA`, `NHA_TO`, `TANG_XA` (gá»™p), `AM_CO`, `NHA_KHACH`, `THIEN_DUONG`, `TRAI_DUONG`, `VUON_THAP` theo spec; thÃªm `PHONG_CD`, `VIEN_KT`, `VIEN_TO`, `PS`, `PS_POND`, `PS_PIER`, `inPsPond`; xÃ³a `TANG_XA_TAY*`, `TRAI_DUONG_DOOR`. Cáº­p nháº­t `groundY` (PHONG_CD_PLAT, báº¿n PS_PIER), `blocked`, `clampToCompound` (má»Ÿ lá»‘i ra phá»‘, cháº·n xuyÃªn tÆ°á»ng hai chiá»u), `resolveWater` (ao phÃ³ng sinh).
- **`src/temple.ts` Â§4:** Ä‘á»•i kÃ­ch thÆ°á»›c nhÃ  tá»•/tÄƒng xÃ¡/nhÃ  khÃ¡ch; thiá»n Ä‘Æ°á»ng xoay hÆ°á»›ng ÄÃ´ng (`ry = Ï€/2`, collider hoÃ¡n Ä‘á»•i trá»¥c); trai Ä‘Æ°á»ng dá»±ng báº±ng `extraHouse`; thÃªm PhÃ²ng Ghi CÃ´ng Äá»©c; xÃ³a háº³n `longHouse`.
- **`src/temple.ts` Â§5:** `buildVienFence` cho hai viá»‡n (InstancedMesh, bÃ¡m `groundY`, collider r 0.6 cÃ¡ch â‰¤1.1, cá»•ng rá»™ng 3.2 cÃ³ trá»¥ + biá»ƒn). Máº¡ng `pathRect` cÅ© thay báº±ng Ä‘Æ°á»ng má»›i (vÃ nh Ä‘ai, Ä‘Æ°á»ng háº­u, cá»•ng viá»‡n, báº¿n phÃ³ng sinh, thiá»n Ä‘Æ°á»ng, Ä‘iá»‡n máº«u, phÃ²ng cÃ´ng Ä‘á»©c, báº£o thÃ¡p).

### Kiá»ƒm chá»©ng
- `npm run typecheck` + `npm run build` sáº¡ch; grep khÃ´ng cÃ²n `longHouse`/`TANG_XA_TAY*`/`TRAI_DUONG_DOOR`; `tools/npc-sim.mjs` (cháº¡y qua `npx tsx`) cháº¡y bÃ¬nh thÆ°á»ng vá»›i layout má»›i.
- ChÆ°a chá»¥p áº£nh, chÆ°a Ä‘i bá»™ kiá»ƒm trong game.

### ChÆ°a lÃ m (cÃ²n láº¡i cá»§a spec A2.1)
Â§6 VÆ°á»n PhÃ³ng Sinh (dá»±ng cáº£nh), Â§7 phá»‘ trÆ°á»›c cá»•ng, Â§8 pháº§n map.ts, tin tá»©c, hÃ nh lang La HÃ¡n Ä‘Ã£ xong á»Ÿ phiÃªn trÆ°á»›c; script chá»¥p `a21-*.png`.

## A2.1 (lÃ¡t 4) â€” ÄÃƒ XONG Â§10 báº£n Ä‘á»“ + Â§11 tin tá»©c + Â§12 nghiá»‡m thu
Baseline: `ba8b0c1`. Commit: `3cc7dbd` (map.ts), `5eb81d5` (news.ts, `LATEST_NEWS_ID` 5 â†’ 6).

### ÄÃ£ lÃ m
- **`src/features/map.ts`:** khung báº£n Ä‘á»“ riÃªng x âˆ’66..66, z âˆ’88..64; `PLACES` dÃ¹ng Ä‘iá»ƒm trÆ°á»›c cá»­a (NhÃ  khÃ¡ch, TÄƒng xÃ¡, Trai Ä‘Æ°á»ng, NhÃ  Tá»•, Am Cá»•) vÃ  thÃªm Thiá»n Ä‘Æ°á»ng, PhÃ²ng Ghi CÃ´ng Äá»©c, VÆ°á»n PhÃ³ng Sinh, Äiá»‡n Máº«u, Äá»n TrÃ¬nh; `drawStatic` váº½ láº¡i hai viá»‡n, vÆ°á»n phÃ³ng sinh + ao, phá»‘ trÆ°á»›c cá»•ng, cÃ¡c nhÃ  theo `*_PLAT`.
- **`src/data/news.ts`:** má»¥c "Má»Ÿ rá»™ng khuÃ´n viÃªn chÃ¹a", `LATEST_NEWS_ID` = 6.
- **Script nghiá»‡m thu:** `tools/steps-a21.mjs` (chá»¥p 8 áº£nh `shots/a21-*.png`, Ä‘áº¿m La HÃ¡n) vÃ  `tools/steps-a21-walk.mjs` (Ä‘i bá»™ kiá»ƒm báº±ng mÃ´ phá»ng `collide` cá»§a game, dt cá»‘ Ä‘á»‹nh 0.05, khÃ´ng phá»¥ thuá»™c FPS).

### Kiá»ƒm chá»©ng
- `npm run typecheck` sáº¡ch. `tools/steps-verify-beads.mjs` (server tháº­t) Táº¤T Cáº¢ PASS.
- 8 áº£nh `a21-overview/vien-kt/vien-to/thien-duong/phong-sinh/pho/hanh-lang/map.png` Ä‘Ã£ chá»¥p.
- **Sá»‘ tÆ°á»£ng La HÃ¡n Ä‘áº¿m Ä‘Æ°á»£c:** TÃ¢y 6, ÄÃ´ng 6 (tá»•ng 12).
- **Äi bá»™ kiá»ƒm 19/19 PASS:** cá»•ng Nam ra phá»‘ vÃ  quay vÃ o; vÃ o cá»•ng Viá»‡n KhÃ¡ch TÄƒng vÃ  Viá»‡n Tá»•; tá»›i cá»­a NhÃ  khÃ¡ch (âˆ’47,âˆ’57.5), TÄƒng xÃ¡, Trai Ä‘Æ°á»ng, NhÃ  Tá»•, Am Cá»•, Thiá»n Ä‘Æ°á»ng, PhÃ²ng Ghi CÃ´ng Äá»©c, Äiá»‡n Máº«u (39,13), Äá»n TrÃ¬nh; Ä‘á»©ng Ä‘Æ°á»£c trÃªn báº¿n phÃ³ng sinh (28,âˆ’31) vÃ  (33,âˆ’31); khÃ´ng xuyÃªn tÆ°á»ng Nam (cáº£ hai chiá»u), khÃ´ng xuyÃªn rÃ o Viá»‡n KT vÃ  Viá»‡n Tá»•.

### Lá»‡ch so vá»›i spec / ghi chÃº
- Cá»­a NhÃ  khÃ¡ch thá»±c táº¿ quay Nam (`z + hz`), cá»™t máº·t tiá»n cháº¯n phÃ­a Báº¯c: Ä‘iá»ƒm "trÆ°á»›c cá»­a" spec ghi (âˆ’47,âˆ’55.5) náº±m sÃ¡t hÃ ng cá»™t á»Ÿ z âˆ’54; Ä‘i bá»™ kiá»ƒm dÃ¹ng Ä‘iá»ƒm (âˆ’47,âˆ’57.5) vÃ  lá»™ trÃ¬nh vÃ²ng tá»« phÃ­a Nam.
- Cá»­a Äiá»‡n Máº«u (39,10) náº±m trong nhÃ ; hÃ ng cá»™t Báº¯c á»Ÿ z 7.8, máº·t há»Ÿ phÃ­a Nam (z â‰ˆ 12.2): Ä‘iá»ƒm kiá»ƒm dÃ¹ng (39,13), vÃ o tá»« phÃ­a ÄÃ´ngâ€“Nam. `PLACES` váº«n giá»¯ (39,10) theo spec; `goTo` dÃ¹ng `planPath` nÃªn tá»± vÃ²ng Ä‘Æ°á»£c.
- Chrome headless (SwiftShader) chá»‰ Ä‘áº¡t ~1â€“1.7 FPS nÃªn Ä‘i bá»™ kiá»ƒm qua `goTo` tháº­t bá»‹ cháº­m; Ä‘Ã£ chuyá»ƒn sang mÃ´ phá»ng trong trang vá»›i Ä‘Ãºng logic collider cá»§a game.
- NgÆ°á»¡ng kiá»ƒm "khÃ´ng xuyÃªn tÆ°á»ng Nam tá»« phá»‘ vÃ o" lÃ  z > 45.4 (collider cá»™t tÆ°á»ng r 0.55 + bÃ¡n kÃ­nh ngÆ°á»i 0.4 giá»¯ á»Ÿ z â‰ˆ 45.8).

## A2.4 â€” Äiá»‡n Tam Tháº¿ + chá»‰nh nhÃ£n báº£n Ä‘á»“ + camera trong Ä‘iá»‡n
Baseline: `0ba70ff`. Thay Ä‘á»•i táº­p trung á»Ÿ `src/tamthe.ts` (má»›i), `src/temple.ts`, `src/layout.ts`, `src/couplets.ts`, `src/features/map.ts`, `src/main.ts`.

### ÄÃ£ lÃ m
- **Äiá»‡n Tam Tháº¿** táº¡i `TAM_THE` (0,âˆ’54), dá»±ng trong `src/tamthe.ts` vÃ  gáº¯n vÃ o `temple.ts` (zone `tamThe`, cÃ¢u Ä‘á»‘i trong `couplets.ts`). Ná»n cao ~3.0, Ä‘i Ä‘Æ°á»£c tá»« tam quan lÃªn qua cÃ¡c báº­c (Ä‘á»™ cao 0 â†’ 1.35 â†’ 3.0), bá»™ ba tÆ°á»£ng A Di ÄÃ  â€“ ThÃ­ch Ca â€“ Di Láº·c.
- **`src/features/map.ts`:** thÃªm báº£ng `LABEL_DZ` Ä‘á»ƒ dá»i nhÃ£n riÃªng tá»«ng Ä‘á»‹a Ä‘iá»ƒm, háº¿t chá»“ng nhÃ£n: Äiá»‡n Tam Tháº¿ (âˆ’7), Báº£o thÃ¡p (4.5), VÆ°á»n ThÃ¡p (âˆ’3.5), NhÃ  Tá»• (4), SÃ¢n thiá»n trÃ¡i/pháº£i (âˆ’2.5); Há»“ cÃ¡ koi vÃ  Cáº§u cong giá»¯ nhÆ° cÅ©.
- **`src/main.ts`:** camera bÃ¹ khi vÃ o zone `tamThe`: biáº¿n `camInside` (mÆ°á»£t, há»‡ sá»‘ `dt * 3`) cá»™ng thÃªm 3.5 vÃ o khoáº£ng cÃ¡ch vÃ  0.18 vÃ o gÃ³c nÃ¢ng; vá»‹ trÃ­ vÃ  Ä‘iá»ƒm nhÃ¬n camera cá»™ng thÃªm `root.position.y` Ä‘á»ƒ bÃ¡m Ä‘á»™ cao ná»n Ä‘iá»‡n.

### Kiá»ƒm chá»©ng
- `npm run typecheck` sáº¡ch.
- `tools/steps-tamthe.mjs` (`STEPS=./steps-tamthe.mjs`, cháº¡y báº±ng `shot.mjs`): nhÃ¢n váº­t Ä‘i tá»« tam quan lÃªn ná»n Ä‘iá»‡n (y = 3), zone `tamThe`, cÃ¢u Ä‘á»‘i hiá»‡n. áº¢nh nghiá»‡m thu `shots/tamthe4-tamthe-map-after.png` (nhÃ£n báº£n Ä‘á»“ Ä‘á»c rÃµ) vÃ  `shots/tamthe4-tamthe-inside.png` (tháº¥y Ä‘á»§ ba tÆ°á»£ng, khÃ´ng bá»‹ che). CÃ¡c áº£nh `tamthe-*`, `tamthe2-*`, `tamthe3-*` lÃ  cÃ¡c láº§n chá»¥p trung gian.
- Gapdump `vuonThap` cÃ²n `remaining=40` vÃ  `pagoda` cÃ²n `remaining=5` (Ä‘Ã£ cÃ³ tá»« trÆ°á»›c, khÃ´ng thuá»™c pháº¡m vi láº§n nÃ y).

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- Má»©c bÃ¹ camera (3.5 / 0.18) chá»‰nh báº±ng máº¯t trÃªn áº£nh headless, chÆ°a thá»­ trÃªn mÃ¡y tháº­t hay Ä‘iá»‡n thoáº¡i.
- `LABEL_DZ` dá»i nhÃ£n theo tá»«ng tÃªn cá»¥ thá»ƒ; thÃªm Ä‘á»‹a Ä‘iá»ƒm má»›i cÃ³ thá»ƒ cáº§n bá»• sung á»Ÿ Ä‘Ã¢y.
- ChÆ°a cháº¡y láº¡i Ä‘i bá»™ kiá»ƒm toÃ n khuÃ´n viÃªn sau thay Ä‘á»•i camera (khÃ´ng Ä‘á»¥ng collider).
- ChÆ°a deploy.
- Tin tá»©c: thÃªm entry "Äiá»‡n Tam Tháº¿", `LATEST_NEWS_ID` 6 â†’ 7.

## A2.5 â€” LÃ m mÆ°á»£t chuyá»ƒn Ä‘á»™ng nhÃ¢n váº­t (accel/decel + bÆ°á»›c chÃ¢n khá»›p tá»‘c Ä‘á»™)
Chá»‰ Ä‘á»¥ng `src/main.ts` (vÃ²ng láº·p `loop()`), `src/character.ts`, `src/data/news.ts`. KhÃ´ng Ä‘á»•i collider, layout hay máº¡ng.

### ÄÃ£ lÃ m
- **`src/main.ts`:** thÃªm tráº¡ng thÃ¡i `curSpeed`, `moveDir`, `gaitPhase` vÃ  hÃ m `rampSpeed(target, dt)`. TÄƒng/giáº£m tá»‘c ~0.25 s (háº±ng `ACCEL_S`, `DECEL_S`, tá»‘c Ä‘á»™ tráº§n `RUN_SPEED`), dÃ¹ng chung cho phÃ­m, joystick vÃ  click-to-move. Tháº£ phÃ­m váº«n trÆ°á»£t tiáº¿p theo `moveDir` rá»“i dá»«ng dáº§n.
- **Quay Ä‘áº§u >90Â°:** khi `curSpeed > 0.5` vÃ  hÆ°á»›ng má»›i ngÆ°á»£c `moveDir` thÃ¬ `targetSpeed = 0`, giá»¯ `moveDir` cÅ© cho tá»›i khi gáº§n dá»«ng rá»“i má»›i nháº­n hÆ°á»›ng má»›i.
- **Tá»›i Ä‘Ã­ch click/planPath:** `targetSpeed` giáº£m theo quÃ£ng Ä‘Æ°á»ng cÃ²n láº¡i (`ARRIVE_DIST` = 1.5, sÃ n 0.12 tá»‘c Ä‘á»™); dá»«ng á»Ÿ waypoint cuá»‘i khi `wpDist < 0.9` vÃ  (cháº­m hoáº·c hÆ°á»›ng Ä‘Ã£ Ä‘áº£o ngÆ°á»£c) Ä‘á»ƒ háº¿t dao Ä‘á»™ng quanh Ä‘Ã­ch.
- **`src/character.ts`:** thÃªm trÆ°á»ng `gait` (pha bÆ°á»›c theo quÃ£ng Ä‘Æ°á»ng, `-1` khi khÃ´ng dÃ¹ng). Vá»›i anim walk/run pha chÃ¢n láº¥y tá»« `gait % 1` thay vÃ¬ thá»i gian clip, nÃªn bÆ°á»›c chÃ¢n khá»›p tá»‘c Ä‘á»™ vÃ  khÃ´ng reset khi Ä‘á»•i anim. `gaitPhase += curSpeed * dt / STRIDE_M` vá»›i `STRIDE_M = WALK_SPEED * 1.24`.

### Kiá»ƒm chá»©ng
- `npm run typecheck` vÃ  `npm run build` sáº¡ch.
- `tools/steps-smooth4.mjs` (`STEPS=./steps-smooth4.mjs`, cháº¡y báº±ng `shot.mjs` vá»›i viewport 320x200): Ä‘o `curSpeed`/pha theo frame mÃ´ phá»ng. TÄƒng tá»‘c 0 â†’ 3.8 Ä‘Ãºng giá»›i háº¡n accel*dt, giáº£m tá»‘c vá» 0, phanh quay Ä‘áº§u 3.8 â†’ 2.4 â†’ 1 â†’ 0 rá»“i tÄƒng tá»‘c láº¡i hÆ°á»›ng ngÆ°á»£c, pha bÆ°á»›c liÃªn tá»¥c. áº¢nh `shots/smooth4-turn-end.png`.

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- Headless chá»‰ ~3 FPS nÃªn `dt` bá»‹ cháº·n 0.05 vÃ  váº­n tá»‘c theo giá» thá»±c khÃ´ng Ä‘o Ä‘Æ°á»£c; sá»‘ liá»‡u dá»±a trÃªn bÆ°á»›c mÃ´ phá»ng, chÆ°a thá»­ cáº£m giÃ¡c trÃªn mÃ¡y tháº­t hay Ä‘iá»‡n thoáº¡i.
- Háº±ng sá»‘ 0.25 s, `ARRIVE_DIST` vÃ  ngÆ°á»¡ng phanh quay Ä‘áº§u chá»‰nh theo sá»‘ liá»‡u, chÆ°a tinh chá»‰nh báº±ng tay.
- Animation khÃ¡c (ngá»“i, láº¡y, NPC) khÃ´ng Ä‘á»•i; NPC/remote váº«n dÃ¹ng pha theo thá»i gian vÃ¬ `gait = -1`.
- ChÆ°a deploy.
- Tin tá»©c: thÃªm entry "Chuyá»ƒn Ä‘á»™ng mÆ°á»£t hÆ¡n", `LATEST_NEWS_ID` 7 â†’ 8.

## A2.6 â€” TÆ°á»£ng Pháº­t scan vÃ ng bÃ³ng á»Ÿ VÆ°á»n ThÃ¡p
Chá»‰ Ä‘á»¥ng `src/statue-scan.ts` (má»›i), `src/world.ts`, `src/main.ts`, `src/data/news.ts`, `public/models/seated-buddha.glb`, `tools/steps-statue-scan*.mjs`, `shots/statue-scan-*.png`.

### ÄÃ£ lÃ m
- **`public/models/seated-buddha.glb`:** táº£i tá»« https://www.yeldabalta.com/models/seated-buddha.glb, 10.282.820 byte, SHA-256 khá»›p `cb326ff9...0c78be` (CC0, Cleveland Museum of Art).
- **`src/statue-scan.ts`:** `buildSeatedBuddhaStatue(scene, renderer, colliders)` dá»±ng bá»‡ Ä‘Ã¡ procedural (1,9Ã—1,9Ã—0,55 + mÅ© bá»‡) táº¡i tá»a Ä‘á»™ cá»¥c bá»™ (âˆ’5,4; 2,3) trong VÆ°á»n ThÃ¡p (tháº¿ giá»›i â‰ˆ 43,6; âˆ’60,7), náº¡p GLB qua `loadModel`, phá»§ vÃ ng bÃ³ng (0xD4AF37, metalness 1, roughness 0,2) vá»›i `envMap` cá»¥c bá»™ tá»« `RoomEnvironment` + PMREM (scene khÃ´ng cÃ³ environment nÃªn metalness 1 sáº½ render Ä‘en; khÃ´ng Ä‘á»•i `scene.environment`). TÆ°á»£ng cao 1,6 m trÃªn bá»‡, cáº£ khá»‘i ~2,3 m. Lá»—i hoáº·c thiáº¿u file: `console.warn` vÃ  giá»¯ khá»‘i Ä‘Ã¡ giá»¯ chá»—, khÃ´ng crash. Collider r 1,2.
- **`src/world.ts` / `src/main.ts`:** `createWorld(renderer)` nháº­n renderer vÃ  gá»i `buildSeatedBuddhaStatue` sau `buildTemple`.

### Kiá»ƒm chá»©ng
- `npm run typecheck` vÃ  `npm run build` sáº¡ch.
- `tools/steps-statue-scan.mjs`: áº£nh `shots/statue-scan-wide.png`, `statue-scan-close.png`, `statue-scan-map.png`; zone `vuonThap` vÃ  popup hiá»‡n.
- `tools/steps-statue-scan-walk.mjs`: mÃ´ phá»ng 7.434 Ä‘iá»ƒm quanh tÆ°á»£ng vá»›i collider tháº­t, `minD` 1,6, 0 Ä‘iá»ƒm xuyÃªn.

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- ChÆ°a Ä‘o FPS trÃªn mÃ¡y tháº­t (headless SwiftShader chá»‰ ~1â€“3 FPS); GLB náº·ng cáº§n theo dÃµi trÃªn Ä‘iá»‡n thoáº¡i.
- Cá»¡ tÆ°á»£ng vÃ  vá»‹ trÃ­ chá»‰nh báº±ng máº¯t trÃªn áº£nh headless.
- Gapdump `vuonThap` váº«n `remaining=40` (cÃ³ tá»« trÆ°á»›c).
- ChÆ°a deploy.
- Tin tá»©c: thÃªm entry "TÆ°á»£ng Pháº­t vÃ ng á»Ÿ VÆ°á»n ThÃ¡p", `LATEST_NEWS_ID` 8 â†’ 9.
## A2.7 â€” Sá»­a biÃªn Ä‘i láº¡i phÃ­a Báº¯c (vÃ o Ä‘Æ°á»£c Am Cá»•)
Chá»‰ Ä‘á»¥ng `shared/types.ts`, `src/main.ts`, `server/index.ts`, `src/data/news.ts`, `tools/steps-a22-*.mjs`.

### NguyÃªn nhÃ¢n
- `MAP_HALF = 68` káº¹p `z` vá» `[-68, 68]` á»Ÿ client (`src/main.ts`) vÃ  server (`server/index.ts`), trong khi tÆ°á»ng Báº¯c á»Ÿ `WALL.zN = -82`. VÃ¹ng z âˆˆ [-82, -68] khÃ´ng Ä‘i vÃ o Ä‘Æ°á»£c nÃªn Am Cá»• (z = -75) bá»‹ cáº¯t; nhÃ¢n váº­t bá»‹ Ã©p vá» Ä‘Ãºng z = -68 trÃªn má»i x.

### ÄÃ£ lÃ m
- `shared/types.ts`: thÃªm `MAP_Z_MIN = -82`, giá»¯ nguyÃªn `MAP_HALF` (cÃ²n dÃ¹ng Ä‘á»ƒ ráº£i cÃ¢y/hoa trong `src/world.ts`).
- `src/main.ts` vÃ  `server/index.ts`: káº¹p `z` báº±ng `[MAP_Z_MIN, MAP_HALF]`.

### Kiá»ƒm chá»©ng
- `npm run typecheck` sáº¡ch.
- `tools/steps-a22-verify.mjs`: dá»‹ch chuyá»ƒn tá»›i z = -70/-75/-80 giá»¯ nguyÃªn vá»‹ trÃ­, z = -85 káº¹p vá» -81.06 (`clampToCompound`); `walkTo(48,-75)` tá»›i (48.26, -74.53) sÃ¡t cá»­a ÄÃ´ng Am Cá»• rá»“i dá»«ng á»Ÿ collider tÆ°á»ng bÃªn. áº¢nh `shots/a22-amco-amco-inside.png` hiá»‡n popup Am Cá»•.
- ÄÃ£ Ä‘o Ä‘i bá»™ táº¡i gháº¿ (`woodBench`), tÆ°á»ng NhÃ  KhÃ¡ch, TÄƒng XÃ¡, NhÃ  Tá»•, hÃ ng La HÃ¡n: khÃ´ng xuyÃªn collider.

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- Headless chá»‰ ~2 FPS nÃªn cÃ¡c ca Ä‘o Ä‘i bá»™ dÃ i dá»«ng sá»›m do thiáº¿u thá»i gian, khÃ´ng pháº£i do collider; chÆ°a thá»­ trÃªn mÃ¡y tháº­t.
- `npm run dev` (concurrently -k) tá»± táº¯t khi `dev:server` thoÃ¡t; Ä‘Ã£ cháº¡y `dev:server` vÃ  `dev:client` riÃªng Ä‘á»ƒ Ä‘o.
- ChÆ°a cháº¡y `npm run build`. ChÆ°a deploy.
- Tin tá»©c: thÃªm entry "Äi Ä‘Æ°á»£c tá»›i Am Cá»•", `LATEST_NEWS_ID` 11 â†’ 12.

## A2.3 â€” Ná»™i tháº¥t 7 nhÃ 
Chá»‰ Ä‘á»¥ng `src/temple.ts`, `src/data/news.ts`, `HANDOFF.md`.

### Äá»‘i chiáº¿u code (khÃ¡c spec cÅ©)
- CÃ³ **7 nhÃ **, khÃ´ng pháº£i 6 (nhÃ  tá»•, tÄƒng xÃ¡, am cá»•, nhÃ  khÃ¡ch, thiá»n Ä‘Æ°á»ng, trai Ä‘Æ°á»ng, phÃ²ng cÃ´ng Ä‘á»©c). Äiá»‡n Máº«u khÃ´ng cÃ³ ná»™i tháº¥t.
- **KhÃ´ng cÃ³ báº¿p** á»Ÿ trai Ä‘Æ°á»ng trong code, nÃªn khÃ´ng xÃ¢y báº¿p.
- **KhÃ´ng cÃ³ model mÃµ 3D** cÃ³ sáºµn (chá»‰ cÃ³ Ã¢m thanh vÃ  minigame), mÃµ Ä‘Æ°á»£c dá»±ng má»›i báº±ng primitives.
- `server/npcs.ts` khÃ´ng cÃ³ logic nghá»‰/giÆ°á»ng NPC; gÃ³i nÃ y chá»‰ Ä‘áº·t giÆ°á»ng vÃ  ghi tá»a Ä‘á»™ bÃªn dÆ°á»›i, khÃ´ng ná»‘i NPC, khÃ´ng Ä‘Äƒng kÃ½ giÆ°á»ng lÃ m `seats`.

### ÄÃ£ lÃ m
- Má»¥c `// ---- A2.3 interiors ----` trong `src/temple.ts` (sau `void pcd;`): 5 group `<tÃªn-nhÃ >-in` (nha-khach-in, tang-xa-in, trai-duong-in, nha-to-in, thien-duong-in) vÃ  phong-cong-duc-in; má»—i group gá»i `mergeStaticByMaterial` rá»“i `scene.add`, dÃ¹ng chung `woodM`/`matM`/`cushM`/`c.goldM` vÃ  má»™t `lamb` cho má»—i mÃ u giáº¥y/má»±c.
- Am Cá»•: props thÃªm tháº³ng vÃ o group `amCo` trÆ°á»›c `mergeStaticByMaterial(amCo)`.
- Thiá»n Ä‘Æ°á»ng: 10 bá»“ Ä‘oÃ n Ä‘Äƒng kÃ½ vÃ o `seats` (tá»a Ä‘á»™ world qua `twd()`, `ry = 3Ï€/2`, khÃ´ng `rest`).
- Collider chá»‰ cho váº­t lá»›n (bÃ n trÃ , giÆ°á»ng, bÃ n dÃ i, ban thá» tá»•, ká»‡, mÃµ); lá»‘i vÃ o giá»¯a vÃ  lá»‘i Ä‘i giá»¯a thiá»n Ä‘Æ°á»ng thÃ´ng.

### Mesh/tri trÆ°á»›c/sau tá»«ng nhÃ 
| NhÃ  | TrÆ°á»›c | Sau |
| --- | --- | --- |
| NhÃ  Tá»• | chÆ°a Ä‘o | chÆ°a Ä‘o |
| TÄƒng XÃ¡ | chÆ°a Ä‘o | chÆ°a Ä‘o |
| Am Cá»• | chÆ°a Ä‘o | chÆ°a Ä‘o |
| NhÃ  KhÃ¡ch | chÆ°a Ä‘o | chÆ°a Ä‘o |
| Thiá»n ÄÆ°á»ng | chÆ°a Ä‘o | chÆ°a Ä‘o |
| Trai ÄÆ°á»ng | chÆ°a Ä‘o | chÆ°a Ä‘o |
| PhÃ²ng Ghi CÃ´ng Äá»©c | chÆ°a Ä‘o | chÆ°a Ä‘o |

Sá»‘ mesh/tri thá»±c táº¿ tá»«ng nhÃ : chÆ°a Ä‘o (khÃ´ng cÃ³ quyá»n cháº¡y dev server trong lÆ°á»£t viáº¿t patch nÃ y). Cáº§n Ä‘o báº±ng `renderer.info` trÆ°á»›c/sau trÃªn mÃ¡y tháº­t hoáº·c headless rá»“i Ä‘iá»n báº£ng.

### Tá»a Ä‘á»™ giÆ°á»ng TÄƒng XÃ¡ (chÆ°a ná»‘i NPC)
- 2 giÆ°á»ng TÄƒng XÃ¡, tÃ¢m world: **(-44, -73.05)** vÃ  **(-38, -73.05)**, máº·t giÆ°á»ng (máº·t chiáº¿u) y = 0.6, Ä‘áº§u giÆ°á»ng hÆ°á»›ng Báº¯c (Ä‘áº§u giÆ°á»ng á»Ÿ z = -73.4).
- Gháº¿ trá»±c PhÃ²ng Ghi CÃ´ng Äá»©c, tÃ¢m world **(-42, 32.6)** (local (0, -2.4) tá»« `PHONG_CD = {x: -42, z: 35}`).
- GiÆ°á»ng Am Cá»•: local `(-acHx + 0.9, acBase + 0.325, 0)` â†’ world **(51.7, -75)**, máº·t giÆ°á»ng (máº·t chiáº¿u) y = 0.7 (acBase = 0.35).

### Kiá»ƒm chá»©ng
- ChÆ°a cháº¡y `npm run typecheck`, `npm run build`, chÆ°a chá»¥p áº£nh (khÃ´ng cÃ³ cÃ´ng cá»¥). Cáº§n cháº¡y láº¡i vÃ  kiá»ƒm tra báº±ng máº¯t tá»«ng nhÃ  trÆ°á»›c khi merge.
- Cáº§n kiá»ƒm tra: bá»“ Ä‘oÃ n Thiá»n ÄÆ°á»ng ngá»“i Ä‘Æ°á»£c vÃ  hÆ°á»›ng ngá»“i Ä‘Ãºng (nhÃ¬n vá» phÃ­a tÆ°á»ng háº­u), props khÃ´ng Ä‘Ã¨ lÃªn bÃ n thá» cÃ³ sáºµn á»Ÿ tÆ°á»ng háº­u, lá»‘i vÃ o giá»¯a má»—i nhÃ  váº«n thÃ´ng.

### ChÆ°a cháº¯c cháº¯n / viá»‡c cÃ²n treo
- Tá»a Ä‘á»™ `seats` cá»§a Thiá»n ÄÆ°á»ng suy ra tá»« `twd()` vá»›i `ry = 3Ï€/2`; chÆ°a xÃ¡c nháº­n báº±ng cÃ¡ch ngá»“i thá»­.
- Collider lÃ  Æ°á»›c lÆ°á»£ng báº±ng tay, chÆ°a Ä‘o Ä‘i bá»™.
- ChÆ°a deploy.
- Tin tá»©c: thÃªm entry "Ná»™i tháº¥t trong 7 nhÃ ", `LATEST_NEWS_ID` 12 â†’ 13.
