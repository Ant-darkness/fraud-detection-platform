import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportGeneratorAgent:
    @classmethod
    def generate_pdf_report(cls, title: str, summary: str, data_rows: list) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('BoT_Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#003366'), spaceAfter=12)
        body_style = ParagraphStyle('BoT_Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=10)

        # Header
        story.append(Paragraph(f"BANK OF TANZANIA - {title.upper()}", title_style))
        story.append(Paragraph(f"<b>Executive Summary:</b> {summary}", body_style))
        story.append(Spacer(1, 12))

        # Data Table Formatting
        if data_rows and isinstance(data_rows, list):
            headers = list(data_rows[0].keys())
            table_data = [headers]
            for row in data_rows:
                table_data.append([str(row.get(h, '')) for h in headers])

            t = Table(table_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F2F2F2')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            story.append(t)

        doc.build(story)
        pdf_value = buffer.getvalue()
        buffer.close()
        return pdf_value
