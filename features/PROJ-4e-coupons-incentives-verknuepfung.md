# PROJ-4e: Coupons & Incentives – sinnvolle Verknüpfung

## Status: ✅ Implementiert

## Kontext & Abhängigkeiten

- **PROJ-4** (Kundensegmente & Marketing-Automation): Segmente, Ausspielkanäle (E-Mail, In-App), Workflows, Incentive-Zuweisung
- **PROJ-2** (Motto-Wochen / Promotion-Banner): Wieder verwendbare Banner pro KW, Karussell oberhalb des Speiseplans
- **Bestand:** Coupon-Modell (code, type, discountValue, maxUsesPerUser, locationId, …), Wallet/Guthaben, CouponRedemption

---

## Vision: Einheitliches Incentive-System

**Incentives** sind Anreize, die Kunden erhalten – entweder als **Coupon** (Rabatt-/Gutscheincode) oder als **Guthaben** (Wallet-Gutschrift). Die Verknüpfung soll:

1. **Keine Duplikate:** Bestehende Coupons und Wallet-Logik wiederverwenden
2. **Segmentgenau:** Incentives nur an die richtige Zielgruppe ausspielen
3. **Tracking:** Nachvollziehbar, wer welchen Incentive wann erhalten und eingelöst hat
4. **Flexibilität:** Öffentliche Coupons (z. B. Motto-Woche) und personalisierte Incentives aus einer Hand

---

## Klarstellung: Coupon vs. Incentive vs. Promotion-Banner

| Begriff | Beschreibung | Ausspielung |
|---------|--------------|-------------|
| **Coupon** | Technische Einheit: Code, Rabatt, Gültigkeit, maxUses, etc. | Kann öffentlich (z. B. im Banner) oder nur für Segment sichtbar sein |
| **Incentive** | Fachlicher Begriff: Belohnung für ein Segment (Coupon oder Guthaben) | Segmentbasiert, per Workflow oder Kampagne ausgelöst |
| **Promotion-Banner** (PROJ-2) | Sichtbare Aktion auf der Menü-Seite (Motto-Woche, Bild, Text) | KW-basiert, für alle sichtbar, **kein CTA** laut Spec |
| **Incentive-Ausspielung** | Zuweisung eines Incentive an ein Segment | Per E-Mail, In-App oder Workflow |

---

## Zentrales Konzept: Incentive-Typen

### 1. Coupon-basierter Incentive („Verknüpfung zu bestehendem Coupon“)

- Admin wählt einen **bestehenden Coupon** und weist ihn einem **Segment** zu.
- **Modus A – Öffentlicher Code:** Coupon-Code wird per E-Mail/In-App bekannt gegeben (z. B. „SUMMER10“), alle im Segment können ihn eingeben. Kein 1:1-Tracking pro User, aber Segment-Kontext bleibt.
- **Modus B – Personalisierter Code:** System erzeugt pro User einen Einmal-Code (z. B. `STAMM-{hash}`), maxUsesPerUser=1. Jeder User bekommt seinen eigenen Code; Einlösung ist eindeutig zuzuordnen.

### 2. Guthaben-basierter Incentive („Wallet-Gutschrift“)

- Admin vergibt einen **Geldbetrag** (z. B. 5 €) an alle User eines Segments.
- System führt pro User eine Wallet-Transaktion vom Typ `INCENTIVE` (oder neuer Typ `BONUS`) aus.
- Kein Coupon nötig; Ausspielung erfolgt direkt auf das Wallet.

### 3. Hybrid: Coupon + Guthaben

- Optional: Coupon, der bei Einlösung eine Guthaben-Gutschrift auslöst (statt Rabatt auf Bestellung). Ermöglicht „Willkommens-Bonus“-Flows.

---

## Verknüpfung mit Motto-Wochen (PROJ-2)

### Option A: Banner und Coupon getrennt (empfohlen für MVP)

