"""Scrive qr-dati.scad con la matrice del QR del menu. Uso: python3 genera.py [url]"""
import sys, qrcode
url = sys.argv[1] if len(sys.argv) > 1 else 'https://ilmacellaiobn.it/menu/'
q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=0)
q.add_data(url); q.make(fit=True)
m = q.get_matrix()
# Righe come corse orizzontali [riga, colonna, lunghezza]: meno pezzi da unire in OpenSCAD.
corse = []
for r, riga in enumerate(m):
    c = 0
    while c < len(riga):
        if riga[c]:
            i = c
            while i < len(riga) and riga[i]: i += 1
            corse.append([r, c, i - c]); c = i
        else: c += 1
with open('qr-dati.scad', 'w') as f:
    f.write(f'// Generato da genera.py per {url} (correzione Q, versione {q.version})\n')
    f.write(f'qr_url = "{url}";\nqr_moduli = {len(m)};\nqr_corse = {corse};\n')
print(url, 'versione', q.version, len(m), 'moduli')
