// Esta é a função que vai correr no servidor da Netlify de forma segura
exports.handler = async function(event, context) {
    // Apenas permitimos pedidos do tipo POST (que é o que o nosso frontend envia)
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método Não Permitido" };
    }

    try {
        // Recebe os dados enviados pelo index.html
        const data = JSON.parse(event.body);
        const { carrinho, nome, cep, endereco, pagamento, obs } = data;

        // ==========================================
        // CONFIGURAÇÃO DO WHATSAPP DO RESTAURANTE
        // ==========================================
        const numeroWhatsApp = "5519974239183"; // <-- COLOCA O TEU NÚMERO AQUI COM DDD

        // Função segura para formatar moeda no backend (evita erros de região no servidor)
        const formataMoeda = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

        // Constrói a mensagem
        let msg = `Olá equipe *NUTRIA*! 🌱\nGostaria de fazer um pedido:\n\n*🛒 RESUMO DO PEDIDO:*\n`;
        let total = 0;

        carrinho.forEach(item => {
            msg += `▸ ${item.qtde}x ${item.nome} (${formataMoeda(item.preco * item.qtde)})\n`;
            // Se for um kit, inclui os sabores que o cliente escolheu
            if(item.tipo === 'kit') {
                msg += `   ↳ Sabores: ${item.desc}\n`;
            }
            total += item.preco * item.qtde;
        });

        msg += `\n*💰 TOTAL:* ${formataMoeda(total)}\n\n*🚚 ENTREGA:*\nNome: ${nome}\nCEP: ${cep}\nEndereço: ${endereco}\nPagamento: ${pagamento}\n`;

        if (obs && obs.trim() !== "") {
            msg += `Obs: ${obs}\n`;
        }

        if (pagamento === 'Criptomoedas') {
            msg += `\n*Aguardando confirmação e a chave da Wallet (Bitcoin/USDT) para realizar a transferência!*`;
        } else {
            msg += `\nAguardando confirmação!`;
        }

        // Gera o link final do WhatsApp
        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(msg)}`;

        // Responde ao teu site com sucesso e entrega o URL gerado
        return {
            statusCode: 200,
            body: JSON.stringify({ url: url })
        };

    } catch (error) {
        // Se algo correr mal, o site não quebra, apenas recebe este erro
        console.error("Erro no backend:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao processar o pedido no servidor.' })
        };
    }
};