# Guia de Testes de Pagamento (Ambiente Seguro)

Este projeto está configurado por padrão para usar o **ASAAS SANDBOX** (Ambiente de Testes). Isso significa que nenhuma cobrança real será feita em seu cartão de crédito e nenhum dinheiro real será movimentado.

## Como verificar se estou no Sandbox?

O sistema verifica a variável de ambiente `ASAAS_API_URL`. Se ela não estiver definida no seu servidor de produção, o sistema usa automaticamente:
`https://api-sandbox.asaas.com/v3`

## Dados Fictícios para Teste

Para realizar assinaturas e simular pagamentos aprovados, use os seguintes dados fictícios durante o checkout:

### 💳 Cartão de Crédito (Teste)
- **Número:** `4444 4444 4444 4444` (Mastercard) ou `4111 1111 1111 1111` (Visa)
- **Nome:** `TESTE APROVADO`
- **Validade:** Qualquer data futura (ex: `12/30`)
- **CCV:** `123`

### 👤 Dados do Titular
- **Nome:** Seu Nome de Teste
- **CPF:** Use um gerador de CPF online (o Sandbox valida o algoritmo do CPF, mas não checa na Receita).
- **Email:** `seu-email+teste@gmail.com`
- **Endereço:** Pode usar dados reais ou fictícios, desde que o CEP seja válido.

## Fluxo de Teste Recomendado

1. Acesse o Painel da Loja.
2. Vá em **Planos**.
3. Escolha um plano e clique em **Assinar**.
4. Selecione **Cartão de Crédito**.
5. Preencha com os dados acima.
6. Ao clicar em assinar, o sistema irá processar como se fosse real, mas tudo ocorrerá no ambiente de teste do Asaas.
7. A assinatura ficará ativa imediatamente.

## ⚠️ Atenção
Se você estiver implantando isso **em Produção** (para vender de verdade), você precisará alterar a variável `ASAAS_API_KEY` para sua chave de produção e configurar a URL para `https://www.asaas.com/api/v3`. Se não fez isso ainda, você está seguro no modo de teste.
