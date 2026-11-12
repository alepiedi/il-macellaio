"""Unisce gli STL in targa-qr-menu.3mf: la targa come un solo oggetto in 4 parti (targa, qr, logo, testo),
così nello slicer basta assegnare un filamento a ogni parte; il supporto come oggetto a sé."""
import zipfile, trimesh
from xml.sax.saxutils import quoteattr

def mesh_xml(oid, nome, m):
    v = ''.join(f'<vertex x="{x:.4f}" y="{y:.4f}" z="{z:.4f}"/>' for x, y, z in m.vertices)
    t = ''.join(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>' for a, b, c in m.faces)
    return f'<object id="{oid}" name={quoteattr(nome)} type="model"><mesh><vertices>{v}</vertices><triangles>{t}</triangles></mesh></object>'

parti = ['targa', 'qr', 'logo', 'testo']
oggetti = [mesh_xml(i + 1, n, trimesh.load(f'{n}.stl')) for i, n in enumerate(parti)]
comp = ''.join(f'<component objectid="{i + 1}"/>' for i in range(len(parti)))
oggetti.append(f'<object id="5" name="Targa QR menu" type="model"><components>{comp}</components></object>')
oggetti.append(mesh_xml(6, 'Supporto', trimesh.load('supporto.stl')))
modello = ('<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="it-IT" '
           'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources>' + ''.join(oggetti) +
           '</resources><build><item objectid="5" transform="1 0 0 0 1 0 0 0 1 20 20 0"/>'
           '<item objectid="6" transform="1 0 0 0 1 0 0 0 1 130 40 0"/></build></model>')
with zipfile.ZipFile('targa-qr-menu.3mf', 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
    z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
    z.writestr('3D/3dmodel.model', modello)
print('ok')
