function formatarCompetenciaExcel(val) {
    if (!val) return "";
    if (val instanceof Date && !isNaN(val.getTime())) {
        const m = String(val.getMonth() + 1).padStart(2, '0');
        return m + "/" + val.getFullYear();
    }
    if (typeof val === 'number' || (!isNaN(Number(val)) && Number(val) > 10000)) {
        const date = new Date((Number(val) - 25569) * 86400 * 1000);
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const y = date.getUTCFullYear();
        return m + "/" + y;
    }
    const str = String(val).trim();
    if (/^\d{2}\/\d{4}$/.test(str)) return str;

    // Datas vindas do Excel normalmente chegam como DD/MM/AAAA ou AAAA-MM-DD.
    // Ambas precisam ser gravadas na competência única MM/AAAA.
    const dataBr = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (dataBr) {
        const mes = Number(dataBr[2]);
        const ano = dataBr[3].length === 2 ? "20" + dataBr[3] : dataBr[3];
        if (mes >= 1 && mes <= 12) return String(mes).padStart(2, '0') + "/" + ano;
    }

    const dataIso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dataIso) {
        const mes = Number(dataIso[2]);
        if (mes >= 1 && mes <= 12) return String(mes).padStart(2, '0') + "/" + dataIso[1];
    }
    
    const partes = str.split('/');
    if (partes.length === 2) {
        const mesStr = partes[0].toLowerCase().substring(0,3);
        const mapas = { "jan": "01", "fev": "02", "mar": "03", "abr": "04", "mai": "05", "jun": "06", "jul": "07", "ago": "08", "set": "09", "out": "10", "nov": "11", "dez": "12" };
        if (mapas[mesStr]) {
            let ano = partes[1];
            if (ano.length === 2) ano = "20" + ano;
            return mapas[mesStr] + "/" + ano;
        }
    }
    return str;
}

// Retorna a competência cronologicamente mais recente, independentemente da
// ordem das linhas na planilha (por exemplo, 08/2026 depois de 07/2026).
function obterUltimaCompetenciaImportada(records) {
    if (!Array.isArray(records)) return null;

    return records.reduce((ultima, record) => {
        const competencia = record?.competencia;
        const match = String(competencia || "").match(/^(\d{2})\/(\d{4})$/);
        if (!match) return ultima;

        const mes = Number(match[1]);
        const ano = Number(match[2]);
        if (mes < 1 || mes > 12) return ultima;

        const ordem = ano * 12 + mes;
        return !ultima || ordem > ultima.ordem
            ? { competencia, ordem }
            : ultima;
    }, null)?.competencia || null;
}

// ==========================================
// MÓDULO SUPABASE - INTEGRAÇÃO DE IMPORTAÇÃO
// ==========================================

let pendingImportPayload = [];
let pendingImportSummary = {};

