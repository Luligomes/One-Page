(() => {
    "use strict";

    const CONFIG_CONTRATO = "__MRO_CONFIG_GESTAO__";
    const CONFIG_NOME = "cadastro-manual-v1";
    const ACIDENTE_RE = /(^|\b)(cpt|spt)(\b|$)/i;
    let config = { contratos: {} };
    let contratoSelecionado = "";
    let dadosContrato = null;

    const normalizar = value => String(value || "").trim();
    const chave = value => normalizar(value).toLocaleLowerCase("pt-BR");
    const eAcidente = nome => ACIDENTE_RE.test(normalizar(nome));
    const appState = () => (typeof AppState !== "undefined" ? AppState : null);
    const supabase = () => window.supabaseClientObj;
    const el = id => document.getElementById(id);

    function contratoConfig(nome, criar = false) {
        const id = chave(nome);
        if (criar && !config.contratos[id]) {
            config.contratos[id] = { nome: normalizar(nome), arquivado: false, indicadores: {} };
        }
        return config.contratos[id] || null;
    }

    function indicadorConfig(contrato, indicador, criar = false) {
        const cc = contratoConfig(contrato, criar);
        if (!cc) return null;
        const id = chave(indicador);
        if (criar && !cc.indicadores[id]) {
            cc.indicadores[id] = {
                nome: normalizar(indicador),
                arquivado: false,
                metodoAcumulado: eAcidente(indicador) ? "soma" : "media",
                tipo: eAcidente(indicador) ? "numero" : "auto"
            };
        }
        const item = cc.indicadores[id] || null;
        if (item && eAcidente(indicador)) {
            item.metodoAcumulado = "soma";
            item.tipo = "numero";
            item.arquivado = false;
        }
        return item;
    }

    async function carregarConfig(force = false) {
        if (window.MROGestaoConfig?.carregado && !force) return config;
        if (!supabase()) return config;
        const { data, error } = await supabase()
            .from("versoes_contrato")
            .select("dados")
            .eq("contrato", CONFIG_CONTRATO)
            .eq("nome", CONFIG_NOME)
            .order("created_at", { ascending: false })
            .limit(1);
        if (error) throw new Error(`Não foi possível carregar a configuração: ${error.message}`);
        if (data?.[0]?.dados?.contratos) config = data[0].dados;
        window.MROGestaoConfig.carregado = true;
        return config;
    }

    async function salvarConfig() {
        const { error } = await supabase().from("versoes_contrato").insert({
            contrato: CONFIG_CONTRATO,
            nome: CONFIG_NOME,
            periodo: new Date().toISOString(),
            dados: config
        });
        if (error) throw new Error(`Não foi possível salvar a configuração: ${error.message}`);
        window.MROGestaoConfig.carregado = true;
    }

    window.MROGestaoConfig = {
        carregado: false,
        carregar: carregarConfig,
        contratoArquivado: nome => Boolean(contratoConfig(nome)?.arquivado),
        indicadorArquivado: (contrato, indicador) => Boolean(indicadorConfig(contrato, indicador)?.arquivado),
        obterIndicador: (contrato, indicador) => {
            const item = indicadorConfig(contrato, indicador);
            return item || {
                nome: normalizar(indicador),
                arquivado: false,
                metodoAcumulado: eAcidente(indicador) ? "soma" : "media",
                tipo: eAcidente(indicador) ? "numero" : "auto"
            };
        }
    };

    function criarTela() {
        if (el("management-modal")) return;
        const modal = document.createElement("div");
        modal.id = "management-modal";
        modal.className = "management-modal";
        modal.hidden = true;
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "management-title");
        modal.innerHTML = `
            <div class="management-shell">
                <header class="management-header">
                    <div><span class="management-kicker">CADASTRO</span><h2 id="management-title">Gerenciar contratos e indicadores</h2><p>As alterações refletem no One Page e nos gráficos.</p></div>
                    <button type="button" class="management-close" id="management-close" aria-label="Fechar">×</button>
                </header>
                <div class="management-body">
                    <aside class="management-sidebar">
                        <button type="button" class="management-primary" id="management-new-contract">+ Novo contrato</button>
                        <label for="management-search">Buscar contrato</label>
                        <input id="management-search" type="search" placeholder="Digite o nome">
                        <div id="management-contracts" class="management-contracts"></div>
                    </aside>
                    <main class="management-content">
                        <div id="management-empty" class="management-empty">Selecione um contrato para gerenciar seus indicadores.</div>
                        <section id="management-detail" hidden>
                            <div class="management-toolbar">
                                <div><span class="management-kicker">CONTRATO</span><h3 id="management-contract-title"></h3></div>
                                <div class="management-actions"><button type="button" id="management-edit-contract">Editar</button><button type="button" class="danger" id="management-archive-contract">Arquivar</button><button type="button" class="management-primary" id="management-new-indicator">+ Novo indicador</button></div>
                            </div>
                            <div class="management-note"><strong>Regra do acumulado:</strong> escolha média para taxas/percentuais e soma para valores que devem ser totalizados. CPT e SPT ficam fixos como soma.</div>
                            <div class="management-table-wrap"><table class="management-table"><thead><tr><th>Indicador</th><th>Tipo</th><th>Acumulado</th><th>Status</th><th>Ações</th></tr></thead><tbody id="management-indicators"></tbody></table></div>
                        </section>
                    </main>
                </div>
                <footer class="management-footer"><span id="management-status" role="status" aria-live="polite"></span><button type="button" id="management-cancel">Fechar</button><button type="button" class="management-primary" id="management-save">Salvar alterações</button></footer>
            </div>`;
        document.body.appendChild(modal);
        criarFormulario();
        registrarEventos();
    }

    function criarFormulario() {
        const overlay = document.createElement("div");
        overlay.id = "management-form-overlay";
        overlay.className = "management-form-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `<form id="management-form" class="management-form">
            <div class="management-form-head"><div><span class="management-kicker" id="management-form-kicker"></span><h3 id="management-form-title"></h3></div><button type="button" id="management-form-close" aria-label="Fechar">×</button></div>
            <input type="hidden" id="management-form-kind"><input type="hidden" id="management-form-original">
            <label for="management-form-name">Nome</label><input id="management-form-name" required maxlength="160">
            <div id="management-indicator-fields">
                <div class="management-grid"><div><label for="management-form-pillar">Pilar</label><input id="management-form-pillar" value="Manual"></div><div><label for="management-form-group">Grupo</label><input id="management-form-group" value="Manual"></div></div>
                <div class="management-grid"><div><label for="management-form-type">Tipo</label><select id="management-form-type"><option value="percentual">Percentual</option><option value="numero">Número</option></select></div><div><label for="management-form-method">Cálculo do acumulado</label><select id="management-form-method"><option value="media">Média</option><option value="soma">Soma</option></select></div></div>
                <div class="management-grid"><div><label for="management-form-meta">Meta inicial</label><input id="management-form-meta" placeholder="Ex.: 97% ou 0"></div><div><label for="management-form-locality">Localidade</label><select id="management-form-locality" required></select><div id="management-new-locality-wrap" class="management-new-locality" hidden><label for="management-form-new-locality">Nome da nova localidade</label><input id="management-form-new-locality" maxlength="160" placeholder="Digite a nova localidade"></div></div></div>
                <label for="management-form-formula">Fórmula / observação</label><input id="management-form-formula" placeholder="Descreva como o indicador é calculado">
            </div>
            <p id="management-form-hint"></p><div class="management-form-actions"><button type="button" id="management-form-cancel">Cancelar</button><button class="management-primary" type="submit">Confirmar</button></div>
        </form>`;
        el("management-modal").appendChild(overlay);
    }

    function status(texto, erro = false) {
        const node = el("management-status");
        node.textContent = texto || "";
        node.classList.toggle("error", erro);
    }

    async function listarContratos() {
        const { data, error } = await supabase().from("clientes").select("id,nome_cliente").order("nome_cliente");
        if (error) throw new Error(error.message);
        return data || [];
    }

    async function renderContratos() {
        const contratos = await listarContratos();
        const filtro = chave(el("management-search").value);
        const container = el("management-contracts");
        container.replaceChildren();
        contratos.filter(c => !filtro || chave(c.nome_cliente).includes(filtro)).forEach(c => {
            const cc = contratoConfig(c.nome_cliente);
            const button = document.createElement("button");
            button.type = "button";
            button.className = `management-contract ${c.nome_cliente === contratoSelecionado ? "active" : ""} ${cc?.arquivado ? "archived" : ""}`;
            const name = document.createElement("span");
            name.textContent = c.nome_cliente;
            const tag = document.createElement("small");
            tag.textContent = cc?.arquivado ? "Arquivado" : "Ativo";
            button.append(name, tag);
            button.addEventListener("click", () => selecionarContrato(c));
            container.appendChild(button);
        });
    }

    async function selecionarContrato(contrato) {
        contratoSelecionado = contrato.nome_cliente;
        status("Carregando indicadores...");
        const fatos = [];
        for (let inicio = 0; ; inicio += 1000) {
            const { data, error } = await supabase().from("indicadores_competencia")
                .select("indicador_id,localidade_id,meta,formula_calculo,indicadores(id,nome_indicador,grupos(nome_grupo,pilares(nome_pilar))),localidades(id,nome_localidade)")
                .eq("cliente_id", contrato.id).order("id").range(inicio, inicio + 999);
            if (error) throw new Error(error.message);
            fatos.push(...(data || []));
            if (!data || data.length < 1000) break;
        }
        const { data: localidades, error: localidadesError } = await supabase().from("localidades")
            .select("id,nome_localidade").eq("cliente_id", contrato.id).order("nome_localidade");
        if (localidadesError) throw new Error(localidadesError.message);

        const unicos = new Map();
        fatos.forEach(f => {
            const ind = f.indicadores;
            if (!ind?.nome_indicador) return;
            if (!unicos.has(ind.id)) {
                unicos.set(ind.id, { ...ind, meta: f.meta, formula: f.formula_calculo, localidadeIds: [], localidades: [] });
            }
            const cadastrado = unicos.get(ind.id);
            if (f.localidade_id && !cadastrado.localidadeIds.includes(f.localidade_id)) cadastrado.localidadeIds.push(f.localidade_id);
            const nomeLocalidade = f.localidades?.nome_localidade;
            if (nomeLocalidade && !cadastrado.localidades.includes(nomeLocalidade)) cadastrado.localidades.push(nomeLocalidade);
        });
        dadosContrato = { ...contrato, localidades: localidades || [], indicadores: [...unicos.values()] };
        el("management-empty").hidden = true;
        el("management-detail").hidden = false;
        el("management-contract-title").textContent = contrato.nome_cliente;
        renderIndicadores();
        await renderContratos();
        status("");
    }

    function renderIndicadores() {
        const tbody = el("management-indicators");
        tbody.replaceChildren();
        const ordenados = [...(dadosContrato?.indicadores || [])].sort((a, b) => {
            const pa = /cpt/i.test(a.nome_indicador) ? 0 : /spt/i.test(a.nome_indicador) ? 1 : 2;
            const pb = /cpt/i.test(b.nome_indicador) ? 0 : /spt/i.test(b.nome_indicador) ? 1 : 2;
            return pa - pb || a.nome_indicador.localeCompare(b.nome_indicador, "pt-BR");
        });
        ordenados.forEach(ind => {
            const cfg = indicadorConfig(contratoSelecionado, ind.nome_indicador, true);
            const acidente = eAcidente(ind.nome_indicador);
            const tr = document.createElement("tr");
            if (cfg.arquivado) tr.classList.add("archived");
            const nome = document.createElement("td");
            nome.innerHTML = `<strong></strong><small></small>`;
            nome.querySelector("strong").textContent = ind.nome_indicador;
            nome.querySelector("small").textContent = [ind.grupos?.pilares?.nome_pilar, ind.grupos?.nome_grupo].filter(Boolean).join(" • ") || "Sem classificação";
            const tipo = document.createElement("td");
            const tipoSelect = document.createElement("select");
            tipoSelect.innerHTML = '<option value="auto">Automático</option><option value="percentual">Percentual</option><option value="numero">Número</option>';
            tipoSelect.value = cfg.tipo;
            tipoSelect.disabled = acidente;
            tipoSelect.addEventListener("change", () => { cfg.tipo = tipoSelect.value; status("Alterações pendentes"); });
            tipo.appendChild(tipoSelect);
            const metodo = document.createElement("td");
            const metodoSelect = document.createElement("select");
            metodoSelect.innerHTML = '<option value="media">Média</option><option value="soma">Soma</option>';
            metodoSelect.value = acidente ? "soma" : cfg.metodoAcumulado;
            metodoSelect.disabled = acidente;
            metodoSelect.title = acidente ? "CPT e SPT sempre usam soma" : "Como os valores mensais formam o acumulado";
            metodoSelect.addEventListener("change", () => { cfg.metodoAcumulado = metodoSelect.value; status("Alterações pendentes"); });
            metodo.appendChild(metodoSelect);
            const situacao = document.createElement("td");
            situacao.textContent = cfg.arquivado ? "Arquivado" : acidente ? "Ativo • soma fixa" : "Ativo";
            const acoes = document.createElement("td");
            const editar = document.createElement("button");
            editar.type = "button"; editar.textContent = "Editar"; editar.addEventListener("click", () => abrirFormIndicador(ind));
            const arquivar = document.createElement("button");
            arquivar.type = "button"; arquivar.className = "danger"; arquivar.textContent = cfg.arquivado ? "Reativar" : "Arquivar"; arquivar.disabled = acidente;
            arquivar.addEventListener("click", () => { cfg.arquivado = !cfg.arquivado; renderIndicadores(); status("Alterações pendentes"); });
            acoes.append(editar, arquivar);
            tr.append(nome, tipo, metodo, situacao, acoes);
            tbody.appendChild(tr);
        });
        if (!ordenados.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td"); td.colSpan = 5; td.className = "management-empty-row"; td.textContent = "Nenhum indicador cadastrado para este contrato."; tr.appendChild(td); tbody.appendChild(tr);
        }
    }

    function abrirFormContrato(edicao = false) {
        el("management-form-kind").value = edicao ? "edit-contract" : "new-contract";
        el("management-form-original").value = edicao ? contratoSelecionado : "";
        el("management-form-name").value = edicao ? contratoSelecionado : "";
        el("management-indicator-fields").hidden = true;
        el("management-form-kicker").textContent = "CONTRATO";
        el("management-form-title").textContent = edicao ? "Editar contrato" : "Novo contrato";
        el("management-form-hint").textContent = "O contrato ficará disponível nos filtros do One Page após salvar.";
        el("management-form-overlay").hidden = false;
        el("management-form-name").focus();
    }

    function abrirFormIndicador(ind = null) {
        const cfg = ind ? indicadorConfig(contratoSelecionado, ind.nome_indicador, true) : null;
        el("management-form-kind").value = ind ? "edit-indicator" : "new-indicator";
        el("management-form-original").value = ind?.nome_indicador || "";
        el("management-form-name").value = ind?.nome_indicador || "";
        el("management-form-pillar").value = ind?.grupos?.pilares?.nome_pilar || "Manual";
        el("management-form-group").value = ind?.grupos?.nome_grupo || "Manual";
        el("management-form-type").value = cfg?.tipo || "percentual";
        el("management-form-method").value = cfg?.metodoAcumulado || "media";
        el("management-form-meta").value = ind?.meta || "";
        preencherLocalidades(ind);
        el("management-form-formula").value = ind?.formula || "";
        el("management-indicator-fields").hidden = false;
        el("management-form-kicker").textContent = "INDICADOR";
        el("management-form-title").textContent = ind ? "Editar indicador" : "Novo indicador";
        el("management-form-hint").textContent = "CPT e SPT são reconhecidos automaticamente e sempre acumulam por soma.";
        el("management-form-overlay").hidden = false;
        atualizarRegraAcidenteForm();
        el("management-form-name").focus();
    }

    function preencherLocalidades(indicador = null) {
        const select = el("management-form-locality");
        select.replaceChildren();
        const localidades = [...(dadosContrato?.localidades || [])]
            .sort((a, b) => a.nome_localidade.localeCompare(b.nome_localidade, "pt-BR"));
        const todas = document.createElement("option");
        todas.value = "__todas__";
        todas.textContent = "Todas as localidades";
        select.appendChild(todas);

        const localidadesAssociadas = indicador?.localidadeIds || [];
        const indicadorContratual = Boolean(indicador && eAcidente(indicador.nome_indicador));
        const todasAssociadas = indicadorContratual ||
            (localidades.length > 0 && localidadesAssociadas.length === localidades.length);
        if (localidadesAssociadas.length > 1 && !todasAssociadas) {
            const multiplas = document.createElement("option");
            multiplas.value = "__associadas__";
            multiplas.textContent = `${localidadesAssociadas.length} localidades associadas`;
            select.appendChild(multiplas);
        }
        localidades.forEach(localidade => {
            const option = document.createElement("option");
            option.value = localidade.nome_localidade;
            option.textContent = localidade.nome_localidade;
            select.appendChild(option);
        });
        const nova = document.createElement("option");
        nova.value = "__nova__";
        nova.textContent = "+ Incluir nova localidade";
        select.appendChild(nova);

        const unicaAssociada = indicador?.localidades?.[0] || "";
        if (!indicador || todasAssociadas) {
            select.value = "__todas__";
        } else if (localidadesAssociadas.length > 1) {
            select.value = "__associadas__";
        } else if (localidades.some(item => item.nome_localidade === unicaAssociada)) {
            select.value = unicaAssociada;
        } else {
            select.value = "__todas__";
        }
        el("management-form-new-locality").value = "";
        atualizarCampoNovaLocalidade();
    }

    function atualizarCampoNovaLocalidade() {
        const nova = el("management-form-locality").value === "__nova__";
        el("management-new-locality-wrap").hidden = !nova;
        el("management-form-new-locality").required = nova;
        if (nova) el("management-form-new-locality").focus();
    }

    function atualizarRegraAcidenteForm() {
        const acidente = eAcidente(el("management-form-name").value);
        if (acidente) { el("management-form-method").value = "soma"; el("management-form-type").value = "numero"; }
        el("management-form-method").disabled = acidente;
        el("management-form-type").disabled = acidente;
    }

    async function garantirEntidade(tabela, payload, conflito, select) {
        const { error } = await supabase().from(tabela).upsert(payload, { onConflict: conflito, ignoreDuplicates: true });
        if (error) throw new Error(error.message);
        let query = supabase().from(tabela).select(select);
        Object.entries(payload).forEach(([campo, valor]) => { query = query.eq(campo, valor); });
        const { data, error: selectError } = await query.single();
        if (selectError) throw new Error(selectError.message);
        return data;
    }

    async function salvarFormulario(event) {
        event.preventDefault();
        const kind = el("management-form-kind").value;
        const nome = normalizar(el("management-form-name").value);
        const original = el("management-form-original").value;
        if (!nome) return;
        status("Salvando cadastro...");
        if (kind === "new-contract") {
            const { error } = await supabase().from("clientes").insert({ nome_cliente: nome });
            if (error) throw new Error(error.message);
            contratoConfig(nome, true);
            contratoSelecionado = nome;
        } else if (kind === "edit-contract") {
            const { error } = await supabase().from("clientes").update({ nome_cliente: nome }).eq("nome_cliente", original);
            if (error) throw new Error(error.message);
            const antigo = contratoConfig(original, true);
            delete config.contratos[chave(original)];
            antigo.nome = nome;
            config.contratos[chave(nome)] = antigo;
            await supabase().from("versoes_contrato").update({ contrato: nome }).eq("contrato", original);
            contratoSelecionado = nome;
        } else {
            await salvarIndicador(kind, nome, original);
        }
        fecharFormulario();
        await salvarConfig();
        await renderContratos();
        const contrato = (await listarContratos()).find(c => c.nome_cliente === contratoSelecionado);
        if (contrato) await selecionarContrato(contrato);
        status("Cadastro salvo no Supabase.");
    }

    async function salvarIndicador(kind, nome, original) {
        const pilarNome = normalizar(el("management-form-pillar").value) || "Manual";
        const grupoNome = normalizar(el("management-form-group").value) || "Manual";
        const localSelecionada = el("management-form-locality").value;
        const tipo = eAcidente(nome) ? "numero" : el("management-form-type").value;
        const metodo = eAcidente(nome) ? "soma" : el("management-form-method").value;
        const cliente = (await listarContratos()).find(c => c.nome_cliente === contratoSelecionado);
        if (!cliente) throw new Error("Contrato não encontrado.");
        const pilar = await garantirEntidade("pilares", { nome_pilar: pilarNome }, "nome_pilar", "id,nome_pilar");
        const grupo = await garantirEntidade("grupos", { nome_grupo: grupoNome, pilar_id: pilar.id }, "nome_grupo,pilar_id", "id,nome_grupo,pilar_id");
        const indicador = await garantirEntidade("indicadores", { nome_indicador: nome, grupo_id: grupo.id }, "nome_indicador,grupo_id", "id,nome_indicador,grupo_id");
        let locais = [];
        if (localSelecionada === "__todas__") {
            locais = [...(dadosContrato?.localidades || [])];
        } else if (localSelecionada === "__associadas__") {
            const anterior = dadosContrato.indicadores.find(i => i.nome_indicador === original);
            locais = (dadosContrato?.localidades || []).filter(local => anterior?.localidadeIds?.includes(local.id));
        } else {
            const localNome = localSelecionada === "__nova__"
                ? normalizar(el("management-form-new-locality").value)
                : normalizar(localSelecionada);
            if (!localNome) throw new Error("Informe o nome da nova localidade.");
            const local = await garantirEntidade("localidades", { nome_localidade: localNome, cliente_id: cliente.id }, "nome_localidade,cliente_id", "id,nome_localidade,cliente_id");
            locais = [local];
        }
        if (locais.length === 0) throw new Error("Este contrato ainda não possui localidades. Inclua uma nova localidade.");

        if (kind === "edit-indicator" && original) {
            const antigo = dadosContrato.indicadores.find(i => i.nome_indicador === original);
            if (antigo && antigo.id !== indicador.id) {
                const { error } = await supabase().from("indicadores_competencia").update({ indicador_id: indicador.id }).eq("cliente_id", cliente.id).eq("indicador_id", antigo.id);
                if (error) throw new Error(error.message);
            }
            if (original !== nome) {
                delete contratoConfig(contratoSelecionado, true).indicadores[chave(original)];
            }
        }
        if (kind === "new-indicator") {
            const ano = appState()?.anoAtual || new Date().getFullYear();
            const fatosIniciais = locais.map(local => ({
                localidade_id: local.id, cliente_id: cliente.id, indicador_id: indicador.id,
                competencia: `01/${ano}`, meta: normalizar(el("management-form-meta").value),
                formula_calculo: normalizar(el("management-form-formula").value), dados_base: ""
            }));
            const { error } = await supabase().from("indicadores_competencia").upsert(fatosIniciais, { onConflict: "localidade_id,cliente_id,indicador_id,competencia" });
            if (error) throw new Error(error.message);
        } else {
            const { error } = await supabase().from("indicadores_competencia").update({
                meta: normalizar(el("management-form-meta").value), formula_calculo: normalizar(el("management-form-formula").value)
            }).eq("cliente_id", cliente.id).eq("indicador_id", indicador.id);
            if (error) throw new Error(error.message);

            const indicadorAnterior = dadosContrato.indicadores.find(i => i.nome_indicador === original);
            const locaisNovos = locais.filter(local => !indicadorAnterior?.localidadeIds?.includes(local.id));
            if (locaisNovos.length > 0) {
                const ano = appState()?.anoAtual || new Date().getFullYear();
                const novasAssociacoes = locaisNovos.map(local => ({
                    localidade_id: local.id, cliente_id: cliente.id, indicador_id: indicador.id,
                    competencia: `01/${ano}`, meta: normalizar(el("management-form-meta").value),
                    formula_calculo: normalizar(el("management-form-formula").value), dados_base: ""
                }));
                const { error: associacaoError } = await supabase().from("indicadores_competencia").upsert(novasAssociacoes, { onConflict: "localidade_id,cliente_id,indicador_id,competencia" });
                if (associacaoError) throw new Error(associacaoError.message);
            }
        }
        const cfg = indicadorConfig(contratoSelecionado, nome, true);
        cfg.nome = nome; cfg.tipo = tipo; cfg.metodoAcumulado = metodo; cfg.arquivado = false;
    }

    function fecharFormulario() { el("management-form-overlay").hidden = true; }

    async function abrirTela() {
        if (!supabase()) { window.alert("O Supabase não está configurado nesta publicação."); return; }
        el("management-modal").hidden = false;
        status("Carregando cadastros...");
        try { await carregarConfig(true); await renderContratos(); status(""); } catch (error) { status(error.message, true); }
    }

    async function fecharTela() {
        el("management-modal").hidden = true;
        try {
            if (typeof carregarListaClientesSupabase === "function") await carregarListaClientesSupabase();
            if (appState()?.contrato && appState().contrato !== "todos" && typeof window.carregarDoSupabaseERenderizar === "function") await window.carregarDoSupabaseERenderizar();
        } catch (error) { console.warn("Não foi possível atualizar o painel após a gestão:", error); }
    }

    function registrarEventos() {
        el("management-close").addEventListener("click", fecharTela);
        el("management-cancel").addEventListener("click", fecharTela);
        el("management-new-contract").addEventListener("click", () => abrirFormContrato(false));
        el("management-edit-contract").addEventListener("click", () => abrirFormContrato(true));
        el("management-new-indicator").addEventListener("click", () => abrirFormIndicador());
        el("management-search").addEventListener("input", () => renderContratos().catch(error => status(error.message, true)));
        el("management-form-close").addEventListener("click", fecharFormulario);
        el("management-form-cancel").addEventListener("click", fecharFormulario);
        el("management-form-name").addEventListener("input", atualizarRegraAcidenteForm);
        el("management-form-locality").addEventListener("change", atualizarCampoNovaLocalidade);
        el("management-form").addEventListener("submit", event => salvarFormulario(event).catch(error => status(error.message, true)));
        el("management-archive-contract").addEventListener("click", () => {
            const cc = contratoConfig(contratoSelecionado, true); cc.arquivado = !cc.arquivado;
            el("management-archive-contract").textContent = cc.arquivado ? "Reativar" : "Arquivar";
            renderContratos().catch(error => status(error.message, true)); status("Alterações pendentes");
        });
        el("management-save").addEventListener("click", async () => {
            try { status("Salvando alterações..."); await salvarConfig(); status("Alterações salvas no Supabase."); await renderContratos(); } catch (error) { status(error.message, true); }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        criarTela();
        el("btn-manage-data")?.addEventListener("click", abrirTela);
    });
})();
