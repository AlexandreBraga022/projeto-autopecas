import json
from google import genai

# ================== ENGINE DE INTELIGÊNCIA ==================
class TechTurboDashboardEngine:

    # ================== INICIALIZAÇÃO ==================
    def __init__(self, products: list, orders: list, api_key: str):
        self.products = products if isinstance(products, list) else []
        self.orders = orders if isinstance(orders, list) else []
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key) if api_key else None

    # ================== CÁLCULO DE KPIS ==================
    def get_kpis(self) -> dict:
        total_products = len(self.products)
        total_stock_units = 0
        low_stock_items = []

        for p in self.products:
            if isinstance(p, dict):
                try:
                    stock_val = int(float(str(p.get("stock", 0)).replace(",", ".")))
                    total_stock_units += stock_val
                    if stock_val <= 5:
                        low_stock_items.append(p)
                except (ValueError, TypeError):
                    pass

        total_revenue = 0.0
        for o in self.orders:
            if isinstance(o, dict):
                try:
                    price_val = float(str(o.get("total_price", 0)).replace(",", "."))
                    total_revenue += price_val
                except (ValueError, TypeError):
                    pass

        return {
            "total_products": total_products,
            "total_stock_units": total_stock_units,
            "low_stock_count": len(low_stock_items),
            "total_orders": len(self.orders),
            "total_revenue": round(total_revenue, 2),
            "low_stock_items": low_stock_items,
        }

    # ================== PRODUTOS MAIS VENDIDOS ==================
    def get_top_selling_products(self, limit: int = 5) -> list:
        sales_counter = {}
        for order in self.orders:
            if isinstance(order, dict):
                items = order.get("items", [])
                
                if isinstance(items, str):
                    try:
                        items = json.loads(items)
                    except Exception:
                        items = []
                        
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            item_name = str(item.get("name", "Desconhecido"))
                            try:
                                qty = int(float(str(item.get("quantity", 1)).replace(",", ".")))
                            except (ValueError, TypeError):
                                qty = 1
                            sales_counter[item_name] = sales_counter.get(item_name, 0) + qty

        sorted_sales = sorted(
            sales_counter.items(), key=lambda x: x[1], reverse=True
        )
        return sorted_sales[:limit]

    # ================== RELATÓRIO IA (GEMINI) ==================
    def generate_ai_report(self) -> str:
        if not self.client:
            return "Chave GEMINI_API_KEY não configurada no servidor."

        try:
            kpis = self.get_kpis()
            top_sellers = self.get_top_selling_products(3)
            top_sellers_str = (
                ", ".join([f"{name} ({qty} un.)" for name, qty in top_sellers])
                if top_sellers
                else "Nenhuma venda registada."
            )
            low_stock_names = (
                ", ".join([str(p.get("name", "Desconhecido")) for p in kpis["low_stock_items"]])
                if kpis["low_stock_items"]
                else "Nenhum produto em nível crítico."
            )

            prompt = f"""
Atue como um Analista Sénior de Inteligência de Mercado e Estoque Automotivo para a TECHTURBO.
Analise os indicadores consolidados do sistema abaixo:

📊 RESUMO DE VENDAS E ESTOQUE:
- Faturamento Total Acumulado: R$ {kpis['total_revenue']:.2f}
- Pedidos Realizados: {kpis['total_orders']} compras
- Total de Peças Físicas em Estoque: {kpis['total_stock_units']} unidades ({kpis['total_products']} modelos cadastrados)
- Peças mais Vendidas: {top_sellers_str}
- Peças com Estoque Crítico (≤ 5 un.): {low_stock_names}

Escreva uma análise sintética e executiva (máximo 3 parágrafos diretos) contendo:
1. Avaliação do desempenho de vendas e giro das peças.
2. Diagnóstico sobre a situação do estoque e itens de risco.
3. Duas recomendações prioritárias para o administrador repor o estoque ou promover produtos.
"""
            models_to_try = ["gemini-flash-lite-latest", "gemini-3.8-flash"]

            for model_name in models_to_try:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                    if response and response.text:
                        return response.text
                except Exception:
                    continue

            return (
                "O serviço de IA está a enfrentar instabilidade. "
                "As métricas financeiras continuam 100% operacionais. "
                "Clique em '🔄 Atualizar' para tentar gerar o relatório novamente."
            )
        
        except Exception as e:
            return f"As métricas foram calculadas, mas houve um erro interno na IA: {str(e)}"