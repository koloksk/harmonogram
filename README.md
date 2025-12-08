<div align="center">

# 📅 Harmonogram MUP

### Nowoczesna aplikacja PWA do zarządzania planem zajęć

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/koloksk/harmonogram)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-ready-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[🚀 Demo na żywo](https://koloksk.github.io/harmonogram/) | [📖 Dokumentacja](https://github.com/koloksk/harmonogram/wiki) | [🐛 Zgłoś błąd](https://github.com/koloksk/harmonogram/issues)

---

**Harmonogram MUP** to w pełni funkcjonalna Progressive Web App, która automatycznie pobiera i parsuje harmonogramy zajęć bezpośrednio z uczelni. Elegancki interfejs, zaawansowane filtry, eksport do Google Calendar i praca offline — wszystko w przeglądarce, bez instalacji.

</div>

## ✨ Funkcje

### 🎯 Podstawowe
- **📊 Trzy widoki kalendarza**: Miesiąc, Tydzień, Dzień
- **🔍 Zaawansowane filtry**: Kierunek studiów, rodzaj zajęć, sala, wykładowca
- **💾 Automatyczny zapis**: Filtry zapisują się lokalnie
- **📱 PWA Ready**: Instaluj jako aplikację mobilną
- **🌙 Ciemny motyw**: Elegancki, nowoczesny design
- **📍 Mapa kampusu**: Interaktywna mapa z trzema budynkami (CsH, CP, CI)
- **🔄 Auto-update**: Automatyczne pobieranie nowych wersji aplikacji bez konieczności ręcznego odświeżania

### 🚀 Zaawansowane
- **⏰ Następne zajęcia**: Kafelek z aktualnie trwającymi lub nadchodzącymi zajęciami
- ** Pasek postępu**: Wizualizacja trwania zajęć
- **🔴 Zajęcia zdalne**: Automatyczne wykrywanie i oznaczanie (wykrywanie czerwonego koloru w Excel)
- **📤 Eksport do Google Calendar**: Pobierz plik .ics z przefiltrowanymi wydarzeniami
- **💡 Inteligentne tooltip'y**: Szczegółowe informacje po najechaniu myszką
- **📋 Popover "+XX więcej"**: Eleganckie okienko z listą dodatkowych wydarzeń
- ** Import XLSX**: Importuj pliki Excel bezpośrednio w przeglądarce (bez Pythona!)
- **🗂️ Zarządzanie harmonogramami**: Dodawaj wiele harmonogramów i przełączaj się między nimi
- **🌐 Automatyczne pobieranie**: Pobiera harmonogram bezpośrednio z serwera uczelni (z obsługą CORS)

## 🖼️ Zrzuty ekranu

### Desktop
- Widok miesięczny z filtrami po lewej
- Interaktywna mapa kampusu
- Kafelek następnych zajęć

### Mobile
- Responsywny design dostosowany do małych ekranów
- Kompaktowy widok wydarzeń
- Łatwa nawigacja jedną ręką

## 🛠️ Technologie

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Kalendarz**: [FullCalendar](https://fullcalendar.io/) v6.1.15
- **Parser XLSX**: [SheetJS](https://sheetjs.com/) v0.20.1
- **Czcionka**: [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- **Format danych**: JSON, XLSX, XLSM
- **PWA**: Service Worker, Web Manifest
- **Backend opcjonalny**: Python 3.x z `openpyxl` (jeśli wolisz CLI)

## 📦 Instalacja i Użycie

### Metoda 1: Import XLSX bezpośrednio w przeglądarce ⚡ (ZALECANE)

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/koloksk/harmonogram.git
   cd harmonogram
   ```

2. **Uruchom lokalnie**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Lub użyj dowolnego serwera HTTP
   ```

3. **Otwórz w przeglądarce**
   ```
   http://localhost:8000
   ```

### 🌐 Automatyczne ładowanie z serwera uczelni

**Aplikacja automatycznie pobiera najnowszy harmonogram studiów niestacjonarnych z serwera MUP:**

```
https://uczelniaoswiecim.edu.pl/wp-content/uploads/2022/10/Harmonogram-studia-niestacjonarne-aktualizacja-23.10.2025.xlsx
```

**Harmonogram jest pobierany i parsowany automatycznie przy każdym uruchomieniu!** 🎉  

**Jak to działa:**
1. 🔄 Aplikacja próbuje pobrać plik bezpośrednio z serwera uczelni
2. 🛡️ Jeśli serwer blokuje CORS, automatycznie używa proxy (corsproxy.io)
3. 📊 Plik XLSX jest parsowany przez ExcelJS bezpośrednio w przeglądarce
4. 📅 Wydarzenia są wyświetlane w kalendarzu FullCalendar

**Zalety:**
- ✅ **Zawsze aktualne dane** - pobierane bezpośrednio z uczelni
- ✅ **Automatyczne parsowanie** - XLSX → kalendarz bez żadnej konfiguracji
- ✅ **Brak instalacji** - wszystko działa w przeglądarce
- ✅ **Wykrywanie zdalnych zajęć** - automatyczne rozpoznawanie czerwonego koloru
- ✅ **Obsługa CORS** - inteligentny fallback przez proxy
- ✅ **Działa wszędzie** - każda nowoczesna przeglądarka

### ➕ Dodawanie własnych harmonogramów

**Metoda 1: Import z URL** 🌐
- Kliknij przycisk `?` w prawym górnym rogu
- Wprowadź URL pliku (XLSX, XLSM lub JSON)
- Przykład: `https://uczelnia.edu.pl/harmonogram.xlsx`
- Kliknij "Dodaj" - harmonogram zostanie pobrany i sparsowany automatycznie

**Metoda 2: Import z pliku lokalnego** 📁
- Kliknij przycisk `?` w prawym górnym rogu
- Wybierz "Wybierz plik JSON lub XLSX"
- Przeglądaj i wybierz lokalny plik `.xlsx`, `.xlsm` lub `.json`

**Import plików JSON (opcjonalnie):**
1. Wygeneruj JSON używając `main.py`:
   ```bash
   pip install openpyxl
   python main.py harmonogram.xlsx
   ```
2. Importuj przez przycisk `?` → "Dodaj nowy harmonogram"

## 📄 Format danych

### Struktura `harmonogram.json`
```json
{
  "events": [
    {
      "title": "Programowanie Obiektowe",
      "date": "2025-11-15",
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

### Parser XLSX

Skrypt `main.py` automatycznie:
- ✅ Rozpoznaje daty polskie (np. "15 października 2025")
- ✅ Wykrywa zajęcia zdalne (czerwony kolor czcionki)
- ✅ Parsuje wykładowców i sale
- ✅ Obsługuje różne formaty komórek Excel
- ✅ Dodaje statystyki i logi postępu
- ✅ Cachuje wyniki dla lepszej wydajności

### Użycie parsera
```bash
# Podstawowe
python main.py plik.xlsx

# Z konkretnym arkuszem
python main.py plik.xlsx "Arkusz1"

# Wyświetla pomoc
python main.py
```

## 🎨 Personalizacja

### Kolory (CSS Variables)
```css
:root {
  --bg: #0b1020;        /* Tło strony */
  --panel: #0f152b;     /* Panele/karty */
  --accent: #7c9cff;    /* Kolor akcentu */
  --danger: #ff5a5a;    /* Wydarzenia zdalne */
  --text: #e8ecf1;      /* Tekst */
  --muted: #9aa1b2;     /* Tekst wyciszony */
}
```

### Mapa kampusu
Dodaj własne budynki edytując SVG w `index.html`:
```html
<polygon 
  class="building-area" 
  data-building="kod" 
  data-name="Pełna Nazwa"
  points="x1,y1 x2,y2 ...">
</polygon>
```

## 🔔 Widget w powiadomieniu

**NOWOŚĆ!** Ponieważ przeglądarki mobilne nie pozwalają na dodawanie prawdziwych widgetów, stworzyliśmy alternatywne rozwiązanie - **widget jako trwałe powiadomienie**.

### Jak używać?
1. Kliknij przycisk **"Przypnij widget"** w kafelku następnych zajęć
2. Zezwól na wyświetlanie powiadomień
3. Powiadomienie z najbliższymi zajęciami pojawi się automatycznie
4. Service Worker aktualizuje dane co 5 minut w tle

### Co pokazuje powiadomienie?
- 📚 Tytuł zajęć
- ⏰ Godzina rozpoczęcia
- 📍 Sala/lokalizacja  
- 👨‍🏫 Prowadzący
- ⏱️ Czas do rozpoczęcia (np. "Za 2h 15min")

### Zalety
- ✅ Działa na każdym telefonie (iOS, Android)
- ✅ Zawsze widoczne w pasku powiadomień
- ✅ Automatyczna aktualizacja w tle
- ✅ Szybki dostęp do harmonogramu
- ✅ Niskie zużycie baterii

📖 Szczegółowa instrukcja: [WIDGET_NOTIFICATION.md](./WIDGET_NOTIFICATION.md)

## 🌐 Progressive Web App (PWA)

Aplikacja jest w pełni funkcjonalną PWA:

1. **Instalacja**: Kliknij "Zainstaluj" w przeglądarce
2. **Offline**: Service Worker cache'uje pliki
3. **Ikona**: Własne logo na ekranie głównym
4. **Manifest**: Pełna konfiguracja w `manifest.webmanifest`

### Funkcje PWA
- 📱 Instalacja na ekran główny
- 🔌 Działanie offline (częściowe)
- 🎨 Własny splash screen
- 📊 Pełnoekranowy tryb
- 🔔 Powiadomienia push

### 🔄 Automatyczne aktualizacje

Aplikacja automatycznie sprawdza dostępność nowych wersji:

**Jak to działa:**
- Service Worker sprawdza aktualizacje co minutę
- Gdy dostępna jest nowa wersja, pojawia się powiadomienie w prawym dolnym rogu
- Kliknij powiadomienie aby załadować nową wersję
- Aktualizacja dzieje się natychmiast - bez potrzeby ręcznego czyszczenia cache

**Strategia cache'owania:**
- **HTML/CSS/JS**: Network First (zawsze próbuje pobrać najnowszą wersję)
- **Obrazy**: Cache First (szybkie ładowanie)
- **CDN (biblioteki)**: Cache First z długim TTL
- **Harmonogramy (XLSX)**: Tylko sieć (zawsze aktualne dane)

**Co się dzieje przy aktualizacji na GitHub:**
1. Nowa wersja zostaje wdrożona na GitHub Pages
2. Service Worker wykrywa zmianę przy następnym otwarciu strony
3. Pojawia się powiadomienie "🆕 Dostępna aktualizacja!"
4. Kliknięcie powiadomienia ładuje nową wersję
5. Stare cache'e są automatycznie usuwane

**Wymuszenie aktualizacji ręcznie:**
- Opcja 1: Kliknij powiadomienie o aktualizacji (gdy się pojawi)
- Opcja 2: Ctrl+Shift+R (hard reload) w przeglądarce
- Opcja 3: Wyczyść cache strony w ustawieniach przeglądarki

## 🔧 Rozwój

### Struktura projektu
```
harmonogram/
├── index.html              # Główna aplikacja
├── main.py                 # Parser XLSX → JSON
├── harmonogram.json        # Dane wydarzeń
├── service-worker.js       # PWA Service Worker
├── manifest.webmanifest    # PWA Manifest
├── logo.png                # Logo aplikacji
├── campus-map.png          # Zdjęcie kampusu
├── campus-map.svg          # Wektorowa mapa
└── icons/                  # Ikony PWA
    ├── icon-192.svg
    ├── icon-512.svg
    └── README.txt
```

### TODO / Roadmap
- [ ] Backend API dla dynamicznego ładowania danych
- [ ] Synchronizacja z Google Calendar (dwukierunkowa)
- [ ] Powiadomienia push o zbliżających się zajęciach
- [ ] Tryb jasny (light mode)
- [ ] Zapisywanie notatek do wydarzeń
- [ ] Współdzielenie harmonogramu (link)
- [ ] Eksport do PDF

## 🗂️ Domyślne harmonogramy

Dodaj listę predefiniowanych harmonogramów w pliku `js/default-schedules.js`.
Każdy wpis powinien mieć pola:
- `id` (opcjonalne) — unikalny identyfikator
- `name` — nazwa wyświetlana
- `path` — URL do pliku (.xlsx lub .json)
- `parseType` — `'xlsx'` lub `'json'` (jeśli nie podane, wywnioskuje z rozszerzenia)
- `fetchFromUniversity` — gdy true, aplikacja użyje mechanizmu automatycznego wyszukiwania aktualnego URL na stronie uczelni
- `pageUrl` — opcjonalny adres strony uczelni, z której aplikacja będzie szukać linku do pliku; jeśli puste, używana jest domyślna strona w kodzie
- `path` — bezpośredni link do pliku; jeśli podany i `fetchFromUniversity` jest false, to będzie użyty
- `autoUpdate` — gdy true, harmonogram będzie sprawdzany codziennie pod kątem aktualizacji URL

Przykład:

```js
export const DEFAULT_SCHEDULES = [
  {
    id: 'niestacjonarne',
    name: 'Harmonogram - studia niestacjonarne (uczelnia)',
    fetchFromUniversity: true,
    parseType: 'xlsx',
    autoUpdate: true
  }
];
```

## 🤝 Kontrybuowanie

Chętnie przyjmujemy pull requesty! Przed dodaniem:

1. Stwórz fork repozytorium
2. Utwórz branch z funkcją (`git checkout -b feature/NowaFunkcja`)
3. Commit zmian (`git commit -m 'Dodaj NowaFunkcja'`)
4. Push do brancha (`git push origin feature/NowaFunkcja`)
5. Otwórz Pull Request

### Standardy kodu
- ✅ Vanilla JavaScript (bez frameworków)
- ✅ Komentarze po polsku
- ✅ Responsive design first
- ✅ Accessibility (ARIA labels)

## � Dokumentacja

Szczegółowe instrukcje i przewodniki:

### 👤 Dla użytkowników:
- **[USER_GUIDE.md](USER_GUIDE.md)** - Kompletna instrukcja użytkownika
  - Jak korzystać z powiadomień
  - Rozwiązywanie problemów
  - FAQ

### 📱 Mobile:
- **[MOBILE_TEST.md](MOBILE_TEST.md)** - Testowanie na telefonie
  - Jak przetestować przez WiFi
  - Diagnostyka Service Worker
  - Checklist testowy
  
- **[MOBILE_FIX.md](MOBILE_FIX.md)** - Szczegóły techniczne (mobile)
  - Wyjaśnienie hybrydowego API
  - Różnice między desktop a mobile
  - Kompatybilność przeglądarek

### 🔧 Dla deweloperów:
- **[CHANGELOG_MOBILE.md](CHANGELOG_MOBILE.md)** - Historia zmian (mobile support)
  - Co zostało zmienione
  - Jak przetestować
  - Debugowanie
  
- **[WIDGET_NOTIFICATION.md](WIDGET_NOTIFICATION.md)** - Widget w powiadomieniu (desktop)
  - Implementacja podstawowa
  - API dokumentacja

### 🧪 Testowanie:
- **[test-widget.html](test-widget.html)** - Strona testowa z diagnostyką
  - Testy powiadomień
  - Sprawdzanie Service Worker
  - Automatyczne logi

## �📝 Licencja

MIT License - Zobacz [LICENSE](LICENSE) dla szczegółów.

## 👨‍💻 Autor

**koloksk**
- GitHub: [@koloksk](https://github.com/koloksk)

## 🙏 Podziękowania

- [FullCalendar](https://fullcalendar.io/) - Doskonała biblioteka kalendarza
- [Inter Font](https://rsms.me/inter/) - Piękna czcionka UI
- [openpyxl](https://openpyxl.readthedocs.io/) - Parser Excela dla Pythona

## 📞 Wsparcie

Znalazłeś bug? Masz pomysł na funkcję?

- 🐛 [Zgłoś issue](https://github.com/koloksk/harmonogram/issues)
- 💡 [Dyskusja](https://github.com/koloksk/harmonogram/discussions)
- 📧 Email: [twoj@email.pl](mailto:twoj@email.pl)

---

<div align="center">
  <sub>Zbudowane z ❤️ dla studentów MUP</sub>
</div>