async function validateAndPreviewExcel(matrix) {
    if (!matrix || matrix.length < 2) {
        alert("O arquivo não possui dados suficientes.");
        return;
    }

    const normalize = str => str ? String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : "";

    let headerRowIdx = -1;
    let colIndices = { localidade: -1, cliente: -1, pilar: -1, grupo: -1, indicador: -1, mes: -1, dados_base: -1, meta: -1, formula: -1 };

    for (let r = 0; r < Math.min(20, matrix.length); r++) {
        const row = matrix[r];
        if (!row || !Array.isArray(row)) continue;
        
        const norm = row.map(normalize);
        
        const idxLoc = norm.findIndex(h => h.includes("localidade"));
        const idxCli = norm.findIndex(h => h.includes("cliente") || h.includes("contrato"));
        const idxPil = norm.findIndex(h => h.includes("pilar"));
        const idxGrp = norm.findIndex(h => h.includes("grupo"));
        const idxInd = norm.findIndex(h => h.includes("indicador") || h.includes("kpi") || h.includes("sla"));
        const idxMes = norm.findIndex(h => h === "mes" || h === "mês" || h.includes("mes"));
        const idxDad = norm.findIndex(h => h.includes("dados base") || h.includes("dados_base") || h.includes("resultado"));
        const idxMet = norm.findIndex(h => h.includes("meta"));
        const idxFor = norm.findIndex(h => h.includes("formula"));

        let matchCount = 0;
        if (idxLoc !== -1) matchCount++;
        if (idxCli !== -1) matchCount++;
        if (idxInd !== -1) matchCount++;
        if (idxMes !== -1) matchCount++;
        if (idxMet !== -1) matchCount++;

        // Precisamos achar as colunas base para considerar que é o cabeçalho
        if (matchCount >= 4) {
            headerRowIdx = r;
            colIndices = { localidade: idxLoc, cliente: idxCli, pilar: idxPil, grupo: idxGrp, indicador: idxInd, mes: idxMes, dados_base: idxDad, meta: idxMet, formula: idxFor };
            break;
        }
    }

    if (headerRowIdx === -1) {
        alert("Não foi possível encontrar a linha de cabeçalho na planilha.\nVerifique se as colunas Cliente, Indicador, Mês e Meta existem.");
        return;
    }

    // Verificar colunas obrigatórias
    const missing = [];
    if (colIndices.localidade === -1) missing.push("Localidade");
    if (colIndices.cliente === -1) missing.push("Cliente/Contrato");
    if (colIndices.indicador === -1) missing.push("Indicador/SLA");
    if (colIndices.mes === -1) missing.push("Mês");

    if (missing.length > 0) {
        alert("A planilha não possui colunas obrigatórias para a importação:\n" + missing.join(", "));
        return;
    }

    const validRecords = [];
    const errors = [];
    const duplicateCheck = new Set();
    let stats = { total: 0, new: 0, updated: 0, error: 0 };

    for (let i = headerRowIdx + 1; i < matrix.length; i++) {
        const row = matrix[i];
        if (!row || !Array.isArray(row) || row.length === 0 || !row.some(cell => cell)) continue;

        const localidade = colIndices.localidade !== -1 ? row[colIndices.localidade] : "Padrão";
        const cliente = colIndices.cliente !== -1 ? row[colIndices.cliente] : null;
        const pilar = colIndices.pilar !== -1 ? row[colIndices.pilar] : "Padrão";
        const grupo = colIndices.grupo !== -1 ? row[colIndices.grupo] : "Geral";
        const indicador = colIndices.indicador !== -1 ? row[colIndices.indicador] : null;
        const mes = colIndices.mes !== -1 ? row[colIndices.mes] : null;
        const dados_base = colIndices.dados_base !== -1 ? row[colIndices.dados_base] : null;
        const meta = colIndices.meta !== -1 ? row[colIndices.meta] : null;
        const formula = colIndices.formula !== -1 ? row[colIndices.formula] : null;

        if (!cliente || !indicador || !mes) {
            errors.push("Linha " + (i+1) + ": Cliente, Indicador ou Mês em branco.");
            stats.error++;
            continue;
        }

        const competencia = formatarCompetenciaExcel(mes);
        if (!/^\d{2}\/\d{4}$/.test(competencia)) {
            errors.push("Linha " + (i + 1) + ": competência inválida (use MM/AAAA ou uma data válida do Excel).");
            stats.error++;
            continue;
        }

        const uniqueKey = (localidade + "|" + cliente + "|" + indicador + "|" + competencia).toLowerCase();
        if (duplicateCheck.has(uniqueKey)) {
            errors.push("Linha " + (i+1) + ": Registro duplicado para " + cliente + " - " + indicador + " (" + mes + ").");
            stats.error++;
            continue;
        }
        duplicateCheck.add(uniqueKey);

        validRecords.push({
            localidade: String(localidade).trim(),
            cliente: String(cliente).trim(),
            pilar: String(pilar).trim(),
            grupo: String(grupo).trim(),
            indicador: String(indicador).trim(),
            competencia,
            dados_base: dados_base !== undefined && dados_base !== null ? String(dados_base).trim() : null,
            meta: meta !== undefined && meta !== null ? String(meta).trim() : null,
            formula_calculo: formula !== undefined && formula !== null ? String(formula).trim() : null,
            linha: i + 1
        });
        
        stats.total++;
        stats.new++;
    }

    if (validRecords.length === 0) {
        alert("Nenhum dado válido encontrado nas linhas após o cabeçalho.\nVerifique se os campos de Cliente, Indicador e Mês estão preenchidos nas linhas de dados.\nTotal de erros: " + stats.error);
        console.log("Erros mapeados:", errors);
        return;
    }

    pendingImportPayload = validRecords;
    pendingImportSummary = stats;

    document.getElementById("import-total-count").textContent = stats.total;
    document.getElementById("import-new-count").textContent = stats.new;
    document.getElementById("import-update-count").textContent = stats.updated;
    document.getElementById("import-error-count").textContent = stats.error;

    const errorContainer = document.getElementById("import-errors-container");
    const errorList = document.getElementById("import-errors-list");
    errorList.innerHTML = "";
    if (errors.length > 0) {
        errorContainer.style.display = "block";
        errors.forEach(err => {
            const li = document.createElement("li");
            li.textContent = err;
            errorList.appendChild(li);
        });
    } else {
        errorContainer.style.display = "none";
    }

    const modal = document.getElementById("import-preview-modal");
    if (modal) modal.style.display = "flex";
}

