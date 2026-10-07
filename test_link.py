import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def add_hyperlink(paragraph, url, text, color="0563C1", underline=True):
    part = paragraph.part
    r_id = part.relate_to(url, docx.opc.constants.RELATIONSHIP_TYPE.HYPERLINK, is_external=True)
    hyperlink = parse_xml(
        f'<w:hyperlink {nsdecls("w")} {nsdecls("r")} r:id="{r_id}">'
        f'<w:r>'
        f'<w:rPr>'
        f'<w:color w:val="{color}"/>'
        f'{"<w:u w:val=\'single\'/>" if underline else ""}'
        f'</w:rPr>'
        f'<w:t>{text}</w:t>'
        f'</w:r>'
        f'</w:hyperlink>'
    )
    paragraph._p.append(hyperlink)

doc = docx.Document()
p = doc.add_paragraph('Repositori: ')
add_hyperlink(p, 'https://github.com/Andrakkkk/GadgetTrustX', 'https://github.com/Andrakkkk/GadgetTrustX')
doc.save('test_link.docx')
print('Hyperlink generated successfully!')
