// Targa da tavolo con il QR del menu · Il Macellaio Benevento
// Stampa: targa distesa (faccia in su), rilievi in un altro colore; supporto a parte.
// Parti (per esportarle una per una): parte = "targa" | "qr" | "logo" | "testo" | "supporto" | "tutto" | "montata" (solo anteprima)
include <qr-dati.scad>
use <manrope-tavolo.ttf>

parte = "tutto";

/* [Targa] */
larghezza = 90;        // mm
altezza = 136;         // mm
spessore = 3;          // mm
raggio = 6;            // angoli arrotondati
rilievo = 0.6;         // altezza di QR, logo e testi (3 strati da 0,2)

/* [Contenuti] */
qr_lato = 64;          // lato del QR (senza margine bianco)
logo_largo = 72;
riga1 = "Inquadra il codice";
riga2 = "e sfoglia il nostro menu";
sito = "ilmacellaiobn.it";
font = "Manrope Tavolo";

/* [Supporto] */
fessura = 3.4;         // spessore targa + gioco
fessura_prof = 9;      // quanto entra la targa nel supporto
inclinazione = 12;     // gradi all'indietro
supporto = [100, 36, 14];

$fn = 48;
margine_basso = fessura_prof + 5;   // la parte bassa finisce nel supporto: lì niente scritte

module piastra2d() {
  offset(r = raggio) offset(delta = -raggio) square([larghezza, altezza]);
}

module qr2d() {
  m = qr_lato / qr_moduli;
  translate([(larghezza - qr_lato) / 2, y_qr])
    for (c = qr_corse) translate([c[1] * m, (qr_moduli - 1 - c[0]) * m]) square([c[2] * m + 0.001, m + 0.001]);
}

module logo2d() {
  translate([larghezza / 2, y_logo]) resize([logo_largo, 0], auto = true) import("logo-lettere.svg", center = true);
}

module testo2d() {
  translate([larghezza / 2, y_riga1]) text(riga1, size = 4.6, font = font, halign = "center", valign = "baseline");
  translate([larghezza / 2, y_riga2]) text(riga2, size = 4.6, font = font, halign = "center", valign = "baseline");
  translate([larghezza / 2, y_sito]) text(sito, size = 4.2, font = font, halign = "center", valign = "baseline");
}

// Posizioni dal basso verso l'alto
y_sito = margine_basso;
y_qr = y_sito + 4.2 + 4.5;
y_riga2 = y_qr + qr_lato + 6;
y_riga1 = y_riga2 + 6.6;
y_logo = altezza - 7 - logo_largo * 906 / 3000 / 2 * 0.86;

module targa() { linear_extrude(spessore) piastra2d(); }
module rilievo_di() { translate([0, 0, spessore - 0.01]) linear_extrude(rilievo + 0.01) children(); }

module supporto() {
  difference() {
    // Blocco con i lati smussati in alto
    hull() {
      translate([0, 0, 0]) cube([supporto[0], supporto[1], 1]);
      translate([3, 3, supporto[2] - 1]) cube([supporto[0] - 6, supporto[1] - 6, 1]);
    }
    // Fessura inclinata all'indietro
    translate([(supporto[0] - larghezza - 1) / 2, supporto[1] / 2, supporto[2] - fessura_prof])
      rotate([-inclinazione, 0, 0]) translate([0, -fessura / 2, 0]) cube([larghezza + 1, fessura, fessura_prof * 3]);
  }
}

if (parte == "targa") targa();
if (parte == "qr") rilievo_di() qr2d();
if (parte == "logo") rilievo_di() logo2d();
if (parte == "testo") rilievo_di() testo2d();
if (parte == "supporto") supporto();
if (parte == "tutto") {
  color("#f1e4d0") targa();
  color("#111") rilievo_di() qr2d();
  color("#db0a18") rilievo_di() logo2d();
  color("#111") rilievo_di() testo2d();
  color("#111") translate([larghezza + 10, 0, 0]) supporto();
}
if (parte == "montata") {
  color("#111") supporto();
  translate([(supporto[0] - larghezza) / 2, supporto[1] / 2, supporto[2] - fessura_prof + 0.5])
    rotate([90 - inclinazione, 0, 0]) translate([0, 0, -spessore / 2]) {
      color("#f1e4d0") targa();
      color("#111") rilievo_di() qr2d();
      color("#db0a18") rilievo_di() logo2d();
      color("#111") rilievo_di() testo2d();
    }
}