- **Promotion-Banner** (PROJ-2): Zeigt nur Motto (Titel, Untertitel, Bild), **kein CTA**.
- **Coupon:** Wird separat verwaltet; Admin kann für dieselbe KW einen Coupon anlegen (z. B. „Bayerische Woche – 10 % Rabatt“) und ihn:
  - entweder **öffentlich** machen (Code im Banner-Text sichtbar, falls PROJ-2 später CTA erlaubt),
  - oder **segmentbasiert** als Incentive ausspielen (z. B. nur „Stammkunden“).

### Option B: Banner ↔ Coupon verknüpft (Erweiterung)

- Neues Feld am **PromotionBanner** oder an der **MenuPromotionBanner**-Zuordnung: `couponId` (optional).
- Wenn gesetzt: Kunde sieht im Banner einen Hinweis wie „Ihr Gutscheincode: SUMMER10“ oder „Exklusives Angebot für Sie“ (bei segmentbasierter Ausspielung).
- **Hinweis:** PROJ-2 schreibt explizit „Kein CTA“; eine spätere Erweiterung könnte einen dezenten Hinweis („Gutschein verfügbar“) erlauben, ohne klassischen Button.

### Option C: Motto-Woche als Segment-Trigger

- Neues (virtuelles) Segment „Besucher der KW X“ oder „Hat Speiseplan in KW X aufgerufen“.
- Workflow: „Wenn User in KW 5 den Menüplan aufruft“ → Incentive (Coupon oder Guthaben) vergeben.
- Erfordert Event-Tracking („Menü aufgerufen“) und ggf. Segment-Regel „lastMenuViewWeek = X“.

**Empfehlung:** MVP mit Option A; Option B und C als Backlog.

---

## Datenmodell-Erweiterung (konzeptionell)

### Incentive-Verknüpfung (Segment ↔ Coupon / Guthaben)

Neue Entität **SegmentIncentive** (oder Erweiterung von Workflow actionConfig):

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | String | Eindeutige ID |
| segmentId | String | Referenz auf CustomerSegment |
| organizationId | String | Organisation |
| incentiveType | Enum | `COUPON` \| `WALLET_CREDIT` |
| couponId | String? | Bei COUPON: Referenz auf Coupon |
| walletAmount | Decimal? | Bei WALLET_CREDIT: Betrag in € |
| personaliseCoupon | Boolean | Bei COUPON: true = pro User eigener Code |
| startDate, endDate | DateTime? | Gültigkeitszeitraum |
| maxGrantsPerUser | Int | Max. Ausspielungen pro User (z. B. 1 = einmalig) |
| displayChannel | Enum? | `EMAIL` \| `IN_APP` \| `BOTH` |

### Grant-Tracking (wer hat welchen Incentive erhalten?)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | String | Eindeutige ID |
| segmentIncentiveId | String | Referenz |
| userId | String | Begünstigter User |
| grantedAt | DateTime | Zeitpunkt der Ausspielung |
| couponCode | String? | Bei personalisiertem Coupon: vergebener Code |
| walletTransactionId | String? | Bei Guthaben: Referenz auf WalletTransaction |
| redeemedAt | DateTime? | Zeitpunkt der Einlösung (bei Coupon) |

- Verhindert Doppelausspielung (maxGrantsPerUser).
- Ermöglicht Auswertung: Wie viele haben erhalten, wie viele eingelöst?

### Coupon-Erweiterung (optional)

- Neues Feld `segmentId` (optional) am Coupon: Wenn gesetzt, ist der Coupon nur für User dieses Segments einlösbar (zusätzlich zu locationId, minOrderAmount, etc.).
- Oder: Segment-Prüfung nur bei **Incentive-Ausspielung**, nicht am Coupon selbst – Coupon bleibt technisch „dumm“, Segment-Logik sitzt in SegmentIncentive.

**Empfehlung:** Segment-Prüfung in der Incentive-/Einlöse-Logik, nicht am Coupon. Coupon bleibt wiederverwendbar (z. B. gleicher Coupon für verschiedene Segmente zu verschiedenen Zeiten).

---

## User Stories

