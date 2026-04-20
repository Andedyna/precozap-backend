// ─── Provider Interface ───────────────────────────────────────────────────────

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIQueryInput {
  message: string;
  conversationHistory?: AIMessage[];
  context?: Record<string, unknown>;
}

export interface AIQueryOutput {
  message: string;
  productIds?: string[];
  tips?: string[];
  intent?: string;
  budget?: number | null;
  provider: string;
}

export interface AIProvider {
  query(input: AIQueryInput): Promise<AIQueryOutput>;
  isAvailable(): boolean;
}

// ─── Mock Provider ────────────────────────────────────────────────────────────

const MOCK_RESPONSES: Record<string, Omit<AIQueryOutput, "provider">> = {
  iphone: {
    message:
      "O **iPhone 15 Pro** está com o melhor preço no Mercado Livre agora: **R$ 6.799** com 24% de desconto! É R$ 450 mais barato que a Amazon e inclui frete grátis.\n\n📊 **Análise de preço:** O preço histórico mais baixo foi R$ 6.200 — pode valer esperar a Black Friday caso não seja urgente.",
    productIds: ["1"],
    tips: [
      "Preço histórico mínimo: R$ 6.200 — possível desconto em novembro",
      "Cuidado com vendedores desconhecidos oferecendo abaixo de R$ 6.000",
      "Prefira comprar com vendedor com reputação acima de 4.5",
    ],
    intent: "iphone",
  },
  celular: {
    message:
      "Para custo-benefício, o **Xiaomi Redmi Note 13 Pro** está com 35% de desconto na Shopee — excelente câmera de 200MP por apenas R$ 1.299! Se tiver mais orçamento, o **Samsung Galaxy S24 Ultra** está R$ 1.500 mais barato que o normal na Amazon.",
    productIds: ["8", "2"],
    tips: [
      "Confira se o vendedor tem reputação acima de 4.5",
      "Modelos com até 3 meses de lançamento costumam ter melhores promoções",
      "Compare o custo por GB de armazenamento para melhor decisão",
    ],
    intent: "celular",
  },
  notebook: {
    message:
      "Para notebooks, temos ótimas opções! O **MacBook Air M3** é imbatível em desempenho e está 14% off na Amazon (R$ 9.499). Para Windows, o **Dell Inspiron i7** está 26% off no Mercado Livre por R$ 3.299 — excelente custo-benefício para trabalho.",
    productIds: ["3", "7"],
    tips: [
      "Prefira 16GB de RAM ou mais para durabilidade a longo prazo",
      "SSD NVMe é muito mais rápido que HDD — sempre priorize",
      "MacOS tem menor consumo de bateria e maior vida útil do hardware",
    ],
    intent: "notebook",
  },
  ps5: {
    message:
      "O **PS5 Slim Digital** está com desconto incrível de 32% na Shopee: apenas **R$ 2.699**! Economize R$ 1.300 em relação ao preço original. Atenção: estoque costuma acabar rápido nesta faixa.",
    productIds: ["4"],
    tips: [
      "O bundle com jogos na Amazon pode sair mais em conta no total",
      "Verifique se o vendedor oferece nota fiscal e garantia",
      "A versão digital exige internet — planeje seu plano de dados",
    ],
    intent: "ps5",
  },
  tv: {
    message:
      "A **Samsung 55\" QLED 4K** está com 27% de desconto na Magazine Luiza por R$ 2.899! Tecnologia Quantum Dot com 144Hz é excelente para jogos e streaming. Economia de R$ 1.100 em relação ao preço cheio.",
    productIds: ["5"],
    tips: [
      "TVs QLED têm cores mais vibrantes que LED comum",
      "144Hz é ideal se você vai conectar um console ou PC",
      "Verifique se inclui suporte de parede — muitos não incluem",
    ],
    intent: "tv",
  },
  fone: {
    message:
      "O **Sony WH-1000XM5** é o melhor cancelamento de ruído do mercado e está 31% off na Amazon por R$ 1.499! Perfeito para home office ou viagens. Economize R$ 700 no modelo top de linha.",
    productIds: ["6"],
    tips: [
      "Sony domina o cancelamento de ruído — melhor que Bose nesta faixa",
      "30h de bateria é suficiente para voos internacionais",
      "Conecta em 2 dispositivos simultaneamente (multipoint)",
    ],
    intent: "fone",
  },
};

