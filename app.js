"use strict";

const $ = (s, root = document) => root.querySelector(s);
const fmt = (n, digits = 2) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: digits }).format(Number.isFinite(n) ? n : 0);
const num = (data, id) => Number(data[id] || 0);
const pct = (v) => 1 + v / 100;
const row = (label, value) => ({ label, value });

const icons = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>'
};

const categories = [
  { id: "budowa", name: "Budowa i remont", icon: "🏗️", tint: "#fff0ec", desc: "Materiały, powierzchnie, spadki, dachy, schody i fundamenty." },
  { id: "drewno", name: "Stolarstwo i ciesielstwo", icon: "🪚", tint: "#fff6df", desc: "Rozkrój płyt, drewno konstrukcyjne, krokwie, tarasy i zabudowy." },
  { id: "elektryka", name: "Elektryka i energia", icon: "⚡", tint: "#edf4ff", desc: "Moc, prąd, spadek napięcia, zużycie energii i fotowoltaika." },
  { id: "finanse", name: "Koszty i firma", icon: "📊", tint: "#ebfaf3", desc: "Raty, marża, VAT, stawka robocizny i wynajem sprzętu." },
  { id: "warsztat", name: "Metal i warsztat", icon: "⚙️", tint: "#f1efff", desc: "Masa stali, rury, koła pasowe, gięcie blachy i obciążenia." },
  { id: "przeliczniki", name: "Przeliczniki jednostek", icon: "↔️", tint: "#eaf9fb", desc: "Długość, pole, objętość, masa, temperatura, ciśnienie i kąty." }
];

const n = (id, label, unit, value, min = 0, step = "any", hint = "") => ({ id, label, unit, value, min, step, hint, type: "number" });
const s = (id, label, options, value) => ({ id, label, options, value: value || options[0][0], type: "select" });
const result = (mainLabel, mainValue, rows = [], warning = "") => ({ mainLabel, mainValue, rows, warning });

