(() => {
    "use strict";

    const PAGE_SIZE = 100;
    const state = { dados: [], filtrados: [], pagina: 1, carregado: false };
    const el = id => document.getElementById(id);
    const texto = value => String(value ?? "").trim();
    const chave = value => texto(value).toLocaleLowerCase("pt-BR");

    function criarTela() {
        if (el("data-extraction-modal")) return;
        const modal = document.createElement("div");
        modal.id = "data-extraction-modal";
        modal.className = "data-extraction-modal";
        modal.hidden = true;
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "data-extraction-title");
        modal.innerHTML = `
            <div class="data-extraction-shell">
                <header class="data-extraction-header">
                    <div><span class="data-extraction-kicker">CONSULTA E EXTRAÇÃO</span><h2 id="data-extraction-title">Dados dos contratos</h2><p>Consulte a base já armazenada e exporte somente o recorte desejado.</p></div>
                    <div class="data-extraction-header-actions"><button type="button" id="data-extraction-download" class="data-extraction-primary" disabled>Baixar CSV</button><button type="button" id="data-extraction-close" class="data-extraction-close" aria-label="Fechar">×</button></div>
                </header>
                <section class="data-extraction-filters" aria-label="Filtros da tabela">
                    <div><label for="data-filter-contract">Contrato</label><select id="data-filter-contract"><option value="todos">Todos os contratos</option></select></div>
                    <div><label for="data-filter-locality">Localidade</label><select id="data-filter-locality"><option value="todas">Todas as localidades</option></select></div>
                    <div><label for="data-filter-period">Competência</label><select id="data-filter-period"><option value="todas">Todas</option></select></div>
                    <div><label for="data-filter-indicator">Indicador</label><input id="data-filter-indicator" type="search" placeholder="Buscar indicador"></div>
                </section>
                <div class="data-extraction-summary"><span><strong id="data-extraction-count">0</strong> registros encontrados</span><span>O CSV respeita os filtros aplicados.</span><span id="data-extraction-status" role="status" aria-live="polite"></span></div>
                <main class="data-extraction-table-wrap">
                    <table class="data-extraction-table">
                        <thead><tr><th>Contrato</th><th>Localidade</th><th>Indicador</th><th>Competência</th><th>Tipo</th><th>Resultado</th><th>Meta</th><th>Acumulado</th></tr></thead>
                        <tbody id="data-extraction-body"></tbody>
                    </table>
                    <div id="data-extraction-empty" class="data-extraction-empty">Nenhum registro encontrado para esses filtros.</div>
                </main>
                <footer class="data-extraction-footer"><button type="button" id="data-extraction-prev">Anterior</button><span id="data-extraction-page">Página 1 de 1</span><button type="button" id="data-extraction-next">Próxima</button></footer>
            </div>`;
        document.body.appendChild(modal);
        registrarEventos();
    }

    function definirStatus(mensagem, erro = false) {
        const status = el("data-extraction-status");
        status.textContent = mensagem || "";
        status.classList.toggle("error", erro);
    }

    function competenciaOrdem(competencia) {
        const match = texto(competencia).match(/^(\d{1,2})\/(\d{4})$/);
        return match ? Number(match[2]) * 12 + Number(match[1]) : 0;
    }

    function numeroBr(value) {
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        const raw = texto(value);
        if (!raw || raw === "-") return null;
        const limpo = raw.replace(/%/g, "").replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
        const numero = Number(limpo);
        return Number.isFinite(numero) ? numero : null;
    }

    function formatarAcumulado(value, percentual) {
        if (value === null || !Number.isFinite(value)) return "";
        const casas = percentual ? 1 : Number.isInteger(value) ? 0 : 2;
        return `${value.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}${percentual ? "%" : ""}`;
    }

    async function buscarTodasPaginas(criarConsulta) {
        const todos = [];
        for (let inicio = 0; ; inicio += 1000) {
            const { data, error } = await criarConsulta().range(inicio, inicio + 999);
            if (error) throw new Error(error.message);
            todos.push(...(data || []));
            if (!data || data.length < 1000) break;
        }
        return todos;
    }

    function transformarDados(fatos) {
        const linhas = (fatos || []).map(fato => {
            const contrato = fato.clientes?.nome_cliente || "";
            const indicador = fato.indicadores?.nome_indicador || "";
            if (!contrato || !indicador) return null;
            if (window.MROGestaoConfig?.contratoArquivado(contrato) || window.MROGestaoConfig?.indicadorArquivado(contrato, indicador)) return null;
            const configuracao = window.MROGestaoConfig?.obterIndicador(contrato, indicador) || {};
            const metodo = configuracao.metodoAcumulado || (/acidente|cpt|spt/i.test(indicador) ? "soma" : "media");
            const valor = numeroBr(fato.dados_base);
            const percentual = configuracao.tipo === "percentual" ||
                (configuracao.tipo !== "numero" && (texto(fato.dados_base).includes("%") || texto(fato.meta).includes("%")));
            return {
                contrato,
                localidade: fato.localidades?.nome_localidade || "Consolidado",
                indicador,
                competencia: fato.competencia || "",
                metodo,
                tipo: metodo === "soma" ? "Soma" : "Média",
                resultado: texto(fato.dados_base),
                meta: texto(fato.meta),
                valor,
                percentual,
                acumulado: ""
            };
        }).filter(Boolean);

        const grupos = new Map();
        linhas.forEach(linha => {
            const ano = texto(linha.competencia).split("/")[1] || "";
            const id = [linha.contrato, linha.localidade, linha.indicador, ano].join("\u0000");
            if (!grupos.has(id)) grupos.set(id, []);
            grupos.get(id).push(linha);
        });
        grupos.forEach(grupo => {
            grupo.sort((a, b) => competenciaOrdem(a.competencia) - competenciaOrdem(b.competencia));
            const valores = [];
            grupo.forEach(linha => {
                if (linha.valor !== null) valores.push(linha.valor);
                const acumulado = valores.length === 0 ? null : linha.metodo === "soma"
                    ? valores.reduce((total, valor) => total + valor, 0)
                    : valores.reduce((total, valor) => total + valor, 0) / valores.length;
                linha.acumulado = formatarAcumulado(acumulado, linha.percentual);
            });
        });
        return linhas.sort((a, b) =>
            a.contrato.localeCompare(b.contrato, "pt-BR") ||
            a.localidade.localeCompare(b.localidade, "pt-BR") ||
            a.indicador.localeCompare(b.indicador, "pt-BR") ||
            competenciaOrdem(b.competencia) - competenciaOrdem(a.competencia)
        );
    }

    async function carregarDados() {
        if (!window.supabaseClientObj) throw new Error("O Supabase não está configurado nesta publicação.");
        if (window.MROGestaoConfig?.carregar) await window.MROGestaoConfig.carregar();
        const fatos = await buscarTodasPaginas(() => window.supabaseClientObj
            .from("indicadores_competencia")
            .select("id,competencia,dados_base,meta,clientes(nome_cliente),localidades(nome_localidade),indicadores(nome_indicador)")
            .order("id", { ascending: true }));
        state.dados = transformarDados(fatos);
        state.carregado = true;
        preencherFiltros();
        aplicarFiltros();
    }

    function adicionarOpcoes(select, valores, valorPadrao, textoPadrao) {
        const atual = select.value;
        select.replaceChildren();
        const padrao = document.createElement("option");
        padrao.value = valorPadrao;
        padrao.textContent = textoPadrao;
        select.appendChild(padrao);
        valores.forEach(valor => {
            const option = document.createElement("option");
            option.value = valor;
            option.textContent = valor;
            select.appendChild(option);
        });
        select.value = valores.includes(atual) ? atual : valorPadrao;
    }

    function preencherFiltros() {
        const contratos = [...new Set(state.dados.map(item => item.contrato))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        const competencias = [...new Set(state.dados.map(item => item.competencia).filter(Boolean))].sort((a, b) => competenciaOrdem(b) - competenciaOrdem(a));
        adicionarOpcoes(el("data-filter-contract"), contratos, "todos", "Todos os contratos");
        adicionarOpcoes(el("data-filter-period"), competencias, "todas", "Todas");
        atualizarFiltroLocalidade();
    }

    function atualizarFiltroLocalidade() {
        const contrato = el("data-filter-contract").value;
        const localidades = [...new Set(state.dados
            .filter(item => contrato === "todos" || item.contrato === contrato)
            .map(item => item.localidade))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        adicionarOpcoes(el("data-filter-locality"), localidades, "todas", "Todas as localidades");
    }

    function aplicarFiltros() {
        const contrato = el("data-filter-contract").value;
        const localidade = el("data-filter-locality").value;
        const competencia = el("data-filter-period").value;
        const busca = chave(el("data-filter-indicator").value);
        state.filtrados = state.dados.filter(item =>
            (contrato === "todos" || item.contrato === contrato) &&
            (localidade === "todas" || item.localidade === localidade) &&
            (competencia === "todas" || item.competencia === competencia) &&
            (!busca || chave(item.indicador).includes(busca))
        );
        state.pagina = 1;
        renderizarTabela();
    }

    function criarCelula(textoCelula, classe = "") {
        const td = document.createElement("td");
        td.textContent = textoCelula;
        if (classe) td.className = classe;
        return td;
    }

    function renderizarTabela() {
        const tbody = el("data-extraction-body");
        tbody.replaceChildren();
        const totalPaginas = Math.max(1, Math.ceil(state.filtrados.length / PAGE_SIZE));
        state.pagina = Math.min(state.pagina, totalPaginas);
        const inicio = (state.pagina - 1) * PAGE_SIZE;
        state.filtrados.slice(inicio, inicio + PAGE_SIZE).forEach(item => {
            const tr = document.createElement("tr");
            tr.append(
                criarCelula(item.contrato, "contract"), criarCelula(item.localidade), criarCelula(item.indicador),
                criarCelula(item.competencia), criarCelula(item.tipo), criarCelula(item.resultado, "number"),
                criarCelula(item.meta, "number"), criarCelula(item.acumulado, "number")
            );
            tbody.appendChild(tr);
        });
        el("data-extraction-count").textContent = state.filtrados.length.toLocaleString("pt-BR");
        el("data-extraction-empty").hidden = state.filtrados.length > 0;
        el("data-extraction-page").textContent = `Página ${state.pagina} de ${totalPaginas}`;
        el("data-extraction-prev").disabled = state.pagina <= 1;
        el("data-extraction-next").disabled = state.pagina >= totalPaginas;
        el("data-extraction-download").disabled = state.filtrados.length === 0;
        definirStatus(state.carregado ? "Base sincronizada" : "");
    }

    function protegerCsv(value) {
        let cell = texto(value);
        if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
        return `"${cell.replace(/"/g, '""')}"`;
    }

    function baixarCsv() {
        if (!state.filtrados.length) return;
        const cabecalho = ["Contrato", "Localidade", "Indicador", "Competência", "Tipo", "Resultado", "Meta", "Acumulado"];
        const linhas = state.filtrados.map(item => [item.contrato, item.localidade, item.indicador, item.competencia, item.tipo, item.resultado, item.meta, item.acumulado]);
        const csv = `\uFEFF${[cabecalho, ...linhas].map(linha => linha.map(protegerCsv).join(";")).join("\r\n")}`;
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `dados-contratos-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        definirStatus(`${state.filtrados.length.toLocaleString("pt-BR")} registros preparados no CSV`);
    }

    async function abrirTela() {
        el("data-extraction-modal").hidden = false;
        if (state.carregado) { aplicarFiltros(); return; }
        definirStatus("Carregando dados...");
        try { await carregarDados(); } catch (error) { definirStatus(`Não foi possível carregar a tabela: ${error.message}`, true); }
    }

    function registrarEventos() {
        el("data-extraction-close").addEventListener("click", () => { el("data-extraction-modal").hidden = true; });
        el("data-filter-contract").addEventListener("change", () => { atualizarFiltroLocalidade(); aplicarFiltros(); });
        el("data-filter-locality").addEventListener("change", aplicarFiltros);
        el("data-filter-period").addEventListener("change", aplicarFiltros);
        el("data-filter-indicator").addEventListener("input", aplicarFiltros);
        el("data-extraction-download").addEventListener("click", baixarCsv);
        el("data-extraction-prev").addEventListener("click", () => { state.pagina -= 1; renderizarTabela(); });
        el("data-extraction-next").addEventListener("click", () => { state.pagina += 1; renderizarTabela(); });
    }

    document.addEventListener("DOMContentLoaded", () => {
        criarTela();
        el("btn-open-data-table")?.addEventListener("click", abrirTela);
    });
})();
