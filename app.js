// Cole aqui os dados do seu projeto Supabase (Settings > API).
const SUPABASE_URL = "https://ziqsonhepjunwkctppud.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NCErdcX0wg-6rL_QbVs6IA_x2iIwmZm";

const configurado = !SUPABASE_URL.startsWith("COLE_AQUI") &&
    !SUPABASE_ANON_KEY.startsWith("COLE_AQUI");
const supabaseClient = configurado
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const cards = [...document.querySelectorAll(".presente")];

cards.forEach((card) => {
    const numero = card.querySelector(".numero").textContent.trim();
    card.dataset.presenteId = `presente-${numero}`;

    const botaoPresentear = document.createElement("button");
    botaoPresentear.type = "button";
    botaoPresentear.className = "botao botao-presentear";
    botaoPresentear.textContent = "Presentear";
    botaoPresentear.addEventListener("click", () => confirmarPresente(card));

    card.querySelector(".conteudo").append(botaoPresentear);
});

function marcarComoPresenteado(card) {
    const botaoVer = card.querySelector(".botao:not(.botao-presentear)");
    const botaoPresentear = card.querySelector(".botao-presentear");

    card.classList.add("presenteado");
    botaoVer.setAttribute("aria-disabled", "true");
    botaoVer.tabIndex = -1;
    botaoPresentear.disabled = true;
    botaoPresentear.textContent = "Já presenteado";
}

async function carregarPresentesReservados() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
        .from("reservas_presentes")
        .select("presente_id");

    if (error) {
        console.error("Não foi possível consultar as reservas:", error.message);
        return;
    }

    const reservados = new Set(data.map((reserva) => reserva.presente_id));
    cards
        .filter((card) => reservados.has(card.dataset.presenteId))
        .forEach(marcarComoPresenteado);
}

async function confirmarPresente(card) {
    if (!supabaseClient) {
        alert("A reserva ainda não foi configurada. Adicione a URL e a chave pública do Supabase no arquivo app.js.");
        return;
    }

    const nome = card.querySelector("h3").textContent.trim();
    const confirmou = window.confirm(`Deseja confirmar o presente: ${nome}? Esta ação não poderá ser desfeita pela lista.`);
    if (!confirmou) return;

    const botaoPresentear = card.querySelector(".botao-presentear");
    botaoPresentear.disabled = true;
    botaoPresentear.textContent = "Confirmando...";

    const { data: reservado, error } = await supabaseClient.rpc("reservar_presente", {
        p_presente_id: card.dataset.presenteId
    });

    if (error) {
        console.error("Não foi possível reservar o presente:", error.message);
        botaoPresentear.disabled = false;
        botaoPresentear.textContent = "Presentear";
        alert("Não foi possível confirmar agora. Tente novamente em alguns instantes.");
        return;
    }

    if (!reservado) {
        marcarComoPresenteado(card);
        alert("Este presente acabou de ser escolhido por outra pessoa.");
        return;
    }

    marcarComoPresenteado(card);
    alert("Presente confirmado! Muito obrigado pelo carinho.");
}

carregarPresentesReservados();
