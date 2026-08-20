import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd

class ChartGeneratorAgent:
    @classmethod
    def generate_chart_png(cls, chart_data: list, x_col: str, y_col: str, title: str) -> bytes:
        df = pd.DataFrame(chart_data)
        
        fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
        
        if not df.empty and x_col in df.columns and y_col in df.columns:
            ax.plot(df[x_col].astype(str), df[y_col], marker='o', color='#003366', linewidth=2, label=y_col)
            ax.fill_between(df[x_col].astype(str), df[y_col], color='#003366', alpha=0.1)

        ax.set_title(f"Bank of Tanzania Oversight: {title}", fontsize=12, fontweight='bold', color='#003366')
        ax.set_xlabel("Time Horizon / Period", fontsize=10)
        ax.set_ylabel("Metric Value", fontsize=10)
        ax.grid(True, linestyle='--', alpha=0.5)
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()

        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300)
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer.getvalue()