// Handler de clique do modal
document.addEventListener("DOMContentLoaded", () => {
    const btnCancel = document.getElementById("btn-cancel-import");
    const btnConfirm = document.getElementById("btn-confirm-import");
    const btnClose = document.getElementById("btn-close-import-modal");
    const modal = document.getElementById("import-preview-modal");

    if (btnCancel) btnCancel.addEventListener("click", () => modal.style.display = "none");
    if (btnClose) btnClose.addEventListener("click", () => modal.style.display = "none");
    
    if (btnConfirm) btnConfirm.addEventListener("click", async () => {
        if (!window.supabaseClientObj) {
            alert("Atenção: Supabase não está configurado. Verifique env.js.");
            return;
        }
        
        btnConfirm.disabled = true;
        btnConfirm.textContent = "Salvando...";

        try {
            await executarImportacaoSupabase(pendingImportPayload);
        } catch (e) {
            alert("Erro na gravação do Supabase: " + e.message);
            btnConfirm.disabled = false;
            btnConfirm.textContent = "Confirmar, salvar e carregar slides";
            return;
        }

        try {
            if (typeof window.aplicarRegistrosImportados === 'function') {
                window.aplicarRegistrosImportados(pendingImportPayload);
            }
            alert("Importação concluída com sucesso no Supabase!");
            modal.style.display = "none";
            if (typeof window.carregarDoSupabaseERenderizar === 'function') { await window.carregarDoSupabaseERenderizar(); }
        } catch (e) {
            console.error("Dados salvos, mas houve erro ao atualizar a tela:", e);
            alert("Os dados foram salvos no Supabase, mas a tela não pôde ser atualizada: " + e.message);
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.textContent = "Confirmar, salvar e carregar slides";
        }
    });
});