### Als Kantinenmanager

- möchte ich **einen bestehenden Coupon einem Segment als Incentive zuweisen** können, damit nur diese Zielgruppe den Coupon nutzt oder ihn per E-Mail/In-App erhält.
- möchte ich **personalisierten Einmal-Coupon pro User** ausspielen können (z. B. für Stammkunden-Belohnung), damit jeder seinen eigenen Code hat und Mehrfachnutzung verhindert wird.
- möchte ich **Guthaben direkt an ein Segment** vergeben können (z. B. 5 € Willkommens-Bonus), ohne Coupon anlegen zu müssen.
- möchte ich **sehen, wie viele User einen Incentive erhalten und wie viele ihn eingelöst haben**, um die Wirksamkeit zu messen.
- möchte ich **einen Coupon optional mit einem Motto-Banner verknüpfen** können (Erweiterung), damit Kunden den Code im Kontext der Aktion sehen.

### Als Kunde

- möchte ich **meinen personalisierten Incentive-Code** in der App oder per E-Mail erhalten, wenn ich zum begünstigten Segment gehöre.
- möchte ich den Code **beim Checkout eingeben** und den Rabatt sofort sehen können.
- möchte ich **Guthaben-Boni** direkt auf meinem Konto sehen, ohne Code eingeben zu müssen.

---

## Acceptance Criteria (MVP)

- [ ] Admin kann unter Marketing/Kampagnen **„Incentive zuweisen“**: Segment wählen, Incentive-Typ (Coupon | Guthaben), bei Coupon: bestehenden Coupon auswählen oder „personalisierter Coupon“ aktivieren.
- [ ] Bei **Coupon-Incentive**: Ausspielung per E-Mail und/oder In-App (Hinweis mit Code); bei personalisiertem Coupon wird pro User ein Einmal-Code erzeugt und gespeichert.
- [ ] Bei **Guthaben-Incentive**: Wallet-Transaktion pro User im Segment; neuer Transaktionstyp `INCENTIVE` oder `BONUS` mit Beschreibung z. B. „Stammkunden-Belohnung Januar“.
- [ ] **Grant-Tracking**: Pro User und Incentive wird gespeichert, ob/wann ausgegeben; maxGrantsPerUser wird eingehalten.
- [ ] **Einlösung**: Coupon-Einlösung läuft über bestehende `/api/coupons/validate`-Logik; personalisierte Coupons sind normale Coupons mit eindeutigem Code und maxUsesPerUser=1.
- [ ] **Reporting**: Admin sieht pro Incentive: Anzahl Ausspielungen, Anzahl Einlösungen, offene Einlösungen (bei Coupon mit Enddatum).

---

## Edge Cases

- **Coupon wird deaktiviert** nach Incentive-Zuweisung: Ausspielung stoppen; bereits ausgegebene Codes bleiben einlösbar bis endDate (oder Admin entscheidet: Coupon-Deaktivierung invalidiert auch ausstehende Incentives).
- **User verlässt Segment** nach Ausspielung: Bereits erhaltene Incentives behalten Gültigkeit; zukünftige Ausspielungen entfallen.
- **Guthaben-Incentive bei User ohne Wallet:** Wallet automatisch anlegen (falls nicht vorhanden) und Gutschrift verbuchen.
- **Doppelte Workflow-Ausführung:** Idempotenz über Grant-Tracking („User X hat Incentive Y bereits erhalten“).
- **Motto-Banner + Coupon:** Wenn Banner optional mit Coupon verknüpft ist und Coupon segmentbasiert ist: Banner zeigt generischen Hinweis („Exklusives Angebot“), konkreter Code erscheint nur in In-App/E-Mail für Segment-Mitglieder.

---

## Ablauf-Szenarien

### Szenario 1: Stammkunden-Belohnung (personalisierter Coupon)