const calculators = [
  {
    id: "beton", category: "budowa", icon: "▰", name: "Kalkulator betonu", tag: "materiały",
    desc: "Objętość mieszanki na płytę, ławę lub stopę.",
    fields: [n("length","Długość","m",5),n("width","Szerokość","m",4),n("depth","Grubość / wysokość","cm",15),n("waste","Zapas","%",7),n("bag","Masa worka suchej mieszanki","kg",25,1)],
    formula: "V = długość × szerokość × grubość × (1 + zapas)",
    info: "Wynik uwzględnia zadany zapas. Liczba worków jest orientacyjna i bazuje na przyjętej gęstości gotowego betonu 2400 kg/m³.",
    calc: d => { const raw=num(d,"length")*num(d,"width")*num(d,"depth")/100, v=raw*pct(num(d,"waste")), kg=v*2400; return result("Beton z zapasem",`${fmt(v,3)} m³`,[row("Objętość bez zapasu",`${fmt(raw,3)} m³`),row("Orientacyjna masa",`${fmt(kg,0)} kg`),row(`Worki po ${fmt(num(d,"bag"),0)} kg`,`${Math.ceil(kg/num(d,"bag"))} szt.`)],"Przy zamawianiu betonu towarowego potwierdź minimalną ilość i warunki pompowania z wytwórnią."); }
  },
  {
    id:"cegly",category:"budowa",icon:"▦",name:"Kalkulator cegieł i bloczków",tag:"materiały",desc:"Liczba elementów murowych z uwzględnieniem spoin i otworów.",
    fields:[n("wallW","Długość ściany","m",6),n("wallH","Wysokość ściany","m",2.7),n("openings","Powierzchnia otworów","m²",3),n("brickW","Długość elementu","mm",250),n("brickH","Wysokość elementu","mm",120),n("joint","Średnia spoina","mm",10),n("waste","Zapas","%",8)],
    formula:"szt./m² = 1 ÷ [(długość + spoina) × (wysokość + spoina)]",info:"Kalkulator liczy elementy widoczne w licu muru. Dla muru wielowarstwowego lub niestandardowego wiązania dobierz właściwy mnożnik.",
    calc:d=>{const area=Math.max(0,num(d,"wallW")*num(d,"wallH")-num(d,"openings")),per=1/(((num(d,"brickW")+num(d,"joint"))/1000)*((num(d,"brickH")+num(d,"joint"))/1000)),raw=area*per,total=Math.ceil(raw*pct(num(d,"waste")));return result("Potrzebna liczba",`${total} szt.`,[row("Powierzchnia netto",`${fmt(area)} m²`),row("Zużycie",`${fmt(per,1)} szt./m²`),row("Bez zapasu",`${Math.ceil(raw)} szt.`)]);}
  },
  {
    id:"plytki",category:"budowa",icon:"▧",name:"Kalkulator płytek",tag:"wykończenie",desc:"Liczba płytek i paczek na podłogę lub ścianę.",
    fields:[n("area","Powierzchnia do ułożenia","m²",18),n("tileW","Szerokość płytki","cm",60),n("tileH","Długość płytki","cm",60),n("pack","Płytek w paczce","szt.",4,1,1),n("waste","Zapas na docinki","%",10)],formula:"liczba = powierzchnia × zapas ÷ pole jednej płytki",info:"Przy układzie diagonalnym, wielu narożnikach lub skomplikowanym wzorze zwykle potrzebny jest większy zapas.",
    calc:d=>{const tile=num(d,"tileW")/100*num(d,"tileH")/100,count=Math.ceil(num(d,"area")*pct(num(d,"waste"))/tile),packs=Math.ceil(count/num(d,"pack"));return result("Liczba paczek",`${packs} op.`,[row("Płytki łącznie",`${packs*num(d,"pack")} szt.`),row("Minimum z obliczeń",`${count} szt.`),row("Powierzchnia zakupiona",`${fmt(packs*num(d,"pack")*tile)} m²`)]);}
  },
  {
    id:"farba",category:"budowa",icon:"◩",name:"Kalkulator farby",tag:"wykończenie",desc:"Ilość farby dla ścian i sufitów z liczbą warstw.",
    fields:[n("area","Powierzchnia brutto","m²",65),n("openings","Okna i drzwi","m²",8),n("coats","Liczba warstw","",2,1,1),n("coverage","Wydajność farby","m²/l",10,.1),n("waste","Zapas","%",5)],formula:"litry = powierzchnia netto × warstwy ÷ wydajność × zapas",info:"Rzeczywista wydajność zależy od chłonności podłoża, koloru bazowego i metody aplikacji.",
    calc:d=>{const a=Math.max(0,num(d,"area")-num(d,"openings")),litres=a*num(d,"coats")/num(d,"coverage")*pct(num(d,"waste"));return result("Potrzebna farba",`${fmt(litres,1)} l`,[row("Powierzchnia netto",`${fmt(a)} m²`),row("Powierzchnia malowania",`${fmt(a*num(d,"coats"))} m²`),row("Puszki 2,5 l",`${Math.ceil(litres/2.5)} szt.`)]);}
  },
  {
    id:"wylewka",category:"budowa",icon:"▱",name:"Kalkulator wylewki",tag:"materiały",desc:"Objętość i masa jastrychu dla zadanej grubości.",
    fields:[n("area","Powierzchnia","m²",35),n("thickness","Grubość","cm",6),n("density","Gęstość mieszanki","kg/m³",2000),n("bag","Masa worka","kg",25,1),n("waste","Zapas","%",8)],formula:"V = powierzchnia × grubość",info:"Zużycie gotowej zaprawy zawsze porównaj z kartą techniczną konkretnego produktu.",
    calc:d=>{const v=num(d,"area")*num(d,"thickness")/100*pct(num(d,"waste")),kg=v*num(d,"density");return result("Objętość z zapasem",`${fmt(v,3)} m³`,[row("Masa mieszanki",`${fmt(kg,0)} kg`),row("Liczba worków",`${Math.ceil(kg/num(d,"bag"))} szt.`),row("Obciążenie powierzchni",`${fmt(kg/num(d,"area"),0)} kg/m²`)]);}
  },
  {
    id:"tynk",category:"budowa",icon:"▥",name:"Kalkulator tynku",tag:"wykończenie",desc:"Zużycie suchej zaprawy na wskazaną powierzchnię i warstwę.",
    fields:[n("area","Powierzchnia","m²",80),n("thickness","Grubość warstwy","mm",10),n("consumption","Zużycie produktu","kg/m²/mm",1.2,.1),n("bag","Masa worka","kg",25,1),n("waste","Zapas","%",7)],formula:"masa = powierzchnia × grubość × zużycie × zapas",info:"Wpisz zużycie z karty technicznej produktu; różni się ono dla tynków gipsowych, cementowych i wapiennych.",
    calc:d=>{const kg=num(d,"area")*num(d,"thickness")*num(d,"consumption")*pct(num(d,"waste"));return result("Sucha mieszanka",`${fmt(kg,0)} kg`,[row("Liczba worków",`${Math.ceil(kg/num(d,"bag"))} szt.`),row("Zużycie na 1 m²",`${fmt(kg/num(d,"area"),1)} kg`)]);}
  },
  {
    id:"fundament",category:"budowa",icon:"▰",name:"Kalkulator ławy fundamentowej",tag:"konstrukcja",desc:"Beton dla ciągłej ławy o stałym przekroju.",
    fields:[n("length","Łączna długość ław","m",42),n("width","Szerokość ławy","cm",60),n("height","Wysokość ławy","cm",35),n("waste","Zapas","%",7)],formula:"V = długość × szerokość × wysokość",info:"Kalkulator nie uwzględnia poszerzeń, schodków ani zmiennego przekroju — dodaj je osobno.",
    calc:d=>{const raw=num(d,"length")*num(d,"width")/100*num(d,"height")/100,v=raw*pct(num(d,"waste"));return result("Beton z zapasem",`${fmt(v,2)} m³`,[row("Objętość geometryczna",`${fmt(raw,2)} m³`),row("Zapas",`${fmt(v-raw,2)} m³`)]);}
  },
  {
    id:"przekatna",category:"budowa",icon:"◩",name:"Kalkulator przekątnej",tag:"pomiary",desc:"Sprawdzenie prostokąta i wytyczanie kąta prostego.",
    fields:[n("a","Pierwszy bok","m",3),n("b","Drugi bok","m",4),n("measured","Zmierzona przekątna (opcjonalnie)","m",5)],formula:"c = √(a² + b²)",info:"W prostokącie obie przekątne muszą mieć tę samą długość. Sama zgodność jednej przekątnej z obliczeniem nie zastępuje kontroli obu.",
    calc:d=>{const c=Math.hypot(num(d,"a"),num(d,"b")),diff=num(d,"measured")-c;return result("Prawidłowa przekątna",`${fmt(c,3)} m`,[row("Różnica pomiaru",`${diff>=0?"+":""}${fmt(diff*1000,0)} mm`),row("Pole prostokąta",`${fmt(num(d,"a")*num(d,"b"))} m²`)]);}
  },
  {
    id:"spadek",category:"budowa",icon:"∠",name:"Kalkulator spadku",tag:"geometria",desc:"Spadek w procentach, stopniach i różnica wysokości.",
    fields:[n("run","Długość pozioma","m",4),n("drop","Różnica wysokości","cm",8)],formula:"spadek [%] = różnica wysokości ÷ długość × 100",info:"Długość wpisuj jako rzut poziomy. Dla dużych kątów odróżniaj długość poziomą od długości pochyłej.",
    calc:d=>{const p=(num(d,"drop")/100)/num(d,"run")*100,a=Math.atan(p/100)*180/Math.PI,sloped=Math.hypot(num(d,"run"),num(d,"drop")/100);return result("Spadek",`${fmt(p,2)}%`,[row("Kąt nachylenia",`${fmt(a,2)}°`),row("Różnica na 1 m",`${fmt(p*10,1)} mm`),row("Długość pochyła",`${fmt(sloped,3)} m`)]);}
  },
  {
    id:"dach",category:"budowa",icon:"⌂",name:"Kalkulator powierzchni dachu",tag:"dach",desc:"Powierzchnia dachu dwuspadowego i długość połaci.",
    fields:[n("buildingW","Szerokość budynku","m",8),n("buildingL","Długość budynku","m",12),n("pitch","Kąt nachylenia","°",35,1),n("eave","Okap z każdej strony","m",.4),n("waste","Zapas pokrycia","%",10)],formula:"połać = (połowa szerokości + okap) ÷ cos(kąta)",info:"Model dotyczy prostego dachu dwuspadowego. Lukarny, kosze, kominy i okna dachowe wymagają osobnego zestawienia.",
    calc:d=>{const angle=num(d,"pitch")*Math.PI/180,run=num(d,"buildingW")/2+num(d,"eave"),slope=run/Math.cos(angle),ridge=num(d,"buildingL")+2*num(d,"eave"),raw=2*slope*ridge,total=raw*pct(num(d,"waste"));return result("Pokrycie z zapasem",`${fmt(total,1)} m²`,[row("Powierzchnia połaci",`${fmt(raw,1)} m²`),row("Długość od okapu do kalenicy",`${fmt(slope,2)} m`),row("Wysokość od murłaty",`${fmt((num(d,"buildingW")/2)*Math.tan(angle),2)} m`)]);}
  },
  {
    id:"schody",category:"budowa",icon:"▟",name:"Kalkulator schodów prostych",tag:"geometria",desc:"Liczba stopni, wysokość, głębokość i kąt biegu.",
    fields:[n("height","Wysokość kondygnacji","cm",280),n("target","Planowana wysokość stopnia","cm",17.5,.1),n("available","Dostępna długość biegu","cm",420),s("mode","Sposób wyznaczenia stopnicy",[["comfort","Wzór wygody 2h+s=63 cm"],["available","Z dostępnej długości biegu"]],"comfort")],formula:"liczba podstopnic ≈ wysokość ÷ docelowa wysokość; 2h + s ≈ 60–65 cm",info:"To narzędzie koncepcyjne. Ostateczne wymiary schodów muszą odpowiadać projektowi, geometrii stropu i obowiązującym wymaganiom.",
    calc:d=>{const risers=Math.max(1,Math.round(num(d,"height")/num(d,"target"))),h=num(d,"height")/risers,treads=Math.max(1,risers-1),t=d.mode==="available"?num(d,"available")/treads:63-2*h,run=t*treads,angle=Math.atan(num(d,"height")/run)*180/Math.PI;return result("Liczba podstopnic",`${risers} szt.`,[row("Wysokość stopnia",`${fmt(h,2)} cm`),row("Liczba stopnic",`${treads} szt.`),row("Głębokość stopnicy",`${fmt(t,1)} cm`),row("Długość biegu",`${fmt(run,0)} cm`),row("Kąt biegu",`${fmt(angle,1)}°`)],h<14||h>20?"Nietypowa wysokość stopnia — skonsultuj układ z projektantem.":"");}
  },
  {
    id:"odplyw",category:"budowa",icon:"↘",name:"Kalkulator spadku odpływu",tag:"instalacje",desc:"Wymagana różnica wysokości dla rury, tarasu lub posadzki.",
    fields:[n("length","Długość odcinka","m",6),n("slope","Wymagany spadek","%",2,.1)],formula:"różnica [cm] = długość [m] × spadek [%]",info:"Właściwy spadek zależy od zastosowania, średnicy przewodu, nawierzchni i projektu. Nie traktuj wartości domyślnych jako normy dla każdego przypadku.",
    calc:d=>{const cm=num(d,"length")*num(d,"slope"),mm=cm*10;return result("Różnica wysokości",`${fmt(cm,1)} cm`,[row("Różnica w milimetrach",`${fmt(mm,0)} mm`),row("Spadek na metr",`${fmt(num(d,"slope")*10,0)} mm/m`)]);}
  },
  {
    id:"ocieplenie",category:"budowa",icon:"▤",name:"Kalkulator ocieplenia",tag:"izolacja",desc:"Liczba paczek materiału izolacyjnego i koszt zakupu.",
    fields:[n("area","Powierzchnia netto","m²",140),n("packArea","Powierzchnia w paczce","m²",5.5,.01),n("waste","Zapas","%",7),n("price","Cena paczki","zł",165,.01)],formula:"paczki = zaokrąglenie w górę(powierzchnia × zapas ÷ wydajność paczki)",info:"Uwzględnij odmienne grubości materiału na poszczególnych przegrodach i zamawiaj je osobno.",
    calc:d=>{const packs=Math.ceil(num(d,"area")*pct(num(d,"waste"))/num(d,"packArea"));return result("Liczba paczek",`${packs} szt.`,[row("Kupowana powierzchnia",`${fmt(packs*num(d,"packArea"),1)} m²`),row("Koszt materiału",`${fmt(packs*num(d,"price"),2)} zł`)]);}
  },
  {
    id:"objetosc-drewna",category:"drewno",icon:"▥",name:"Kalkulator objętości drewna",tag:"materiał",desc:"Kubatura, masa i koszt kantówek albo desek.",
    fields:[n("width","Szerokość przekroju","mm",45),n("height","Wysokość przekroju","mm",145),n("length","Długość elementu","m",4),n("count","Liczba elementów","szt.",24,1,1),n("density","Gęstość drewna","kg/m³",500),n("price","Cena za m³","zł",2200)],formula:"V = szerokość × wysokość × długość × liczba",info:"Masa zależy od gatunku i wilgotności drewna, dlatego wynik jest tylko szacunkiem.",
    calc:d=>{const v=num(d,"width")/1000*num(d,"height")/1000*num(d,"length")*num(d,"count");return result("Objętość drewna",`${fmt(v,3)} m³`,[row("Orientacyjna masa",`${fmt(v*num(d,"density"),0)} kg`),row("Koszt",`${fmt(v*num(d,"price"),2)} zł`),row("Metry bieżące",`${fmt(num(d,"length")*num(d,"count"),1)} mb`)]);}
  },
  {
    id:"krokiew",category:"drewno",icon:"⌁",name:"Kalkulator krokwi",tag:"ciesielstwo",desc:"Długość krokwi z rozpiętości, kąta i okapu.",
    fields:[n("span","Szerokość budynku","m",8),n("pitch","Kąt dachu","°",35,1),n("eave","Okap w poziomie","m",.5),n("seat","Naddatek / korekta końców","cm",5)],formula:"długość = (połowa rozpiętości + okap) ÷ cos(kąta)",info:"Nie uwzględnia zaciosu, kalenicy, grubości deski czołowej ani indywidualnych detali węzłów.",
    calc:d=>{const a=num(d,"pitch")*Math.PI/180,base=(num(d,"span")/2)/Math.cos(a),full=(num(d,"span")/2+num(d,"eave"))/Math.cos(a)+num(d,"seat")/100;return result("Długość elementu",`${fmt(full,3)} m`,[row("Do linii ściany",`${fmt(base,3)} m`),row("Wysokość kalenicy",`${fmt((num(d,"span")/2)*Math.tan(a),3)} m`)]);}
  },
  {
    id:"taras-deski",category:"drewno",icon:"▥",name:"Kalkulator desek tarasowych",tag:"taras",desc:"Liczba desek według szerokości tarasu, szczeliny i długości handlowej.",
    fields:[n("deckW","Szerokość tarasu — w poprzek desek","m",4),n("deckL","Długość tarasu — wzdłuż desek","m",5),n("boardW","Szerokość deski","mm",145),n("gap","Szczelina","mm",6),n("stockL","Długość handlowa deski","m",3),n("waste","Zapas","%",8)],formula:"liczba rzędów = szerokość tarasu ÷ (szerokość deski + szczelina)",info:"Kalkulator nie optymalizuje przesunięcia łączeń. Rozplanowanie legarów i łączeń zależy od systemu i instrukcji producenta.",
    calc:d=>{const rows=Math.ceil(num(d,"deckW")/((num(d,"boardW")+num(d,"gap"))/1000)),per=Math.ceil(num(d,"deckL")/num(d,"stockL")),pieces=Math.ceil(rows*per*pct(num(d,"waste")));return result("Deski handlowe",`${pieces} szt.`,[row("Rzędy desek",`${rows}`),row("Elementy na rząd",`${per}`),row("Metry bieżące",`${fmt(pieces*num(d,"stockL"),1)} mb`)]);}
  },
  {
    id:"plyty-meblowe",category:"drewno",icon:"▦",name:"Kalkulator płyt meblowych",tag:"rozkrój",desc:"Wstępna liczba arkuszy na podstawie pola elementów.",
    fields:[n("partsArea","Suma pól elementów","m²",8.4),n("sheetW","Szerokość arkusza","mm",2070),n("sheetH","Długość arkusza","mm",2800),n("waste","Zapas na rozkrój","%",18)],formula:"arkusze = pole elementów × zapas ÷ pole arkusza",info:"To oszacowanie powierzchniowe, nie plan nestingowy. Kierunek dekoru, szerokość rzazu i kształty elementów mogą zwiększyć liczbę arkuszy.",
    calc:d=>{const sheet=num(d,"sheetW")/1000*num(d,"sheetH")/1000,count=Math.ceil(num(d,"partsArea")*pct(num(d,"waste"))/sheet);return result("Liczba arkuszy",`${count} szt.`,[row("Pole jednego arkusza",`${fmt(sheet,2)} m²`),row("Pole zakupione",`${fmt(count*sheet,2)} m²`),row("Wykorzystanie powierzchni",`${fmt(num(d,"partsArea")/(count*sheet)*100,1)}%`)]);}
  },
  {
    id:"szafka",category:"drewno",icon:"▣",name:"Rozkrój prostej szafki",tag:"meble",desc:"Wymiary podstawowych formatek korpusu z płyty.",
    fields:[n("width","Szerokość zewnętrzna","mm",600),n("height","Wysokość zewnętrzna","mm",720),n("depth","Głębokość korpusu","mm",560),n("board","Grubość płyty","mm",18),n("back","Grubość pleców","mm",3)],formula:"światło korpusu = wymiar zewnętrzny − 2 × grubość płyty",info:"Schemat: dwa pełne boki, góra i dół między bokami, plecy nakładane. Fronty, okucia i luzy montażowe wymagają osobnego projektu.",
    calc:d=>{const inner=num(d,"width")-2*num(d,"board"),backW=num(d,"width"),backH=num(d,"height");return result("Światło korpusu",`${fmt(inner,0)} mm`,[row("Boki (2 szt.)",`${fmt(num(d,"height"),0)} × ${fmt(num(d,"depth"),0)} mm`),row("Góra i dół (2 szt.)",`${fmt(inner,0)} × ${fmt(num(d,"depth"),0)} mm`),row("Plecy (1 szt.)",`${fmt(backH,0)} × ${fmt(backW,0)} × ${fmt(num(d,"back"),0)} mm`)]);}
  },
  {
    id:"kantowki",category:"drewno",icon:"▤",name:"Kalkulator kantówek",tag:"zakupy",desc:"Liczba odcinków handlowych i odpad przy cięciu równych elementów.",
    fields:[n("pieceL","Długość jednego elementu","mm",850),n("count","Liczba elementów","szt.",18,1,1),n("stockL","Długość handlowa","mm",3000),n("kerf","Szerokość rzazu","mm",3)],formula:"elementy z odcinka = podłoga((długość handlowa + rzaz) ÷ (element + rzaz))",info:"Obliczenie dotyczy równych elementów bez wad drewna i bez dodatkowego naddatku na wyrównanie czoła.",
    calc:d=>{const per=Math.floor((num(d,"stockL")+num(d,"kerf"))/(num(d,"pieceL")+num(d,"kerf"))),stocks=Math.ceil(num(d,"count")/Math.max(per,1)),used=num(d,"count")*num(d,"pieceL")+(num(d,"count")-stocks)*num(d,"kerf"),waste=stocks*num(d,"stockL")-used;return result("Odcinki handlowe",`${stocks} szt.`,[row("Elementy z jednej sztuki",`${per}`),row("Łączny odpad",`${fmt(waste/1000,2)} m`),row("Wykorzystanie",`${fmt(used/(stocks*num(d,"stockL"))*100,1)}%`)]);}
  },
  {
    id:"moc-prad",category:"elektryka",icon:"ϟ",name:"Kalkulator mocy i prądu",tag:"elektryka",desc:"Prąd obciążenia dla instalacji jedno- i trójfazowej.",
    fields:[n("power","Moc czynna","kW",5.5,.01),n("voltage","Napięcie","V",230,1),n("pf","Współczynnik mocy cos φ","",.9,.01,.01),n("eff","Sprawność","%",90,1),s("phase","Układ",[["1","Jednofazowy"],["3","Trójfazowy"]],"1")],formula:"1 faza: I=P/(U·cosφ·η); 3 fazy: I=P/(√3·U·cosφ·η)",info:"Obliczony prąd nie jest automatycznym doborem zabezpieczenia ani przewodu. Uwzględnij sposób ułożenia, temperaturę, rozruch i wymagania projektu.",
    calc:d=>{const div=(d.phase==="3"?Math.sqrt(3):1)*num(d,"voltage")*num(d,"pf")*(num(d,"eff")/100),amps=num(d,"power")*1000/div;return result("Prąd roboczy",`${fmt(amps,2)} A`,[row("Moc pozorna",`${fmt(num(d,"power")/num(d,"pf"),2)} kVA`),row("Układ",d.phase==="3"?"trójfazowy":"jednofazowy")],"Dobór instalacji powierz wykwalifikowanemu elektrykowi.");}
  },
  {
    id:"spadek-napiecia",category:"elektryka",icon:"↯",name:"Kalkulator spadku napięcia",tag:"przewody",desc:"Orientacyjny spadek napięcia w przewodzie miedzianym lub aluminiowym.",
    fields:[n("current","Prąd obciążenia","A",16,.1),n("length","Długość trasy w jedną stronę","m",30,.1),n("section","Przekrój żyły","mm²",2.5,.1),n("voltage","Napięcie","V",230,1),s("material","Materiał",[["cu","Miedź"],["al","Aluminium"]],"cu"),s("phase","Układ",[["1","Jednofazowy"],["3","Trójfazowy"]],"1")],formula:"ΔU = współczynnik układu × ρ × L × I ÷ S",info:"Model uproszczony pomija reaktancję, temperaturę pracy i współczynnik mocy. Nie służy do ostatecznego doboru przewodu.",
    calc:d=>{const rho=d.material==="cu"?.0175:.0282,factor=d.phase==="3"?Math.sqrt(3):2,drop=factor*rho*num(d,"length")*num(d,"current")/num(d,"section"),p=drop/num(d,"voltage")*100;return result("Spadek napięcia",`${fmt(drop,2)} V`,[row("Spadek procentowy",`${fmt(p,2)}%`),row("Napięcie na końcu",`${fmt(num(d,"voltage")-drop,1)} V`),row("Strata mocy",`${fmt(drop*num(d,"current"),0)} W`)],p>5?"Wysoki wynik orientacyjny — instalacja wymaga ponownego doboru przez elektryka.":"Wynik wciąż wymaga sprawdzenia zgodnie z projektem instalacji.");}
  },
  {
    id:"energia",category:"elektryka",icon:"⌁",name:"Kalkulator zużycia energii",tag:"koszty",desc:"Zużycie i koszt pracy urządzenia w wybranym okresie.",
    fields:[n("power","Moc urządzenia","W",1500,1),n("hours","Praca dziennie","h",3,.1),n("days","Liczba dni","",30,1,1),n("price","Łączna cena energii","zł/kWh",1.15,.01)],formula:"energia = moc [kW] × czas pracy",info:"Wpisz łączny koszt 1 kWh z rachunku. Urządzenia sterowane termostatem mogą nie pobierać pełnej mocy przez cały czas.",
    calc:d=>{const kwh=num(d,"power")/1000*num(d,"hours")*num(d,"days");return result("Koszt okresu",`${fmt(kwh*num(d,"price"),2)} zł`,[row("Zużycie energii",`${fmt(kwh,2)} kWh`),row("Koszt dzienny",`${fmt(kwh*num(d,"price")/num(d,"days"),2)} zł`),row("Szacunek roczny",`${fmt(kwh/num(d,"days")*365*num(d,"price"),2)} zł`)]);}
  },
  {
    id:"fotowoltaika",category:"elektryka",icon:"☀",name:"Kalkulator systemu solarnego",tag:"energia",desc:"Wstępna moc paneli, magazynu i falownika dla instalacji wyspowej.",
    fields:[n("daily","Dzienne zużycie energii","kWh",8,.1),n("sun","Efektywne godziny słońca","h",3.5,.1),n("loss","Straty systemu","%",20,1),n("autonomy","Autonomia magazynu","dni",1,.1),n("dod","Użyteczna głębokość rozładowania","%",80,1),n("peak","Moc szczytowa odbiorników","kW",4,.1)],formula:"PV = energia dzienna ÷ (godziny słońca × sprawność systemu)",info:"To kalkulator wstępny. Sezonowość, orientacja paneli, temperatura, prądy rozruchowe i konfiguracja baterii wymagają projektu.",
    calc:d=>{const eff=1-num(d,"loss")/100,pv=num(d,"daily")/(num(d,"sun")*eff),battery=num(d,"daily")*num(d,"autonomy")/(num(d,"dod")/100),inv=num(d,"peak")*1.25;return result("Minimalna moc paneli",`${fmt(pv,2)} kWp`,[row("Nominalny magazyn energii",`${fmt(battery,1)} kWh`),row("Sugerowana moc falownika",`${fmt(inv,1)} kW`),row("Energia roczna odbiorów",`${fmt(num(d,"daily")*365,0)} kWh`)],"Dobór zabezpieczeń i instalację powinien wykonać uprawniony specjalista.");}
  },
  {
    id:"ogrzewanie",category:"elektryka",icon:"♨",name:"Kalkulator mocy ogrzewania",tag:"energia",desc:"Orientacyjne zapotrzebowanie na moc na podstawie kubatury.",
    fields:[n("area","Powierzchnia pomieszczenia","m²",25),n("height","Wysokość","m",2.6),s("standard","Standard cieplny",[["35","bardzo dobra izolacja — 35 W/m³"],["45","dobra izolacja — 45 W/m³"],["60","średnia izolacja — 60 W/m³"],["80","słaba izolacja — 80 W/m³"]],"45"),n("reserve","Rezerwa","%",10)],formula:"moc = kubatura × jednostkowe zapotrzebowanie × rezerwa",info:"Metoda kubaturowa jest orientacyjna. Dokładny dobór wymaga obliczenia strat ciepła przegród, wentylacji i temperatur projektowych.",
    calc:d=>{const volume=num(d,"area")*num(d,"height"),power=volume*Number(d.standard)*pct(num(d,"reserve"));return result("Moc grzewcza",`${fmt(power/1000,2)} kW`,[row("Kubatura",`${fmt(volume,1)} m³`),row("Moc jednostkowa",`${d.standard} W/m³`)]);}
  },
  {
    id:"rata",category:"finanse",icon:"%",name:"Kalkulator raty kredytu",tag:"finanse",desc:"Rata równa, suma odsetek i całkowity koszt finansowania.",
    fields:[n("amount","Kwota kredytu","zł",150000,1),n("rate","Oprocentowanie roczne","%",7.5,.01),n("years","Okres","lat",10,1,1),n("fee","Prowizja początkowa","%",1,.01)],formula:"rata = kapitał × r × (1+r)ⁿ ÷ [(1+r)ⁿ−1]",info:"Wyliczenie zakłada stałą stopę i raty równe. Nie obejmuje ubezpieczeń, zmian stóp ani dodatkowych opłat poza wpisaną prowizją.",
    calc:d=>{const p=num(d,"amount"),months=num(d,"years")*12,r=num(d,"rate")/1200,payment=r?p*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1):p/months,total=payment*months,fee=p*num(d,"fee")/100;return result("Miesięczna rata",`${fmt(payment,2)} zł`,[row("Suma rat",`${fmt(total,2)} zł`),row("Odsetki",`${fmt(total-p,2)} zł`),row("Prowizja",`${fmt(fee,2)} zł`),row("Łączny koszt ponad kapitał",`${fmt(total-p+fee,2)} zł`)],"To symulacja, nie oferta finansowa.");}
  },
  {
    id:"hipoteka",category:"finanse",icon:"⌂",name:"Kalkulator kredytu hipotecznego",tag:"finanse",desc:"Wkład własny, kwota finansowania, rata i wskaźnik LTV.",
    fields:[n("price","Cena nieruchomości","zł",650000,1),n("deposit","Wkład własny","zł",130000,1),n("rate","Oprocentowanie roczne","%",6.8,.01),n("years","Okres","lat",25,1,1)],formula:"LTV = kwota kredytu ÷ wartość nieruchomości × 100%",info:"Rata jest symulacją dla stałego oprocentowania w całym okresie i nie obejmuje kosztów okołokredytowych.",
    calc:d=>{const loan=Math.max(0,num(d,"price")-num(d,"deposit")),m=num(d,"years")*12,r=num(d,"rate")/1200,pay=r?loan*r*Math.pow(1+r,m)/(Math.pow(1+r,m)-1):loan/m,total=pay*m;return result("Miesięczna rata",`${fmt(pay,2)} zł`,[row("Kwota kredytu",`${fmt(loan,2)} zł`),row("LTV",`${fmt(loan/num(d,"price")*100,1)}%`),row("Suma odsetek",`${fmt(total-loan,2)} zł`)],"To symulacja, nie porada ani oferta finansowa.");}
  },
  {
    id:"vat",category:"finanse",icon:"VAT",name:"Kalkulator netto–brutto",tag:"firma",desc:"Kwota netto, podatek VAT i wartość brutto.",
    fields:[n("amount","Kwota","zł",1000,.01),s("direction","Podana kwota jest",[["net","Netto"],["gross","Brutto"]],"net"),s("rate","Stawka VAT",[["23","23%"],["8","8%"],["5","5%"],["0","0%"]],"23")],formula:"brutto = netto × (1 + VAT)",info:"Właściwa stawka zależy od towaru, usługi i warunków transakcji. Kalkulator nie rozstrzyga kwalifikacji podatkowej.",
    calc:d=>{const a=num(d,"amount"),r=Number(d.rate)/100,net=d.direction==="net"?a:a/(1+r),gross=d.direction==="gross"?a:a*(1+r);return result(d.direction==="net"?"Kwota brutto":"Kwota netto",`${fmt(d.direction==="net"?gross:net,2)} zł`,[row("Netto",`${fmt(net,2)} zł`),row("VAT",`${fmt(gross-net,2)} zł`),row("Brutto",`${fmt(gross,2)} zł`)]);}
  },
  {
    id:"marza",category:"finanse",icon:"↗",name:"Kalkulator marży i narzutu",tag:"firma",desc:"Cena sprzedaży, marża procentowa i narzut na koszty.",
    fields:[n("cost","Koszt","zł",500,.01),n("price","Cena sprzedaży netto","zł",750,.01)],formula:"marża = zysk ÷ cena sprzedaży; narzut = zysk ÷ koszt",info:"Marża i narzut to różne wskaźniki. Kalkulator pracuje na wartościach bez podatku VAT.",
    calc:d=>{const profit=num(d,"price")-num(d,"cost"),margin=profit/num(d,"price")*100,markup=profit/num(d,"cost")*100;return result("Zysk jednostkowy",`${fmt(profit,2)} zł`,[row("Marża",`${fmt(margin,2)}%`),row("Narzut",`${fmt(markup,2)}%`),row("Udział kosztu w cenie",`${fmt(num(d,"cost")/num(d,"price")*100,2)}%`)]);}
  },
  {
    id:"stawka",category:"finanse",icon:"⏱",name:"Kalkulator stawki robocizny",tag:"firma",desc:"Minimalna stawka godzinowa pokrywająca koszty i planowaną marżę.",
    fields:[n("salary","Miesięczny koszt pracownika","zł",9000),n("overhead","Koszty firmy przypisane miesięcznie","zł",5000),n("hours","Dostępne godziny","h",168,1),n("billable","Godziny fakturowalne","%",70,1),n("margin","Docelowa marża","%",25,1)],formula:"stawka = koszt miesięczny ÷ godziny fakturowalne ÷ (1 − marża)",info:"Dodaj wszystkie koszty pośrednie: pojazd, narzędzia, administrację, urlopy, poprawki i czas ofertowania.",
    calc:d=>{const cost=num(d,"salary")+num(d,"overhead"),bill=num(d,"hours")*num(d,"billable")/100,base=cost/bill,rate=base/(1-num(d,"margin")/100);return result("Stawka sprzedażowa netto",`${fmt(rate,2)} zł/h`,[row("Koszt godziny fakturowalnej",`${fmt(base,2)} zł/h`),row("Godziny fakturowalne",`${fmt(bill,1)} h/mies.`),row("Przychód docelowy",`${fmt(rate*bill,2)} zł/mies.`)]);}
  },
  {
    id:"wynajem",category:"finanse",icon:"🛠",name:"Kalkulator stawki wynajmu sprzętu",tag:"firma",desc:"Minimalna dzienna stawka na podstawie kosztów, wykorzystania i zysku.",
    fields:[n("purchase","Cena zakupu","zł",50000),n("residual","Wartość końcowa","zł",10000),n("years","Okres użytkowania","lat",5,1),n("annual","Koszty roczne","zł",6000),n("days","Dni wynajmu rocznie","",120,1,1),n("margin","Marża","%",25,1)],formula:"stawka = (roczna amortyzacja + koszty) ÷ dni wykorzystania ÷ (1 − marża)",info:"Nie uwzględnia finansowania, szkód, kaucji ani podatków. Dopasuj koszty do konkretnego sprzętu.",
    calc:d=>{const dep=(num(d,"purchase")-num(d,"residual"))/num(d,"years"),cost=(dep+num(d,"annual"))/num(d,"days"),rate=cost/(1-num(d,"margin")/100);return result("Stawka dzienna netto",`${fmt(rate,2)} zł`,[row("Amortyzacja roczna",`${fmt(dep,2)} zł`),row("Koszt dzienny",`${fmt(cost,2)} zł`),row("Przychód roczny",`${fmt(rate*num(d,"days"),2)} zł`)]);}
  },
  {
    id:"blacha-stal",category:"warsztat",icon:"▰",name:"Kalkulator masy blachy",tag:"stal",desc:"Masa arkusza według wymiarów, grubości i gęstości.",
    fields:[n("length","Długość","mm",2000),n("width","Szerokość","mm",1000),n("thickness","Grubość","mm",5),n("count","Liczba","szt.",1,1,1),n("density","Gęstość","kg/m³",7850)],formula:"masa = długość × szerokość × grubość × gęstość",info:"Gęstość stali konstrukcyjnej przyjęto domyślnie jako 7850 kg/m³; dla innych stopów wpisz właściwą wartość.",
    calc:d=>{const one=num(d,"length")/1000*num(d,"width")/1000*num(d,"thickness")/1000*num(d,"density"),total=one*num(d,"count");return result("Masa łączna",`${fmt(total,2)} kg`,[row("Masa jednej sztuki",`${fmt(one,2)} kg`),row("Powierzchnia łączna",`${fmt(num(d,"length")/1000*num(d,"width")/1000*num(d,"count"),2)} m²`)]);}
  },
  {
    id:"rura-stal",category:"warsztat",icon:"○",name:"Kalkulator masy rury",tag:"stal",desc:"Masa rury okrągłej ze średnicy, ścianki i długości.",
    fields:[n("diameter","Średnica zewnętrzna","mm",60.3),n("wall","Grubość ścianki","mm",3.2),n("length","Długość","m",6),n("count","Liczba","szt.",4,1,1),n("density","Gęstość","kg/m³",7850)],formula:"pole przekroju = π/4 × (D² − d²)",info:"Wynik teoretyczny może różnić się od masy katalogowej ze względu na tolerancje wymiarów.",
    calc:d=>{const D=num(d,"diameter")/1000,di=Math.max(0,D-2*num(d,"wall")/1000),area=Math.PI/4*(D*D-di*di),per=area*num(d,"density"),total=per*num(d,"length")*num(d,"count");return result("Masa łączna",`${fmt(total,2)} kg`,[row("Masa 1 mb",`${fmt(per,3)} kg/m`),row("Łączna długość",`${fmt(num(d,"length")*num(d,"count"),1)} m`)]);}
  },
  {
    id:"kola-pasowe",category:"warsztat",icon:"◉",name:"Kalkulator kół pasowych",tag:"mechanika",desc:"Przełożenie i prędkość napędzanego wału.",
    fields:[n("rpm","Obroty silnika","obr./min",1450,1),n("drive","Średnica koła napędzającego","mm",100),n("driven","Średnica koła napędzanego","mm",250),n("slip","Poślizg","%",2,.1)],formula:"n₂ = n₁ × D₁ ÷ D₂ × (1 − poślizg)",info:"Model pomija ograniczenia pasa, minimalne średnice kół, opasanie i straty inne niż wpisany poślizg.",
    calc:d=>{const ratio=num(d,"driven")/num(d,"drive"),rpm=num(d,"rpm")/ratio*(1-num(d,"slip")/100);return result("Obroty wału napędzanego",`${fmt(rpm,0)} obr./min`,[row("Przełożenie",`${fmt(ratio,3)} : 1`),row("Zmiana momentu teoretyczna",`× ${fmt(ratio,2)}`)]);}
  },
  {
    id:"giecie",category:"warsztat",icon:"⌐",name:"Kalkulator naddatku na gięcie",tag:"blacha",desc:"Długość łuku osi obojętnej dla pojedynczego gięcia.",
    fields:[n("angle","Kąt gięcia","°",90,1),n("radius","Promień wewnętrzny","mm",2,.1),n("thickness","Grubość blachy","mm",1.5,.1),n("kfactor","Współczynnik K","",.33,.01,.01)],formula:"BA = kąt [rad] × (promień + K × grubość)",info:"Współczynnik K zależy od materiału, narzędzia i procesu. Dla produkcji seryjnej wykonaj próbę i skalibruj wartość.",
    calc:d=>{const ba=num(d,"angle")*Math.PI/180*(num(d,"radius")+num(d,"kfactor")*num(d,"thickness"));return result("Naddatek na gięcie BA",`${fmt(ba,2)} mm`,[row("Oś obojętna od wewnątrz",`${fmt(num(d,"kfactor")*num(d,"thickness"),2)} mm`),row("Promień osi obojętnej",`${fmt(num(d,"radius")+num(d,"kfactor")*num(d,"thickness"),2)} mm`)]);}
  },
  {
    id:"zawiesia",category:"warsztat",icon:"⌄",name:"Kalkulator siły w zawiesiach",tag:"BHP",desc:"Teoretyczna siła w symetrycznych cięgnach przy podanym kącie.",
    fields:[n("load","Masa ładunku","kg",2000,1),n("legs","Liczba obciążonych cięgien","",2,1,1),n("angle","Kąt cięgna od poziomu","°",60,1)],formula:"T = ciężar ÷ (liczba cięgien × sin kąta)",info:"Narzędzie edukacyjne. Nie uwzględnia dynamiki, nierównego rozkładu, środka ciężkości ani parametrów osprzętu.",
    calc:d=>{const a=num(d,"angle")*Math.PI/180,t=num(d,"load")/(num(d,"legs")*Math.sin(a));return result("Siła na jedno cięgno",`${fmt(t,0)} kgf`,[row("W niutonach",`${fmt(t*9.80665,0)} N`),row("Współczynnik względem równego podziału",`× ${fmt(1/Math.sin(a),2)}`)],"Nie używaj wyniku jako planu podnoszenia. Operację musi zatwierdzić kompetentna osoba na podstawie dokumentacji sprzętu.");}
  },
  {
    id:"nacisk",category:"warsztat",icon:"▼",name:"Kalkulator nacisku na podłoże",tag:"BHP",desc:"Średni nacisk podpory na płytę rozkładającą obciążenie.",
    fields:[n("load","Obciążenie podpory","kN",180,.1),n("plateL","Długość płyty","m",1.2,.01),n("plateW","Szerokość płyty","m",1.2,.01)],formula:"ciśnienie = siła ÷ pole podparcia",info:"Nie uwzględnia mimośrodu, sztywności płyty, rozkładu naprężeń ani nośności gruntu.",
    calc:d=>{const area=num(d,"plateL")*num(d,"plateW"),kpa=num(d,"load")/area;return result("Średni nacisk",`${fmt(kpa,1)} kPa`,[row("Pole podparcia",`${fmt(area,2)} m²`),row("W tonach na m²",`${fmt(kpa/9.80665,2)} t/m²`)],"Nie stosuj jako samodzielnej podstawy ustawienia żurawia lub ciężkiego sprzętu. Wymagana jest ocena inżynierska i dane geotechniczne.");}
  }
];

