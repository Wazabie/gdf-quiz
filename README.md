# Simulatore Allievi Finanzieri (GdF) – prova scritta di preselezione

Sito statico (HTML + CSS + JS, nessuna dipendenza, nessun backend). Lo stato vive solo in memoria:
niente account, niente localStorage/sessionStorage/cookie. Ricaricare o chiudere la pagina azzera tutto.

## Avvio locale
    cd /workspace/gdf-quiz && python3 -m http.server 8931
    # poi apri http://127.0.0.1:8931  (funziona anche aprendo index.html da file://)

## Contenuto
- `data/questions.json` (e `data/questions.js`, stessa cosa caricabile senza server): 486 quesiti.
  Campi: id, year, questionario, num, materia, question, options[4], correct (indice 0-3),
  concorso, sourceUrl, sourcePage, questionSource, answerSource, image (facoltativo).
- `img/`: figure e tabelle ritagliate dai PDF ufficiali (67 quesiti).

## Fonti (questionari-tipo pubblicati dalla GdF su concorsi.gdf.gov.it; copie scaricate da mirror)
- 2025 (1.985 AA.FF.): QUESTIONARIO-TIPO-1/2.pdf – invictusconcorsi.it/wp-content/uploads/
- 2024 (1.634 AA.FF.): questionario-1/2.pdf – invictusconcorsi.it/wp-content/uploads/
- 2023 (1.673 AA.FF.): MaterialeTestologico(.pdf|-2.pdf) – serem.it/wp-content/uploads/2023/09/
- 2021 e 2022: questionari-tipo pubblicati sul portale GdF ma non recuperati (il portale blocca il box).

## Avvertenze
- La GdF NON pubblica la banca dati della prova né le soluzioni dei questionari-tipo:
  la chiave di correzione è redazionale (non ufficiale). Il simulatore SEREM, usato solo come confronto, contiene errori.
- 54 quesiti esclusi (43 visivi/figurativi non verificabili, 11 con risposta ambigua): elenco non incluso nel sito.