1. Admin erstellt Coupon-Vorlage (10 % Rabatt, minOrderAmount 5 €, endDate in 14 Tagen).
2. Admin weist Incentive zu: Segment „Stammkunden (≥5 Bestellungen)“, Typ Coupon, **personalisierter Code**, maxGrantsPerUser=1.
3. Workflow „Jeden 1. im Monat 8:00“ → Aktion „Incentive ausspielen“.
4. System berechnet Zielgruppe, erzeugt pro User einen Code (z. B. `STAMM-abc12`), speichert in Grant-Tracking, sendet E-Mail mit Code.
5. User gibt Code bei nächster Bestellung ein; CouponRedemption wird angelegt.

### Szenario 2: Willkommens-Guthaben (Neukunden)

1. Admin weist Incentive zu: Segment „Neukunden (registriert &lt; 7 Tage)“, Typ Guthaben, 5 €.
2. Workflow „Täglich 9:00“ oder Ereignis „User registriert“ → Aktion „Incentive ausspielen“.
3. System vergibt 5 € pro User; Wallet-Transaktion mit type=INCENTIVE, description=„Willkommens-Bonus“.

### Szenario 3: Motto-Woche + öffentlicher Coupon

1. Admin legt Motto-Banner „Bayerische Woche“ für KW 6 an und weist es dem Menü zu.
2. Admin legt Coupon „BAYERN10“ an (10 % Rabatt, gültig in KW 6).
3. Optional (Erweiterung): Banner-Feld `couponId` = BAYERN10 → Banner zeigt „Mit Code BAYERN10 sparen“ (dezenter Hinweis, kein klassischer CTA-Button).
4. Oder: Coupon wird als Incentive an Segment „alle Kunden“ ausgespielt (E-Mail „Ihre Bayerische Woche – Code BAYERN10“).

---

## Reihenfolge der Umsetzung (Vorschlag)

1. **SegmentIncentive** + Grant-Tracking (Datenmodell, Admin-UI „Incentive zuweisen“).
2. **Coupon-Incentive** (bestehender Coupon + optional personalisierter Code).
3. **Guthaben-Incentive** (Wallet-Transaktion, neuer Typ).
4. **Workflow-Integration** (Aktion „Incentive ausspielen“ erweitern).
5. **Reporting** (Ausspielungen, Einlösungen).
6. **Optional:** Banner ↔ Coupon-Verknüpfung (PROJ-2-Erweiterung).

---

## Zusammenfassung

| Aspekt | Lösung |
|--------|--------|
| **Keine Duplikate** | Bestehende Coupon- und Wallet-Logik nutzen; Incentive = Verknüpfung Segment ↔ Coupon/Guthaben |
| **Segmentgenau** | Incentive ist immer segmentgebunden; Ausspielung nur an berechnete Zielgruppe |
| **Tracking** | Grant-Tracking pro User/Incentive; Einlösung über CouponRedemption bzw. WalletTransaction |
| **Motto-Woche** | Banner (PROJ-2) und Coupon zunächst getrennt; optionale Verknüpfung (couponId am Banner) als Erweiterung |
| **Workflows** | Aktion GRANT_INCENTIVE mit actionConfig: `{ incentiveId }` oder `{ couponId, personalise?, walletAmount? }` |

---

## QA Test Results

**Tested:** 2026-02-19
**App URL:** http://localhost:3002

### Acceptance Criteria Status

- [x] **Incentive zuweisen:** OK – Tab „Incentives“ unter /admin/marketing/campaigns
- [x] **Segment wählen:** OK – Dropdown Segment * (required)
- [x] **Typ Coupon/Guthaben:** OK – incentiveType: COUPON | WALLET_CREDIT
- [x] **Coupon-Incentive:** OK – Coupon auswählen, optional personalisierter Code
- [x] **Guthaben-Incentive:** OK – Betrag (€) eingeben
- [x] **Jetzt ausspielen:** OK – Button „Jetzt ausspielen“ ruft /api/admin/marketing/incentives/{id}/grant auf
- [x] **Grant-Tracking:** OK – _count.grants angezeigt

### Summary
- ✅ Alle geprüften ACs bestanden (Code-Review)