const conversionSpecs = [
  {id:"dlugosc",name:"Przelicznik długości",icon:"↔",units:{"mm":.001,"cm":.01,"m":1,"km":1000,"cal":.0254,"stopa":.3048,"jard":.9144,"mila":1609.344}},
  {id:"pole",name:"Przelicznik powierzchni",icon:"□",units:{"mm²":1e-6,"cm²":1e-4,"m²":1,"ar":100,"ha":10000,"km²":1e6,"stopa²":.09290304,"akr":4046.8564224}},
  {id:"objetosc",name:"Przelicznik objętości",icon:"▣",units:{"ml":.001,"l":1,"m³":1000,"cm³":.001,"stopa³":28.3168466,"galon US":3.7854118,"galon UK":4.54609}},
  {id:"masa",name:"Przelicznik masy",icon:"⚖",units:{"mg":1e-6,"g":.001,"kg":1,"t":1000,"uncja":.028349523,"funt":.45359237}},
  {id:"cisnienie",name:"Przelicznik ciśnienia",icon:"↥",units:{"Pa":1,"kPa":1000,"MPa":1e6,"bar":100000,"atm":101325,"psi":6894.757293}},
  {id:"energia-jednostki",name:"Przelicznik energii",icon:"ϟ",units:{"J":1,"kJ":1000,"MJ":1e6,"Wh":3600,"kWh":3.6e6,"kcal":4184,"BTU":1055.055853}},
  {id:"kat",name:"Przelicznik kąta",icon:"∠",units:{"stopień":Math.PI/180,"radian":1,"grad":Math.PI/200,"minuta kątowa":Math.PI/10800}},
];