async function executarImportacaoSupabase(records) {
    if (records.length === 0) return;
    const supabase = window.supabaseClientObj;
    const uniqueBy = (items, key) => [...new Map(items.map(item => [key(item), item])).values()];
    const failOnError = (error, label) => {
        if (error) throw new Error(`Erro ao preparar ${label}: ${error.message}`);
    };

    // A versão anterior aguardava até 10 chamadas de rede por linha. Em planilhas
    // grandes isso deixava a tela em "Salvando..." por muitos minutos. Agora cada
    // entidade é inserida e lida em lote, mantendo poucas chamadas por importação.
    const clientes = uniqueBy(records.map(record => ({ nome_cliente: record.cliente })), item => item.nome_cliente);
    failOnError((await supabase.from('clientes').upsert(clientes, { onConflict: 'nome_cliente', ignoreDuplicates: true })).error, 'clientes');
    const { data: clientesDb, error: clientesError } = await supabase.from('clientes').select('id,nome_cliente').in('nome_cliente', clientes.map(item => item.nome_cliente));
    failOnError(clientesError, 'clientes');
    const clienteIds = Object.fromEntries(clientesDb.map(item => [item.nome_cliente, item.id]));

    const localidades = uniqueBy(records.map(record => ({ nome_localidade: record.localidade, cliente_id: clienteIds[record.cliente] })), item => `${item.nome_localidade}|${item.cliente_id}`);
    failOnError((await supabase.from('localidades').upsert(localidades, { onConflict: 'nome_localidade,cliente_id', ignoreDuplicates: true })).error, 'localidades');
    const { data: localidadesDb, error: localidadesError } = await supabase.from('localidades').select('id,nome_localidade,cliente_id').in('cliente_id', Object.values(clienteIds));
    failOnError(localidadesError, 'localidades');
    const localidadeIds = Object.fromEntries(localidadesDb.map(item => [`${item.nome_localidade}|${item.cliente_id}`, item.id]));

    const pilares = uniqueBy(records.map(record => ({ nome_pilar: record.pilar })), item => item.nome_pilar);
    failOnError((await supabase.from('pilares').upsert(pilares, { onConflict: 'nome_pilar', ignoreDuplicates: true })).error, 'pilares');
    const { data: pilaresDb, error: pilaresError } = await supabase.from('pilares').select('id,nome_pilar').in('nome_pilar', pilares.map(item => item.nome_pilar));
    failOnError(pilaresError, 'pilares');
    const pilarIds = Object.fromEntries(pilaresDb.map(item => [item.nome_pilar, item.id]));

    const grupos = uniqueBy(records.map(record => ({ nome_grupo: record.grupo, pilar_id: pilarIds[record.pilar] })), item => `${item.nome_grupo}|${item.pilar_id}`);
    failOnError((await supabase.from('grupos').upsert(grupos, { onConflict: 'nome_grupo,pilar_id', ignoreDuplicates: true })).error, 'grupos');
    const { data: gruposDb, error: gruposError } = await supabase.from('grupos').select('id,nome_grupo,pilar_id').in('pilar_id', Object.values(pilarIds));
    failOnError(gruposError, 'grupos');
    const grupoIds = Object.fromEntries(gruposDb.map(item => [`${item.nome_grupo}|${item.pilar_id}`, item.id]));

    const indicadores = uniqueBy(records.map(record => ({ nome_indicador: record.indicador, grupo_id: grupoIds[`${record.grupo}|${pilarIds[record.pilar]}`] })), item => `${item.nome_indicador}|${item.grupo_id}`);
    failOnError((await supabase.from('indicadores').upsert(indicadores, { onConflict: 'nome_indicador,grupo_id', ignoreDuplicates: true })).error, 'indicadores');
    const { data: indicadoresDb, error: indicadoresError } = await supabase.from('indicadores').select('id,nome_indicador,grupo_id').in('grupo_id', Object.values(grupoIds));
    failOnError(indicadoresError, 'indicadores');
    const indicadorIds = Object.fromEntries(indicadoresDb.map(item => [`${item.nome_indicador}|${item.grupo_id}`, item.id]));

    const fatosToUpsert = records.map(record => {
        const cliente_id = clienteIds[record.cliente];
        const pilar_id = pilarIds[record.pilar];
        const grupo_id = grupoIds[`${record.grupo}|${pilar_id}`];
        return {
            localidade_id: localidadeIds[`${record.localidade}|${cliente_id}`],
            cliente_id,
            indicador_id: indicadorIds[`${record.indicador}|${grupo_id}`],
            competencia: record.competencia,
            meta: record.meta,
            formula_calculo: record.formula_calculo,
            dados_base: record.dados_base
        };
    });

    // UPSERT EM LOTE MUDOU O JOGO DE PERFORMANCE! 1 unico request!
    if (fatosToUpsert.length > 0) {
        const { error: errFato } = await supabase.from('indicadores_competencia').upsert(
            fatosToUpsert, 
            { onConflict: 'localidade_id, cliente_id, indicador_id, competencia' }
        );
        if (errFato) throw new Error("Erro no upsert em lote: " + errFato.message);
    }

    const { error: importError } = await supabase.from('importacoes').insert({
        nome_arquivo: "importacao_excel_" + new Date().getTime(),
        quantidade_registros: pendingImportSummary.total,
        registros_inseridos: pendingImportSummary.new,
        status_importacao: "Sucesso"
    });
    if (importError) {
        console.warn("Os indicadores foram salvos, mas o histórico da importação não pôde ser registrado:", importError.message);
    }
    
    // Forçar a tela a selecionar o cliente e mês que acabou de ser importado
    if (records.length > 0) {
        const clienteImportado = records[0].cliente;
        const compImportada = obterUltimaCompetenciaImportada(records) || records[0].competencia;
        
        AppState.contrato = clienteImportado;
        
        const selectVersao = document.getElementById('filter-contrato');
        if (selectVersao) {
            let found = false;
            for(let i=0; i<selectVersao.options.length; i++) {
                if(selectVersao.options[i].text.toLowerCase() === clienteImportado.toLowerCase()) {
                    selectVersao.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if(!found) {
                const opt = document.createElement('option');
                opt.value = clienteImportado;
                opt.text = clienteImportado;
                selectVersao.appendChild(opt);
                selectVersao.value = clienteImportado;
                
                if (window.AppState && !window.AppState.dadosContratos[clienteImportado]) {
                    window.AppState.dadosContratos[clienteImportado] = JSON.parse(JSON.stringify(window.AppState.dadosContratos['CBO'] || {}));
                }
            }
        }
        
        // Também tentar atualizar o menu de tempo (Mês/Ano)
        const MESES_INV = { "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
        const parts = compImportada.split('/');
        if (parts.length === 2 && MESES_INV[parts[0]]) {
            const uiPeriodo = MESES_INV[parts[0]] + '/' + parts[1];
            AppState.periodo = uiPeriodo;
            AppState.anoAtual = parts[1];

            const anoAtualInput = document.getElementById('cfg-ano-atual');
            if (anoAtualInput) anoAtualInput.value = parts[1];
            
            // Adicionar no select de meses se não existir
            const selectMeses = document.getElementById('select-months');
            if (selectMeses) {
                let foundM = false;
                for(let i=0; i<selectMeses.options.length; i++) {
                    if(selectMeses.options[i].value === uiPeriodo) {
                        selectMeses.selectedIndex = i;
                        foundM = true;
                        break;
                    }
                }
                if(!foundM) {
                    const opt = document.createElement('option');
                    opt.value = uiPeriodo;
                    opt.text = uiPeriodo;
                    selectMeses.appendChild(opt);
                    selectMeses.value = uiPeriodo;
                }
            }
        }
    }
}


// ==========================================
// FUNÇÕES DE LEITURA (DASHBOARD)
// ==========================================

async function carregarListaClientesSupabase() {
    if (!window.supabaseClientObj) return;
    try {
        const { data, error } = await window.supabaseClientObj.from('clientes').select('nome_cliente');
        if (error) throw error;
        if (data && data.length > 0) {
            AppState.dadosContratos = AppState.dadosContratos || {};
            data.forEach(c => {
                const nome = c.nome_cliente;
                if (!AppState.dadosContratos[nome]) {
                    // Clona a estrutura do CBO para garantir que o front-end n quebre
                    AppState.dadosContratos[nome] = JSON.parse(JSON.stringify(AppState.dadosContratos['CBO'] || {}));
                }
            });

            // O filtro precisa ser reconstruído sempre que o app abre, mesmo se
            // os contratos já estiverem no cache local.
            const filterContrato = document.getElementById("filter-contrato");
            if (filterContrato) {
                const currentVal = AppState.contrato || filterContrato.value;
                filterContrato.innerHTML = '<option value="todos">Todos os contratos</option>';
                data
                    .map(c => c.nome_cliente)
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                    .forEach(nome => {
                        const opt = document.createElement("option");
                        opt.value = nome;
                        opt.textContent = nome;
                        filterContrato.appendChild(opt);
                    });

                filterContrato.value = data.some(c => c.nome_cliente === currentVal) ? currentVal : "todos";
            }
            salvarDados();
        }
    } catch(e) {
        console.error("Erro ao puxar clientes do supabase:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => carregarListaClientesSupabase(), 1000);
});


async function fetchDashboardData(clienteNome, competencia) {
    if (!window.supabaseClientObj) return null; 
    
    try {
        const { data: cliente } = await window.supabaseClientObj.from('clientes').select('id').eq('nome_cliente', clienteNome).single();
        if (!cliente) return null;

        const ano = competencia.split('/')[1];
        
        const { data: indicadoresFato } = await window.supabaseClientObj.from('indicadores_competencia')
            .select('*, indicadores(nome_indicador, grupos(nome_grupo, pilares(nome_pilar))), localidades(nome_localidade)')
            .eq('cliente_id', cliente.id)
            .like('competencia', `%/${ano}`); 
            
        const { data: comentarios } = await window.supabaseClientObj.from('comentarios')
            .select('*')
            .eq('contrato_id', cliente.id)
            .eq('competencia', competencia)
            .order('categoria', { ascending: true })
            .order('ordem', { ascending: true });

        return processarDadosSupabase(indicadoresFato, comentarios, competencia);
    } catch (e) {
        console.error("Erro ao buscar dados do Supabase:", e);
        return null;
    }
}

function parseNumberBr(str) {
    if (str === null || str === undefined) return null;
    if (typeof str === 'number') return str;
    const cleanStr = str.toString().replace('%', '').trim();
    if (cleanStr === '' || cleanStr === '-') return null;
    return parseFloat(cleanStr.replace(',', '.'));
}

function processarDadosSupabase(indicadoresFato, comentarios, competenciaSelecionada) {

    const excelDataMock = [];
    const indicadoresMap = {};
    
    indicadoresFato.forEach(fato => {
        const indNome = fato.indicadores.nome_indicador;
        const grupo = fato.indicadores.grupos.nome_grupo;
        const pilar = fato.indicadores.grupos.pilares.nome_pilar;
        const loc = fato.localidades ? fato.localidades.nome_localidade : "Padrão";
        
        if (!indicadoresMap[indNome]) {
            indicadoresMap[indNome] = {
                indicador: indNome,
                grupo: grupo,
                pilar: pilar,
                localidade: loc,
                resultados: [],
                atual: null,
                m1: null
            };
        }
        
        const mesInt = parseInt(fato.competencia.split('/')[0]);
        
        indicadoresMap[indNome].resultados.push({
            mes: mesInt,
            competencia: fato.competencia,
            valorStr: fato.dados_base,
            metaStr: fato.meta,
            valor: parseNumberBr(fato.dados_base),
            meta: parseNumberBr(fato.meta),
            formula: fato.formula_calculo
        });
    });
    
    const mesAtualInt = parseInt(competenciaSelecionada.split('/')[0]);
    
    Object.values(indicadoresMap).forEach(ind => {
        const mesesAteAtual = ind.resultados.filter(r => r.mes <= mesAtualInt);
        
        let sumResultados = 0;
        let countResultados = 0;
        let sumMetas = 0;
        let countMetas = 0;
        
        mesesAteAtual.forEach(r => {
            if (r.valor !== null && !isNaN(r.valor)) {
                sumResultados += r.valor;
                countResultados++;
            }
            if (r.meta !== null && !isNaN(r.meta)) {
                sumMetas += r.meta;
                countMetas++;
            }
        });
        
        let mediaResultado = countResultados > 0 ? (sumResultados / countResultados) : null;
        let mediaSLA = countMetas > 0 ? (sumMetas / countMetas) : null;
        
        ind.resultados.forEach(reg => {
            const isPct = (reg.valorStr && String(reg.valorStr).includes('%')) || 
                        (reg.metaStr && String(reg.metaStr).includes('%')) || 
                        (reg.valor !== null && Math.abs(reg.valor) > 0 && Math.abs(reg.valor) <= 2) || 
                        (reg.meta !== null && Math.abs(reg.meta) > 0 && Math.abs(reg.meta) <= 2);
            
            excelDataMock.push({
                contrato: AppState.contrato,
                localidade: ind.localidade || "Padrão",
                isPercentage: isPct,
                pilar: ind.pilar,
                grupo: ind.grupo,
                indicador: ind.indicador,
                mes: reg.competencia,
                mesIdx: parseInt(reg.competencia.split("/")[0]) - 1,
                dadosBase: reg.valor,
                meta: reg.meta, 
                metaAcumulada: mediaSLA,
                formula: reg.formula,
                acumAtual: mediaResultado,
                dadosMesM1: null
            });
        });
    });

    const comentariosMap = {
        destaques: [],
        atencoes: [],
        passos: [],
        pendenciasMro: [],
        pendenciasCliente: []
    };
    
    const catMap = {
        "Destaques": "destaques",
        "Pontos de Atenção": "atencoes",
        "Próximos Passos": "passos",
        "Pendências MRO": "pendenciasMro",
        "Pendências Cliente": "pendenciasCliente"
    };

    if(comentarios) {
        comentarios.forEach(c => {
            const listKey = catMap[c.categoria];
            if (listKey && comentariosMap[listKey]) {
                comentariosMap[listKey].push(c.comentario);
            }
        });
    }

    return {
        excelData: excelDataMock,
        comentarios: comentariosMap
    };
}
