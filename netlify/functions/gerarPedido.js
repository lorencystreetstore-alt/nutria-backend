// Caminho do arquivo: netlify/functions/gerarPedido.js
// Este código roda no servidor do Netlify. Invasores não têm acesso a este arquivo pelo navegador (F12).

exports.handler = async (event, context) => {
    // Apenas aceitar requisições do tipo POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Recebe os dados do front-end (Apenas ID e Quantidade)
        const data = JSON.parse(event.body);
        const { carrinho, nome, endereco, pagamento, obs } = data;

        // ========================================================
        // A FONTE DA VERDADE (CATÁLOGO SEGURO)
        // Aqui ficam os preços verdadeiros. Se um invasor mudar 
        // o preço no HTML via F12, este servidor irá ignorar e 
        // cobrar o preço cadastrado aqui embaixo.
        // ========================================================
        const catalogoOficial = {
            'nov-1': { nome: 'Strogonoff de Frango com Creme de Mandioquinha', preco: 18.90 },
            'nov-2': { nome: 'Escondidinho de Carne Moída', preco: 18.90 },
            'est-1': { nome: 'Karê de Frango com Arroz Japonês', preco: 25.90 },
            'est-2': { nome: 'Tilápia Grelhada com Mix de Legumes', preco: 29.90 }
        };

        // Formatação de moeda para o texto do WhatsApp
        const formatarReal = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

        let totalSeguro = 0;
        let mensagem = `Olá equipe *NUTRIA*! 🌱\nGostaria de fazer um pedido:\n\n*RESUMO DO PEDIDO:*\n`;

        // O servidor calcula o total item a item
        for (const [id, quantidade] of Object.entries(carrinho)) {
            const produto = catalogoOficial[id];
            
            // Se o ID enviado não existe no catálogo oficial, é ignorado (evita ataques)
            if (produto) {
                const subtotal = produto.preco * quantidade;
                totalSeguro += subtotal;
                mensagem += `▸ ${quantidade}x ${produto.nome} (${formatarReal(subtotal)})\n`;
            }
        }

        // Validação contra carrinho forjado zerado
        if (totalSeguro === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Carrinho inválido." }) };
        }

        mensagem += `\n*VALOR TOTAL:* ${formatarReal(totalSeguro)}\n\n`;
        mensagem += `*DADOS DE ENTREGA:*\n`;
        mensagem += `Nome: ${nome}\nEndereço: ${endereco}\nForma de Pagamento: ${pagamento}\n`;
        
        if (obs && obs.trim() !== '') {
            mensagem += `Observações: ${obs}\n`;
        }
        mensagem += `\nAguardando confirmação! Obrigado!`;

        // Pega o número de WhatsApp oculto nas Variáveis de Ambiente do Netlify.
        // Se não existir, usa o padrão. Ninguém que aperta F12 consegue ler o process.env.
        const numeroWhatsApp = process.env.WHATSAPP_NUMERO || "5519974239183";
        
        // Gera a URL final blindada
        const urlSegura = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

        // Retorna a URL para o Front-end redirecionar o cliente
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: urlSegura })
        };

    } catch (error) {
        console.error("Erro na Serverless Function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Erro interno do servidor." }) };
    }
};