conversionSpecs.forEach(spec => calculators.push({
  id:spec.id,category:"przeliczniki",icon:spec.icon,name:spec.name,tag:"jednostki",desc:`Szybka konwersja między popularnymi jednostkami.`,
  fields:[n("value","Wartość","",1,-Infinity),s("from","Z jednostki",Object.keys(spec.units).map(x=>[x,x])),s("to","Na jednostkę",Object.keys(spec.units).map(x=>[x,x]),Object.keys(spec.units)[1])],
  formula:"wynik = wartość × współczynnik jednostki źródłowej ÷ współczynnik jednostki docelowej",info:"Przeliczenie wykorzystuje stałe współczynniki jednostek.",
  calc:d=>{const val=num(d,"value")*spec.units[d.from]/spec.units[d.to];return result("Wynik",`${fmt(val,8)} ${d.to}`,[row("Przeliczenie",`${fmt(num(d,"value"),8)} ${d.from} = ${fmt(val,8)} ${d.to}`)]);}
}));

calculators.push({
  id:"temperatura",category:"przeliczniki",icon:"℃",name:"Przelicznik temperatury",tag:"jednostki",desc:"Konwersja między stopniami Celsjusza, Fahrenheita i Kelvina.",
  fields:[n("value","Temperatura","",20,-Infinity),s("from","Z jednostki",[["C","Celsjusz (°C)"],["F","Fahrenheit (°F)"],["K","Kelwin (K)"]],"C"),s("to","Na jednostkę",[["C","Celsjusz (°C)"],["F","Fahrenheit (°F)"],["K","Kelwin (K)"]],"F")],formula:"°F = °C × 9/5 + 32; K = °C + 273,15",info:"Temperatura poniżej zera bezwzględnego nie ma sensu fizycznego.",
  calc:d=>{const v=num(d,"value"),c=d.from==="C"?v:d.from==="F"?(v-32)*5/9:v-273.15,out=d.to==="C"?c:d.to==="F"?c*9/5+32:c+273.15,u=d.to==="K"?"K":`°${d.to}`;return result("Wynik",`${fmt(out,4)} ${u}`,[row("W stopniach Celsjusza",`${fmt(c,4)} °C`)],c<-273.15?"Wartość jest niższa od zera bezwzględnego.":"");}
});

