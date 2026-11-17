// Cliente Global do Supabase
window.supabaseClientObj = null;

window.formatarErroSupabase = function(error, etapa = "operação") {
    const mensagem = String(error?.message || error || "Erro desconhecido");
    const detalhes = [error?.details, error?.hint].filter(Boolean).join(" ");
    const textoCompleto = `${mensagem} ${detalhes}`.trim();
    const falhaDeRede = /failed to fetch|network\s*error|load failed|name not resolved|err_name_not_resolved/i.test(textoCompleto);

    if (falhaDeRede) {
        let host = "o projeto Supabase configurado";
        try {
            host = new URL(window.ENV?.SUPABASE_URL).host || host;
        } catch (_) {}

        return new Error(
            `Não foi possível acessar ${host} durante ${etapa}. ` +
            "A URL configurada pode estar incorreta, o projeto pode estar pausado/excluído ou a rede pode estar bloqueando o acesso. " +
            "Verifique SUPABASE_URL e SUPABASE_ANON_KEY em env.js e confirme que o projeto está ativo."
        );
    }

    const codigo = error?.code ? ` [${error.code}]` : "";
    return new Error(`Falha no Supabase durante ${etapa}${codigo}: ${textoCompleto}`);
};

if (window.ENV && window.ENV.SUPABASE_URL && window.ENV.SUPABASE_ANON_KEY && !window.ENV.SUPABASE_URL.includes("COLE_SUA_URL_AQUI")) {
    try {
        const supabaseUrl = new URL(window.ENV.SUPABASE_URL);
        if (supabaseUrl.protocol !== "https:") throw new Error("SUPABASE_URL deve usar HTTPS.");
        window.supabaseClientObj = window.supabase.createClient(supabaseUrl.href.replace(/\/$/, ""), window.ENV.SUPABASE_ANON_KEY);
        console.log("Supabase Client Initialized.");
    } catch (error) {
        window.supabaseClientObj = null;
        console.error("Configuração inválida do Supabase:", error);
    }
} else {
    console.warn("ATENÇÃO: Configuração do Supabase ausente. O sistema funcionará com os dados de demonstração locais até as chaves serem configuradas em env.js.");
}
