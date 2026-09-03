KALKULATORY HOME LAB&FIX — GITHUB PAGES
=======================================

ZAWARTOŚĆ
----------
index.html  — strona główna (GitHub Pages wymaga właśnie tej nazwy)
style.css   — wygląd i wersja mobilna
app.js      — kalkulatory, wyszukiwarka i obsługa strony
README.txt  — instrukcja publikacji

PUBLIKACJA NA GITHUB PAGES Z TELEFONU
-------------------------------------
1. Otwórz swoje repozytorium na GitHubie.
2. Wybierz „Add file”, a następnie „Upload files”.
3. Rozpakuj ZIP w telefonie i dodaj CZTERY pliki bezpośrednio do głównego
   katalogu repozytorium. Nie umieszczaj ich w dodatkowym folderze.
4. Zatwierdź zmiany przyciskiem „Commit changes”.
5. Wejdź w „Settings” → „Pages”.
6. W sekcji „Build and deployment” ustaw:
   Source: Deploy from a branch
   Branch: main
   Folder: / (root)
7. Naciśnij „Save” i poczekaj zwykle od 1 do 5 minut.
8. Publiczny adres będzie miał postać:
   https://NAZWA-UZYTKOWNIKA.github.io/NAZWA-REPOZYTORIUM/

WAŻNE
-----
• Nie zmieniaj nazw index.html, style.css ani app.js.
• Pliki muszą znajdować się obok siebie w głównym katalogu repozytorium.
• Pliku app.js nie trzeba uruchamiać osobno — ładuje go index.html.
• Jeśli GitHub nie pozwala dodać pliku app.js, użyj „Add file” →
  „Create new file”, wpisz app.js jako nazwę i wklej jego zawartość.
• Po aktualizacji strony wykonaj ponownie „Commit changes”.

DZIAŁANIE
---------
Strona jest statyczna i nie wymaga serwera, bazy danych ani instalowania
dodatkowych pakietów. Działa na GitHub Pages, Netlify oraz zwykłym hostingu.

© 2026 Home Lab&Fix