const categoryMap = Object.fromEntries(categories.map(c => [c.id,c]));
const main = $("#main");
let currentResultText = "";
let toastTimer;

function navMarkup(){
  return `<a class="nav-link" href="#/">Start</a>${categories.map(c=>`<a class="nav-link" href="#/kategoria/${c.id}">${c.name.split(" i ")[0]}</a>`).join("")}`;
}

function toolCard(t){
  return `<a class="tool-card" href="#/kalkulator/${t.id}"><div class="tool-card-top"><span class="tool-icon">${t.icon}</span><span class="tool-tag">${t.tag}</span></div><h3>${t.name}</h3><p>${t.desc}</p><span class="tool-open">Otwórz kalkulator →</span></a>`;
}

function homeView(){
  const recent = getRecent().map(id=>calculators.find(x=>x.id===id)).filter(Boolean).slice(0,6);
  main.innerHTML = `
    <section class="hero"><div class="hero-inner"><div><span class="eyebrow">Narzędzia Home Lab&amp;Fix</span><h1>Policz, zanim <em>zaczniesz.</em></h1><p>Praktyczne kalkulatory dla budowy, remontu i warsztatu. Czytelne wyniki, polskie jednostki i bez zbędnych komplikacji.</p><div class="search-wrap">${icons.search}<input id="search" class="search-input" type="search" placeholder="Szukaj: beton, dach, schody, VAT…" autocomplete="off" aria-label="Szukaj kalkulatora"><button class="search-clear" type="button" aria-label="Wyczyść wyszukiwanie">×</button></div></div><div class="hero-sketch" aria-hidden="true"><div class="sketch-card"><div class="sketch-top"><span>SZYBKI POMIAR</span><span>01</span></div><div class="sketch-grid"><div class="sketch-item"><small>długość</small><strong>4,00 m</strong></div><div class="sketch-item"><small>spadek</small><strong>2%</strong></div></div><div class="sketch-line"></div><div class="sketch-item" style="margin-top:18px"><small>różnica wysokości</small><strong style="color:#2767d8">8,0 cm ✓</strong></div></div></div></div></section>
    <section class="section" id="categories"><div class="section-head"><div><h2>Wybierz kategorię</h2><p>Każdy dział prowadzi do zestawu narzędzi przygotowanych do konkretnych prac.</p></div><button class="link-arrow link-button" id="show-all" type="button">Wszystkie kalkulatory ↓</button></div><div class="category-grid">${categories.map(c=>`<a class="category-card" href="#/kategoria/${c.id}" style="--card-tint:${c.tint}"><span class="icon-box">${c.icon}</span><h3>${c.name}</h3><p>${c.desc}</p><span class="count">${calculators.filter(x=>x.category===c.id).length} narzędzi →</span></a>`).join("")}</div></section>
    ${recent.length?`<section class="section compact"><div class="section-head"><div><h2>Ostatnio używane</h2><p>Wróć szybko do niedawnych obliczeń.</p></div></div><div class="tool-grid">${recent.map(toolCard).join("")}</div></section>`:""}
    <section class="section" id="all-tools"><div class="section-head"><div><h2>Wszystkie kalkulatory</h2><p><span id="tool-count">${calculators.length}</span> narzędzi dostępnych od ręki.</p></div></div><div id="tools-grid" class="tool-grid">${calculators.map(toolCard).join("")}</div></section>`;
  const search=$("#search");
  search.addEventListener("input",()=>filterTools(search.value));
  $(".search-clear").addEventListener("click",()=>{search.value="";filterTools("");search.focus();});
  $("#show-all").addEventListener("click",()=>$("#all-tools").scrollIntoView({behavior:"smooth",block:"start"}));
}

