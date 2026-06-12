# Plano Cloud Native: Migração para AWS (Free Tier)

Este documento detalha o plano de ação para transformar o projeto de estudos (iFood Clone) em um portfólio "Cloud Native" de alto nível, utilizando serviços gerenciados da nuvem.

## 🎯 Arquitetura de Transição

O objetivo é substituir ferramentas autogerenciadas por serviços nativos em nuvem, garantindo escalabilidade e baixo custo (utilizando o *Always Free Tier* onde possível).

*   **Frontend (Next.js):** Vercel ou Cloudflare Pages (Free Tier).
*   **Backend (Microsserviços em Go):** AWS App Runner / AWS Lambda ou GCP Cloud Run.
*   **Banco de Dados (Postgres):** Supabase ou Neon.tech (Serverless Postgres com free tier duradouro).
*   **Cache:** Upstash (Serverless Redis).
*   **Mensageria:** Substituição do RabbitMQ por **AWS SNS + AWS SQS**.

## 🔄 Mensageria: De RabbitMQ para AWS SNS/SQS

A AWS oferece um "Always Free Tier" (gratuito para sempre) extremamente generoso para SNS e SQS (1 milhão de requisições/publicações por mês). 

O mapeamento de conceitos será:
1. **RabbitMQ Exchange $\rightarrow$ AWS SNS (Topic):** Serviços produtores publicarão eventos (ex: `order.created`) em Tópicos SNS.
2. **RabbitMQ Queue $\rightarrow$ AWS SQS (Queue):** Serviços consumidores (ex: `AnalyticsService`) lerão de Filas SQS específicas.
3. **Binding:** As filas SQS serão inscritas (*subscribed*) nos Tópicos SNS, adotando o padrão "Fanout" (Pub/Sub).

## 🚀 Plano de Ação (Passo a Passo)

### Passo 1: Isolamento do Repositório
- [ ] Criar um repositório dedicado no GitHub (ex: `ifood-aws-microservices`).
- [ ] Mover o código atual (da pasta `03-ifood`) para a raiz do novo repositório.
- [ ] Criar um README.md profissional focado na arquitetura.

### Passo 2: Ambiente de Desenvolvimento Local (LocalStack)
- [ ] Substituir o container do `rabbitmq` no `docker-compose.yml` pela imagem do **LocalStack**.
- [ ] Configurar o LocalStack para emular SNS e SQS localmente (sem custos e sem depender de internet).
- [ ] Criar scripts de bootstrap para o LocalStack inicializar os tópicos e filas no ambiente de desenvolvimento.

### Passo 3: Refatoração do Código (Microsserviços em Go)
- [ ] Instalar o AWS SDK for Go V2 (`github.com/aws/aws-sdk-go-v2`).
- [ ] Refatorar a camada de infraestrutura (Mensageria) para substituir a implementação do RabbitMQ pelo cliente da AWS (SNS/SQS).
- [ ] Atualizar o bootstrap dos serviços (`internal/app`) mantendo as regras da *Clean Architecture*.

### Passo 4: Infraestrutura como Código e CI/CD
- [ ] Criar workflows no GitHub Actions (Build, Test, Lint).
- [ ] *(Opcional)* Adicionar uma pasta `terraform/` com scripts para provisionar os recursos na AWS real (IaC - Infraestrutura como Código).

---

> [!TIP]
> Manteremos a execução via `docker-compose` localmente para facilitar o desenvolvimento diário, mas a aplicação estará pronta e arquitetada para um ambiente 100% nuvem (12-Factor App).
