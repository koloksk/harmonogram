<div align="center">

# 📅 Harmonogram MUP

### Nowoczesna aplikacja PWA do zarządzania planem zajęć

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/koloksk/harmonogram)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-ready-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[🚀 Demo na żywo](https://koloksk.github.io/harmonogram/) | [🐛 Zgłoś błąd](https://github.com/koloksk/harmonogram/issues)

---

**Harmonogram MUP** to w pełni funkcjonalna Progressive Web App, która automatycznie pobiera i parsuje harmonogramy zajęć bezpośrednio z uczelni. Elegancki interfejs, zaawansowane filtry, eksport do Google Calendar i praca offline — wszystko w przeglądarce, bez instalacji.

</div>

---

## ✨ Główne funkcje

<table>
<tr>
<td width="50%">

### 📊 Widok kalendarza
- **Trzy tryby**: Miesiąc, Tydzień, Dzień
- **Responsywny design** dla desktop i mobile
- **Interaktywne wydarzenia** z tooltip'ami
- **Elegancki dark mode** jako domyślny

### 🔍 Filtry i wyszukiwanie
- Filtrowanie po **kierunku studiów**
- Wybór **rodzaju zajęć** (wykłady, laboratoria, projekty)
- Sortowanie po **salach** i **wykładowcach**
- **Automatyczny zapis** ustawień w localStorage

### 🗂️ Multi-harmonogramy
- Zarządzanie przez **intuicyjny modal**
- Import z **URL** lub **plików lokalnych**
- Wsparcie dla **.xlsx, .xlsm, .json**

</td>
<td width="50%">

### 🌐 Automatyczne pobieranie
- **Śledzi stronę uczelni** i aktualizuje URL
- **CORS proxy** jako automatyczny fallback
- Parsowanie **Excel w przeglądarce** (SheetJS)
- **Wykrywanie zajęć zdalnych** (kolor czerwony)

### 📱 Progressive Web App
- **Instalacja** na ekran główny (iOS/Android)
- **Działanie offline** z Service Worker
- **Powiadomienia push** o zajęciach
- **Auto-update** nowych wersji aplikacji

### 📤 Eksport i udostępnianie
- Pobierz plik **.ics** (Google Calendar)
- **Tylko przefiltrowane** wydarzenia
- Kompatybilny z **Apple Calendar, Outlook**

</td>
</tr>
</table>

---

## 🚀 Szybki start

### Wymagania

- Przeglądarka obsługująca ES6+ (Chrome, Firefox, Safari, Edge)
- Serwer HTTP (Python, Node.js, Live Server)
- *Opcjonalnie*: Python 3.x dla parsera CLI

### Instalacja

```bash
# Sklonuj repozytorium
git clone https://github.com/koloksk/harmonogram.git
cd harmonogram

# Uruchom lokalny serwer
python -m http.server 8000

# Lub użyj Node.js
npx http-server -p 8000

# Lub VS Code Live Server
# Kliknij PPM na index.html → "Open with Live Server"
```

### Otwórz w przeglądarce

```
http://localhost:8000
```

**🎉 Gotowe!** Aplikacja automatycznie pobierze najnowszy harmonogram z uczelni.

---

## 🛠️ Stack technologiczny

<table>
<tr>
<td width="33%" align="center">

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</td>
<td width="33%" align="center">

### Biblioteki
![FullCalendar](https://img.shields.io/badge/FullCalendar-4285F4?style=for-the-badge&logo=google-calendar&logoColor=white)
![SheetJS](https://img.shields.io/badge/SheetJS-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white)

</td>
<td width="33%" align="center">

### PWA
![Service Worker](https://img.shields.io/badge/Service_Worker-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Web Manifest](https://img.shields.io/badge/Web_Manifest-FF6D00?style=for-the-badge&logo=pwa&logoColor=white)

</td>
</tr>
</table>

### Szczegóły techniczne

- **Frontend**: Vanilla JavaScript ES6+ (bez frameworków!)
- **Kalendarz**: [FullCalendar](https://fullcalendar.io/) v6.1.15
- **Parser XLSX**: [SheetJS (xlsx)](https://sheetjs.com/) v0.20.1
- **Czcionka**: [Inter](https://fonts.google.com/specimen/Inter) z Google Fonts
- **Architektura**: Modularna struktura ES6 Modules
- **Storage**: localStorage + IndexedDB (przyszłość)
- **PWA**: Service Worker z cache strategies
- **CORS**: Proxy fallback (corsproxy.io)

---

## 📄 Format danych

### Struktura JSON

Aplikacja obsługuje pliki JSON w następującym formacie:

```json
{
  "events": [
    {
      "title": "Programowanie Obiektowe",
      "date": "2025-12-08",
      "startTime": "08:00",
      "endTime": "09:30",
      "program": "Informatyka",
      "type": "LAB",
      "location": "CsH 2.03",
      "lecturers": ["dr Jan Kowalski"],
      "zjazd": "1",
      "isRemote": false
    }
  ]
}
```

### Pola wydarzenia

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `title` | string | ✅ | Nazwa przedmiotu/zajęć |
| `date` | string | ✅ | Data w formacie `YYYY-MM-DD` |
| `startTime` | string | ✅ | Godzina rozpoczęcia `HH:MM` |
| `endTime` | string | ✅ | Godzina zakończenia `HH:MM` |
| `program` | string | ❌ | Kierunek studiów |
| `type` | string | ❌ | Typ zajęć (W, LAB, PROJEKT, ĆW, K) |
| `location` | string | ❌ | Sala/budynek |
| `lecturers` | array | ❌ | Lista wykładowców |
| `zjazd` | string | ❌ | Numer zjazdu |
| `isRemote` | boolean | ❌ | Czy zajęcia zdalne |


## 🎨 Personalizacja

### Zmiana kolorów (CSS Variables)

Edytuj `styles.css`:

```css
:root {
  --bg: #0b1020;        /* Tło strony */
  --panel: #0f152b;     /* Panele/karty */
  --accent: #7c9cff;    /* Kolor akcentu */
  --danger: #ff5a5a;    /* Wydarzenia zdalne */
  --text: #e8ecf1;      /* Tekst główny */
  --muted: #9aa1b2;     /* Tekst wyciszony */
  --border: #1e2641;    /* Obramowania */
}
```


### Własne ikony PWA

Zamień pliki:
- `logo.png` (512x512 px, PNG)
- `manifest.webmanifest` → zaktualizuj ścieżki ikon

---

## 🌐 Progressive Web App

### Funkcje PWA

| Funkcja | Desktop | Mobile | Opis |
|---------|---------|--------|------|
| 📱 Instalacja | ✅ | ✅ | Dodaj do ekranu głównego |
| 🔌 Offline | ✅ | ✅ | Częściowe działanie bez internetu |
| 🔔 Powiadomienia | ✅ | ✅ | Push notifications |
| 🔄 Auto-update | ✅ | ✅ | Automatyczne aktualizacje |
| 🎨 Splash screen | ❌ | ✅ | Ekran startowy (mobile) |
| 📊 Full screen | ✅ | ✅ | Tryb pełnoekranowy |

### Strategia cache'owania

**HTML/CSS/JS** → Network First (zawsze próbuje pobrać najnowsze)  
**Obrazy** → Cache First (szybkie ładowanie)  
**Biblioteki CDN** → Cache First z długim TTL  
**Harmonogramy** → Network Only (zawsze aktualne dane)

### Auto-update

1. Service Worker sprawdza aktualizacje **co minutę**
2. Gdy nowa wersja jest dostępna → pojawia się **powiadomienie**
3. Kliknij powiadomienie → **natychmiastowa aktualizacja**
4. Stare cache'e są **automatycznie usuwane**

**Wymuś aktualizację ręcznie:**
- `Ctrl + Shift + R` (hard reload)
- DevTools → Application → Clear storage
- Kliknij powiadomienie o aktualizacji


---

## 📝 Licencja

**MIT License** © 2025 [koloksk](https://github.com/koloksk)

```
MIT License

Copyright (c) 2025 koloksk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---


## 👨‍💻 Autor

**koloksk**

[![GitHub](https://img.shields.io/badge/GitHub-koloksk-181717?style=for-the-badge&logo=github)](https://github.com/koloksk)
[![Email](https://img.shields.io/badge/Email-Kontakt-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:kontakt.koloksk@gmail.com)

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=koloksk/harmonogram&type=Date)](https://star-history.com/#koloksk/harmonogram&Date)

---

<div align="center">

**Zbudowane z ❤️ dla studentów MUP**

[⬆️ Powrót na górę](#-harmonogram-mup)

</div>