function filterTools(q){
  const term=q.trim().toLocaleLowerCase("pl");
  const list=calculators.filter(t=>`${t.name} ${t.desc} ${t.tag} ${categoryMap[t.category].name}`.toLocaleLowerCase("pl").includes(term));
  $("#tool-count").textContent=list.length;
  $("#tools-grid").innerHTML=list.length?list.map(toolCard).join(""):`<div class="empty-state"><h3>Brak pasujących narzędzi</h3><p>Spróbuj krótszego hasła albo wybierz kategorię powyżej.</p></div>`;
  if(term) $("#all-tools").scrollIntoView({behavior:"smooth",block:"start"});
}

function categoryView(id){
  const c=categoryMap[id]; if(!c) return notFound();
  const list=calculators.filter(t=>t.category===id);
  main.innerHTML=`<div class="category-hero"><div class="category-hero-inner"><span class="category-symbol">${c.icon}</span><div><span class="eyebrow">Kategoria</span><h1>${c.name}</h1><p>${c.desc} Wybierz narzędzie i wpisz własne dane.</p></div></div></div><div class="breadcrumbs"><a href="#/">Start</a> / ${c.name}</div><section class="section compact"><div class="section-head"><div><h2>Dostępne narzędzia</h2><p>${list.length} kalkulatorów w tej kategorii.</p></div></div><div class="tool-grid">${list.map(toolCard).join("")}</div></section>`;
}

