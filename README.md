# TECHTURBO — Sistema Inteligente de Gestão de Estoque e Vendas Automotivas

> **Aplicação Mobile em React Native & FastAPI (BFF)** voltada para controle de estoque em tempo real, gestão de acessos e geração de relatórios executivos com Inteligência Artificial (Google Gemini).

---

## 📌 Proposta do Projeto & Solução de Negócio

### 1. Problema de Negócio
Empresas do setor de autopeças sofrem com a falta de visibilidade de estoque, ocorrência de rupturas (peças zeradas sem aviso prévio) e lentidão na análise de vendas para tomada de decisão estratégica.

### 2. Público-Alvo
* **Administradores / Vendedores:** Gerenciam o catálogo (CRUD completo), monitoram níveis de estoque e analisam relatórios analíticos de vendas.
* **Clientes Autenticados:** Consultam o catálogo, adicionam itens ao carrinho e finalizam compras com atualização de estoque.
* **Visitantes:** Navegam pelo catálogo em modo de leitura simples.

### 3. Benefícios
* **Prevenção de Ruptura:** Alertas visuais automáticos para itens com nível crítico de estoque ($\le 5$ unidades).
* **Inteligência Preditiva:** Diagnósticos executivos gerados em tempo real pela IA Gemini com base nos KPIs de faturamento.
* **Segurança Integrada:** Arquitetura BFF (Backend for Frontend) que isola totalmente a base de dados do aplicativo mobile.

---

## 🏗️ Arquitetura da Solução (BFF Pattern)

A aplicação consome exclusivamente uma API de intermediação desenvolvida em **FastAPI (Python)**. O aplicativo mobile **não possui conexão direta com o banco de dados**, garantindo segurança e centralização das regras de negócio.

```
┌─────────────────────────┐
│  Mobile (React Native)  │
└────────────┬────────────┘
             │ HTTP (Axios)
             ▼
┌─────────────────────────┐
│     BFF (FastAPI)       │ ◄── Regras de Negócio & KPIs (engine.py)
└──────┬────────────┬─────┘
       │            │
       ▼            ▼
┌───────────┐  ┌──────────────────┐
│  MockAPI  │  │ Google Gemini IA │
│ (Database)│  │   (LLM Service)  │
└───────────┘  └──────────────────┘
```

---

## 🗄️ Estrutura de Recursos no MockAPI

Para homologar a aplicação, é necessário configurar **2 Recursos (Resources)** no painel do MockAPI. A tabela abaixo especifica a estrutura exata de campos, tipos de dados e a quantidade recomendada para testes:

| Recurso | Campo (Property) | Tipo de Dado (Data Type) | Descrição / Regra de Negócio | Registros Recomendados |
| :--- | :--- | :--- | :--- | :---: |
| **`products`** | `id` | `String` (Auto) | Identificador único do produto | **6 a 8 itens** |
| | `name` | `String` | Nome/descrição da peça | |
| | `price` | `String` | Preço unitário (ex: `"120.00"`) | |
| | `stock` | `String` | Quantidade disponível (ex: `"3"`) | |
| | `category` | `String` | Categoria (ex: `"Freios"`, `"Elétrica"`) | |
| **`users`** | `id` | `String` (Auto) | Identificador único do usuário | **2 a 3 contas** |
| | `name` | `String` | Nome completo | |
| | `email` | `String` | E-mail para autenticação | |
| | `password` | `String` | Senha de acesso | |
| | `cpf` | `String` | Documento CPF | |
| | `address` | `String` | Endereço completo de entrega | |
| | `role` | `String` | Nível de acesso (`"admin"` ou `"user"`) | |
| | `orders` | `Array` | Histórico de compras finalizadas | |

---

## 📋 Matriz de Requisitos

| Requisito Solicitado | Status | Implementação Técnica |
| :--- | :---: | :--- |
| **Autenticação de Usuários** | ✅ | Login e cadastro gerenciados pelo BFF; permissões para Admin, Cliente e Visitante. |
| **Dashboard Analítico** | ✅ | Cálculo de KPIs no backend e relatório executivo via Google Gemini IA. |
| **CRUD de Informações** | ✅ | **C**reate (Modal Admin), **R**ead (Busca/Filtro), **U**pdate (Modal Inspeção), **D**elete (Card). |
| **Integração com APIs** | ✅ | Consumo de serviço de persistência (**MockAPI**) e IA Gerativa (**Google Gemini API**). |
| **Arquitetura BFF** | ✅ | Camada FastAPI (`main.py`) encapsulando regras de negócio e protegendo o banco. |
| **Validação e Tratamento** | ✅ | Schemas Pydantic no backend e alertas nativos amigáveis no aplicativo mobile. |

---

## ⚡ Como Executar a Aplicação

### 1. Configurar o Backend (BFF)
1. Acesse o diretório `backend`.
2. Crie um ambiente virtual: `python -m venv .venv`
3. Ative o ambiente virtual:
   * **Windows:** `.venv\Scripts\activate`
   * **Linux/Mac:** `source .venv/bin/activate`
4. Instale as dependências: `pip install fastapi uvicorn httpx python-dotenv google-genai pydantic`
5. Crie um arquivo `.env` baseado no `.env.example`:
   ```env
   MOCKAPI_URL=https://SUA_INSTANCIA.mockapi.io/
   GEMINI_API_KEY=SUA_CHAVE_GEMINI
   ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081
   ```
6. Inicie o servidor: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### 2. Configurar o Frontend (Mobile)
1. Acesse o diretório `mobile`.
2. Instale os pacotes: `npm install`
3. Inicie o Expo: `npx expo start`
4. Escaneie o QR Code exibido através do aplicativo **Expo Go**.

---

## 🔐 Segurança e Boas Práticas

* **Proteção de Segredos:** Variáveis de ambiente sensíveis (`MOCKAPI_URL` e `GEMINI_API_KEY`) permanecem estritamente no servidor BFF e ignoradas pelo Git.
* **Isolamento de Dados:** A aplicação mobile realiza chamadas exclusivamente para o BFF, impedindo a exposição de rotas diretas do banco de dados.
* **Validação Rígida:** Requisições são validadas via schemas Pydantic no servidor antes de permitirem operações de escrita ou leitura na base.