export class MockAIProvider implements AIProvider {
  isAvailable(): boolean {
    return true;
  }

  async query(input: AIQueryInput): Promise<AIQueryOutput> {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const intent = this.detectIntent(input.message);
    const budget = this.extractBudget(input.message);

    const mockResponse = MOCK_RESPONSES[intent];

    if (mockResponse) {
      let message = mockResponse.message;
      if (budget) {
        message += `\n\n💰 **Com seu orçamento de R$ ${budget.toLocaleString("pt-BR")}:** Encontrei opções dentro do seu budget. Veja os produtos destacados abaixo!`;
      }
      return { ...mockResponse, message, budget, provider: "mock" };
    }

    return {
      message:
        "Posso te ajudar a encontrar o melhor preço! Experimente perguntar:\n\n• **\"Melhor celular até R$ 2.000\"**\n• **\"iPhone mais barato agora\"**\n• **\"Notebook para trabalho\"**\n• **\"PS5 em promoção\"**\n• **\"Fone com cancelamento de ruído\"**",
      tips: [
        "Use filtros de categoria para busca mais precisa",
        "Adicione produtos aos favoritos para monitorar preços",
      ],
      intent: "general",
      budget,
      provider: "mock",
    };
  }

  private detectIntent(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes("iphone") || msg.includes("apple")) return "iphone";
    if (msg.includes("celular") || msg.includes("smartphone") || msg.includes("galaxy") || msg.includes("samsung") || msg.includes("xiaomi")) return "celular";
    if (msg.includes("notebook") || msg.includes("laptop") || msg.includes("computador") || msg.includes("pc") || msg.includes("macbook")) return "notebook";
    if (msg.includes("ps5") || msg.includes("playstation") || msg.includes("console") || msg.includes("game")) return "ps5";
    if (msg.includes("tv") || msg.includes("televisao") || msg.includes("televisão") || msg.includes("smart tv")) return "tv";
    if (msg.includes("fone") || msg.includes("headphone") || msg.includes("audio") || msg.includes("áudio") || msg.includes("sony")) return "fone";
    return "general";
  }

  private extractBudget(message: string): number | null {
    const match = message.match(/r\$\s*([\d.,]+)|([\d.]+)\s*mil|até\s+([\d.]+)/i);
    if (!match) return null;
    const raw = (match[1] || match[2] || match[3]).replace(/\./g, "").replace(",", ".");
    const val = parseFloat(raw);
    if (match[2]) return val * 1000;
    return isNaN(val) ? null : val;
  }
}

// ─── Anthropic Provider ───────────────────────────────────────────────────────

export class AnthropicAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async query(input: AIQueryInput): Promise<AIQueryOutput> {
    const systemPrompt = `Você é um assistente especialista em comparação de preços do PreçoZap, uma plataforma brasileira.
Seu papel é ajudar usuários a encontrar os melhores preços nos marketplaces: Mercado Livre, Amazon, Shopee, Magazine Luiza e Americanas.

Contexto atual dos produtos disponíveis:
${JSON.stringify(input.context?.products || [], null, 2)}

Responda SEMPRE em português brasileiro, de forma concisa e útil.
Use markdown para formatação (negrito, listas).
Destaque SEMPRE o melhor preço encontrado.
Forneça dicas práticas de compra.

Responda APENAS com JSON neste formato:
{
  "message": "sua resposta em markdown",
  "productIds": ["id1", "id2"],
  "tips": ["dica1", "dica2"],
  "intent": "categoria detectada"
}`;

    const messages = [
      ...(input.conversationHistory || []),
      { role: "user" as const, content: input.message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json() as { content: Array<{ text: string }> };
    const text = data.content[0]?.text || "{}";

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      return {
        message: parsed.message || "Não consegui processar sua solicitação.",
        productIds: parsed.productIds || [],
        tips: parsed.tips || [],
        intent: parsed.intent || "general",
        budget: null,
        provider: "anthropic",
      };
    } catch {
      return {
        message: text,
        productIds: [],
        tips: [],
        provider: "anthropic",
      };
    }
  }
}