function fieldMarkup(f){
  if(f.type==="select") return `<div class="field"><label for="${f.id}">${f.label}</label><div class="input-shell"><select id="${f.id}" name="${f.id}">${f.options.map(o=>`<option value="${o[0]}" ${String(o[0])===String(f.value)?"selected":""}>${o[1]}</option>`).join("")}</select></div>${f.hint?`<div class="hint">${f.hint}</div>`:""}</div>`;
  return `<div class="field"><label for="${f.id}">${f.label}</label><div class="input-shell"><input id="${f.id}" name="${f.id}" type="number" value="${f.value}" ${Number.isFinite(f.min)?`min="${f.min}"`:""} step="${f.step}" inputmode="decimal" required>${f.unit?`<span class="unit">${f.unit}</span>`:""}</div>${f.hint?`<div class="hint">${f.hint}</div>`:""}</div>`;
}

function calculatorView(id){
  const t=calculators.find(x=>x.id===id); if(!t) return notFound();
  addRecent(id);
  const c=categoryMap[t.category];
  main.innerHTML=`<div class="breadcrumbs"><a href="#/">Start</a> / <a href="#/kategoria/${c.id}">${c.name}</a> / ${t.name}</div><section class="calc-layout"><div class="calc-panel"><div class="calc-title"><span class="tool-icon">${t.icon}</span><div><h1>${t.name}</h1><p>${t.desc}</p></div></div><form id="calc-form"><div class="form-grid">${t.fields.map(fieldMarkup).join("")}</div><div class="form-actions"><button class="primary-btn" type="submit">Oblicz wynik</button><button class="secondary-btn" type="reset">Wyczyść</button></div></form></div><aside class="result-panel"><div class="result-head"><h2>Twój wynik</h2><button id="copy-result" class="copy-btn" type="button">Kopiuj wynik</button></div><div id="result-body" class="result-body"><div class="result-placeholder"><div><span>∑</span>Uzupełnij dane i wybierz „Oblicz wynik”.</div></div></div></aside><div class="info-panel"><h2>Jak działa obliczenie?</h2><p>${t.info}</p><div class="formula">${t.formula}</div></div></section>`;
  const form=$("#calc-form");
  form.addEventListener("submit",e=>{e.preventDefault();calculate(t,form);});
  form.addEventListener("reset",()=>setTimeout(()=>{$("#result-body").innerHTML='<div class="result-placeholder"><div><span>∑</span>Uzupełnij dane i wybierz „Oblicz wynik”.</div></div>';currentResultText="";},0));
  $("#copy-result").addEventListener("click",copyResult);
  calculate(t,form);
}

function calculate(t,form){
  if(!form.reportValidity()) return;
  const d=Object.fromEntries(new FormData(form).entries());
  try {
    const r=t.calc(d);
    if(!r || /NaN|Infinity/.test(JSON.stringify(r))) throw new Error("Nieprawidłowe dane");
    currentResultText=[t.name,`${r.mainLabel}: ${r.mainValue}`,...r.rows.map(x=>`${x.label}: ${x.value}`)].join("\n");
    $("#result-body").innerHTML=`<div class="result-main"><small>${r.mainLabel}</small><strong>${r.mainValue}</strong></div>${r.rows.length?`<div class="result-list">${r.rows.map(x=>`<div class="result-row"><span>${x.label}</span><strong>${x.value}</strong></div>`).join("")}</div>`:""}${r.warning?`<div class="warning">⚠ ${r.warning}</div>`:""}`;
  } catch(err) {
    $("#result-body").innerHTML='<div class="warning">Sprawdź, czy wszystkie wartości są większe od zera i spróbuj ponownie.</div>';
    currentResultText="";
  }
}

async function copyResult(){
  if(!currentResultText){showToast("Najpierw wykonaj obliczenie.");return;}
  try{await navigator.clipboard.writeText(currentResultText);showToast("Wynik skopiowany.");}
  catch{showToast("Nie udało się skopiować wyniku.");}
}

function getRecent(){try{return JSON.parse(localStorage.getItem("hlf-recent")||"[]");}catch{return[];}}
function addRecent(id){try{localStorage.setItem("hlf-recent",JSON.stringify([id,...getRecent().filter(x=>x!==id)].slice(0,6)));}catch{}}
function showToast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200);}
function notFound(){main.innerHTML='<section class="section"><div class="empty-state"><h3>Nie znaleziono strony</h3><p><a class="link-arrow" href="#/">Wróć do strony głównej →</a></p></div></section>';}

function route(){
  const parts=location.hash.replace(/^#\/?/,"").split("/").filter(Boolean);
  if(!parts.length) homeView();
  else if(parts[0]==="kategoria") categoryView(parts[1]);
  else if(parts[0]==="kalkulator") calculatorView(parts[1]);
  else notFound();
  document.title=parts[0]==="kalkulator"?(calculators.find(x=>x.id===parts[1])?.name||"Kalkulator")+" | Home Lab&Fix":"Kalkulatory Home Lab&Fix";
  $(".main-nav").classList.remove("open");$(".menu-toggle").setAttribute("aria-expanded","false");
  document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.getAttribute("href")===location.hash));
  window.scrollTo(0,0);
}

$("#main-nav").innerHTML=navMarkup();
$("#footer-categories").innerHTML=categories.map(c=>`<a href="#/kategoria/${c.id}">${c.name}</a>`).join("");
$(".menu-toggle").addEventListener("click",e=>{const nav=$(".main-nav"),open=nav.classList.toggle("open");e.currentTarget.setAttribute("aria-expanded",String(open));});
window.addEventListener("hashchange",route);
route();
