function atualizarStatusBases() {
    const statusAtual = document.getElementById("status-base-atual");
    const statusAnterior = document.getElementById("status-base-anterior");
    
    if (statusAtual) {
        if (AppState.excelData && AppState.excelData.length > 0) {
            statusAtual.innerHTML = "�S& Base atual carregada na memória";
        } else {
            statusAtual.innerHTML = "";
        }
    }
    
    if (statusAnterior) {
        if (AppState.excelDataAnterior && AppState.excelDataAnterior.length > 0) {
            statusAnterior.innerHTML = "�S& Base anterior carregada na memória";
        } else {
            statusAnterior.innerHTML = "";
        }
    }
}
/* ==========================================================================
   Boletim Clientes � Lógica Principal (JavaScript)
   ========================================================================== */

// Dados Padrão (Fallback)
const DADOS_PADRAO = {
    contrato: "CBO",
    periodo: "Jul/2026",
    capaPeriodoTexto: "",
    respMro: "Nome",
    respCliente: "Nome",
    proxReuniao: "dd/mm/aaaa",
    destaques: [
        "Catalogação e recontagem das caixas com código SAP",
        "Utilização do aplicativo para atendimento"
    ],
    atencoes: [
        "Processo da renovação contratual com Suprimentos/Comercial"
    ],
    passos: [
        "Transferência do estoque do G3 para galpão provisório lonado",
        "Implementação do app de endereçamento e mooving dos materiais para o lonado"
    ],
    pendenciasMro: [
        "Continuidade da reorganização dos mangotes"
    ],
    pendenciasCliente: [
        "Validação da liderança de encarregado para serviços Spot docagem"
    ],
    slas: [
        { sla: "Acidentes do Trabalho CPT", meta: "0", atual: "0 -", m1: "0", acumulado: "0", status: "green", icon: "warning" },
        { sla: "Acidentes do Trabalho SPT", meta: "0", atual: "0 -", m1: "0", acumulado: "0", status: "green", icon: "warning" },
        { sla: "Assertividade no Recebimento", meta: "95,0%", atual: "100,0% -", m1: "100,0%", acumulado: "99,7%", status: "green", icon: "target" }
    ],
    indicadores: [
        {
            id: "cpt",
            title: "Acidentes do Trabalho CPT",
            meta: "0",
            formula: "Nº de Acidentes CPT",
            comment: "Comentário sobre o indicador:",
            dados: [0, 0, 0, 0, 0, 0, 0, null, null, null, null, null],
            metaDados: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            acum2026: 0,
            acum2025: null,
            arrow: "down",
            isPercentage: false,
            yMax: 5
        },
        {
            id: "spt",
            title: "Acidentes do Trabalho SPT",
            meta: "0",
            formula: "Nº de Acidentes SPT",
            comment: "Comentário sobre o indicador:",
            dados: [0, 0, 0, 0, 0, 0, 0, null, null, null, null, null],
            metaDados: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            acum2026: 0,
            acum2025: null,
            arrow: "down",
            isPercentage: false,
            yMax: 5
        },
        {
            id: "descarga",
            title: "Nível de Serviço de Descarga",
            meta: "100,0%",
            formula: "Total de materiais descarregados em até 3h/Total materiais recebidos",
            comment: "Comentário sobre o indicador:",
            dados: [null, null, null, null, 100, 100, 100, null, null, null, null, null],
            metaDados: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
            acum2026: 100,
            acum2025: null,
            arrow: "up",
            isPercentage: true,
            yMax: 120
        },
        {
            id: "ofr",
            title: "Order Fill Rate (OFR)",
            meta: "97,0%",
            formula: "Pedidos entregue OTIF / Total de pedidos",
            comment: "Comentário sobre o indicador:",
            dados: [61.0, 10.6, 11.4, 18.3, 23.9, 17.2, 31.7, null, null, null, null, null],
            metaDados: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            acum2026: 24.9,
            acum2025: null,
            arrow: "up",
            isPercentage: true,
            yMax: 120
        },
        {
            id: "qi",
            title: "Quality Inbound (QI)",
            meta: "99,0%",
            formula: "Total de recebimentos no prazo de 12h / total de recebimentos realizados",
            comment: "Comentário sobre o indicador:",
            dados: [100.0, 100.0, 98.5, 99.4, 100.0, 100.0, 99.7, null, null, null, null, null],
            metaDados: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            acum2026: 99.7,
            acum2025: null,
            arrow: "up",
            isPercentage: true,
            yMax: 120
        },
        {
            id: "turnover",
            title: "Turnover",
            meta: "97,0%",
            formula: "FTEs substituídos/Total de FTEs",
            comment: "Comentário sobre o indicador:",
            dados: [null, null, null, null, 98.7, 97.9, 99.0, null, null, null, null, null],
            metaDados: [97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97],
            acum2026: 98.5,
            acum2025: null,
            arrow: "up",
            isPercentage: true,
            yMax: 120
        }
    ],
    acoes: {
        direcionadoresAcoes: [
            "Consolidar ações geradas no boletim do período.",
            "Acompanhar prazos, responsáveis e próximos retornos.",
            "Escalonar ações críticas ou com risco de atraso.",
            "Registrar novas ações identificadas entre fechamentos."
        ],
                cards: []
    }
};

let AppState = JSON.parse(JSON.stringify(DADOS_PADRAO));
let modoEdicao = false;
let activeSlideIndex = 1;
let chartInstances = {};
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Referências explícitas ao DOM. Os IDs do HTML usam hífen e, por isso, não
// criam automaticamente variáveis JavaScript com nomes em camelCase.
let btnToggleDashboard;
let btnToggleEdit;
let dashboardPanel;
let filterContrato;
let filterLocalidade;
let excelFileInput;
let excelFileInputAnterior;
let btnUpdateCharts;
let btnLoadTemplate;
let btnExportPdf;
let btnExportPptxStandard;
let btnExportPptxEditable;
let btnSave;
let btnReload;
let selectVersionsContract;
let cfgAnoAnterior;
let cfgAnoAtual;
let cfgMetaPadraoPct;
let cfgMetaPadraoNum;
let cfgAcumAntPct;
let cfgAcumAntNum;
let cfgMesAcum;
let cntContratos;
let cntIndicadores;
let cntGraficos;
let cntIndicadoresNum;
let warningsBox;
let warningsListEl;
let warningsScopeText;
let restoreFeedback;
let dynamicChartSlides;
let slideCaptureArea;
let chartDataModal;
let modalIndicatorTitle;
let modalDataTbody;
let btnSaveModal;
let btnCloseModal;
let btnCancelModal;
let currentModalIndicator = null;
let currentModalChartId = null;

function mapearElementosDOM() {
    btnToggleDashboard = document.getElementById("btn-toggle-dashboard");
    btnToggleEdit = document.getElementById("btn-toggle-edit");
    dashboardPanel = document.getElementById("dashboard-panel");
    filterContrato = document.getElementById("filter-contrato");
    filterLocalidade = document.getElementById("filter-localidade");
    excelFileInput = document.getElementById("excel-file-input");
    excelFileInputAnterior = document.getElementById("excel-file-input-anterior");
    btnUpdateCharts = document.getElementById("btn-update-charts");
    btnLoadTemplate = document.getElementById("btn-load-template");
    btnExportPdf = document.getElementById("btn-export-pdf");
    btnExportPptxStandard = document.getElementById("btn-export-pptx-standard");
    btnExportPptxEditable = document.getElementById("btn-export-pptx-editable");
    btnSave = document.getElementById("btn-save-current");
    btnReload = document.getElementById("btn-reload-current");
    selectVersionsContract = document.getElementById("select-versions-contract");
    cfgAnoAnterior = document.getElementById("cfg-ano-anterior");
    cfgAnoAtual = document.getElementById("cfg-ano-atual");
    cfgMetaPadraoPct = document.getElementById("cfg-meta-padrao-pct");
    cfgMetaPadraoNum = document.getElementById("cfg-meta-padrao-num");
    cfgAcumAntPct = document.getElementById("cfg-acum-ant-pct");
    cfgAcumAntNum = document.getElementById("cfg-acum-ant-num");
    cfgMesAcum = document.getElementById("cfg-mes-acum");
    cntContratos = document.getElementById("cnt-contratos");
    cntIndicadores = document.getElementById("cnt-indicadores");
    cntGraficos = document.getElementById("cnt-graficos");
    cntIndicadoresNum = document.getElementById("cnt-indicadores-num");
    warningsBox = document.getElementById("warnings-box");
    warningsListEl = document.getElementById("warnings-list-el");
    warningsScopeText = document.getElementById("warnings-scope-text");
    restoreFeedback = document.getElementById("restore-feedback");
    dynamicChartSlides = document.getElementById("dynamic-chart-slides");
    slideCaptureArea = document.getElementById("slide-capture-area");
    chartDataModal = document.getElementById("chart-data-modal");
    modalIndicatorTitle = document.getElementById("modal-indicator-title");
    modalDataTbody = document.getElementById("modal-data-tbody");
    btnSaveModal = document.getElementById("btn-save-modal");
    btnCloseModal = document.getElementById("btn-close-modal");
    btnCancelModal = document.getElementById("btn-cancel-modal");
}

const NOMES_SLIDES_ESTATICOS = {
    1: "Capa",
    2: "One-Page Executivo",
    9: "Plano de Acompanhamento",
    10: "Realização das Reuniões",
    11: "Periodicidade e Participantes"
};

function obterSlidesDisponiveis() {
    return Array.from(document.querySelectorAll(".slide-container[data-index]"))
        .map(slide => ({
            index: Number(slide.dataset.index),
            element: slide,
            titulo: NOMES_SLIDES_ESTATICOS[Number(slide.dataset.index)] ||
                slide.querySelector(".chart-slide-title")?.textContent?.trim() ||
                `Slide ${slide.dataset.index}`
        }))
        .filter(slide => Number.isFinite(slide.index))
        .sort((a, b) => a.index - b.index);
}

let logoMroDataUrlPromise = null;

function carregarLogoMroIncorporada() {
    if (!logoMroDataUrlPromise) {
        logoMroDataUrlPromise = Promise.resolve().then(() => {
            const logoCabecalho = document.querySelector(".header-logo");
            const logo = (logoCabecalho?.getAttribute("src") || "").replace(/\s/g, "");
            if (!logo.startsWith("data:image/png;base64,")) {
                throw new Error("A logo MRO incorporada na página está inválida.");
            }
            return logo;
        });
    }
    return logoMroDataUrlPromise;
}

async function prepararLogosMro(root = document) {
    const imagens = Array.from(root.querySelectorAll(".chart-logo-footer img"));
    if (!imagens.length) return;

    const logoIncorporada = await carregarLogoMroIncorporada();
    imagens.forEach(img => {
        if (img.src !== logoIncorporada) img.src = logoIncorporada;
    });

    await Promise.all(imagens.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        if (typeof img.decode === "function") return img.decode();
        return new Promise((resolve, reject) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", reject, { once: true });
        });
    }));
}

function renderizarMenuSlides() {
    const menu = document.getElementById("slides-menu");
    if (!menu) return;

    const slides = obterSlidesDisponiveis();
    menu.replaceChildren();

    slides.forEach(slide => {
        const item = document.createElement("li");
        item.className = `slide-menu-item ${slide.index === activeSlideIndex ? "active" : ""}`;
        item.innerHTML = `<span class="slide-num-badge">${slide.index}</span><span>${slide.titulo}</span>`;
        item.addEventListener("click", () => selecionarSlide(slide.index));
        menu.appendChild(item);
    });
}

function selecionarSlide(index) {
    const slide = document.querySelector(`.slide-container[data-index="${index}"]`);
    if (!slide) return;

    activeSlideIndex = Number(index);
    document.querySelectorAll(".slide-container.active").forEach(item => item.classList.remove("active"));
    slide.classList.add("active");
    renderizarMenuSlides();
}

function salvarDados() {
    try {
        localStorage.setItem("MRO_Boletim_Dados", JSON.stringify(AppState));
    } catch (error) {
        // O cache local nunca pode invalidar um salvamento confirmado no Supabase.
        console.warn("Não foi possível atualizar o cache local:", error);
    }
}

function carregarDados() {
    const saved = localStorage.getItem("MRO_Boletim_Dados");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            AppState = { ...DADOS_PADRAO, ...parsed };
            if (!AppState.indicadores) AppState.indicadores = DADOS_PADRAO.indicadores;
            
            if (AppState.excelData && Array.isArray(AppState.excelData) && AppState.excelData.length > 0) {
                if (AppState.excelData[0].mesIdx === undefined) {
                    console.warn("Detectado formato antigo.");
                    AppState.excelData = null;
                }
            }
        } catch (e) {
            AppState = JSON.parse(JSON.stringify(DADOS_PADRAO));
        }
    } else {
        AppState = JSON.parse(JSON.stringify(DADOS_PADRAO));
    }
}

function sincronizarDadosContratoAtivo() {
    const c = AppState.contrato || "CBO";
    AppState.dadosContratos = AppState.dadosContratos || {};
    
    if (!AppState.dadosContratos[c]) {
        let reunioesBase = DADOS_PADRAO.reunioesExecutivas || [
            { client: c, class: "A", "Jan": "-", "Fev": "-", "Mar": "-", "Abr": "-", "Mai": "-", "Jun": "-", "Jul": "-", "Ago": "-", "Set": "-", "Out": "-", "Nov": "-", "Dez": "-" },
            { client: c, class: "B", "Jan": "-", "Fev": "-", "Mar": "-", "Abr": "-", "Mai": "-", "Jun": "-", "Jul": "-", "Ago": "-", "Set": "-", "Out": "-", "Nov": "-", "Dez": "-" },
            { client: c, class: "C", "Jan": "-", "Fev": "-", "Mar": "-", "Abr": "-", "Mai": "-", "Jun": "-", "Jul": "-", "Ago": "-", "Set": "-", "Out": "-", "Nov": "-", "Dez": "-" },
            { client: c, class: "D", "Jan": "-", "Fev": "-", "Mar": "-", "Abr": "-", "Mai": "-", "Jun": "-", "Jul": "-", "Ago": "-", "Set": "-", "Out": "-", "Nov": "-", "Dez": "-" }
        ];
        
        let reunioesCli = reunioesBase.filter(r => r.client && r.client.toLowerCase() === c.toLowerCase());
        if (reunioesCli.length === 0) {
            reunioesCli = JSON.parse(JSON.stringify(reunioesBase.slice(0,4)));
            reunioesCli.forEach(r => r.client = c);
        }
        
        AppState.dadosContratos[c] = {
            destaques: ["Insira os destaques do contrato " + c],
            atencoes: ["Insira os pontos de atenção do contrato " + c],
            passos: ["Insira os próximos passos do contrato " + c],
            pendenciasMro: ["Insira as pendências MRO do contrato " + c],
            pendenciasCliente: ["Insira as pendências do Cliente do contrato " + c],
            reunioesExecutivas: JSON.parse(JSON.stringify(reunioesCli)),
            slide11Participants: ["Participante 1", "Participante 2", "Participante 3"],
            cards: [
                { id: Date.now(), title: "Ação inicial para " + c, prazo: "dd/mm/aaaa", responsavel: "Responsável MRO", origem: "Interna", status: "nova" }
            ]
        };
    }
    
    AppState.destaques = AppState.dadosContratos[c].destaques || [];
    AppState.atencoes = AppState.dadosContratos[c].atencoes || [];
    AppState.passos = AppState.dadosContratos[c].passos || [];
    AppState.pendenciasMro = AppState.dadosContratos[c].pendenciasMro || [];
    AppState.pendenciasCliente = AppState.dadosContratos[c].pendenciasCliente || [];
    AppState.reunioesExecutivas = AppState.dadosContratos[c].reunioesExecutivas || [];
    AppState.slide11Participants = AppState.dadosContratos[c].slide11Participants || [];
    AppState.acoes = AppState.acoes || {};
    AppState.acoes.cards = AppState.dadosContratos[c].cards || [];
}

function renderizarDadosGlobais() {
    if (typeof filterContrato !== 'undefined' && filterContrato) filterContrato.value = AppState.contrato;
    if (typeof cfgAnoAtual !== 'undefined' && cfgAnoAtual) cfgAnoAtual.value = AppState.anoAtual || "2026";
    if (typeof cfgAnoAnterior !== 'undefined' && cfgAnoAnterior) cfgAnoAnterior.value = AppState.anoAnterior || "2025";
    
    const elContratoName = document.getElementById("slide1-contrato-name");
    if (elContratoName) elContratoName.textContent = AppState.contrato;
    
    const elPeriodo = document.getElementById("slide1-periodo-text");
    if (elPeriodo) elPeriodo.innerHTML = AppState.capaPeriodoTexto || `Fechamento de Indicadores | ${AppState.periodo}`;
    
    const elHContrato = document.getElementById("slide2-header-contrato");
    if (elHContrato) elHContrato.innerHTML = AppState.slide2HeaderContrato || AppState.contrato;
    
    const elHTitle = document.getElementById("slide2-header-title");
    if (elHTitle) elHTitle.innerHTML = AppState.slide2HeaderTitle || `One-Page Executivo - ${AppState.contrato}`;
    
    const elHSub = document.getElementById("slide2-header-subtitle");
    if (elHSub) elHSub.innerHTML = AppState.slide2HeaderSubtitle || `${AppState.contrato} | ${AppState.periodo}`;
    
    const elPendCliente = document.getElementById("label-pendencias-cliente");
    if (elPendCliente) elPendCliente.textContent = `Pendências ${AppState.contrato}`;
    
    document.querySelectorAll(".contrato-nome-placeholder").forEach(el => el.textContent = AppState.contrato);
    document.querySelectorAll(".periodo-placeholder").forEach(el => el.textContent = AppState.periodo);
    
    const respMro = document.getElementById("txt-resp-mro");
    if (respMro) respMro.innerHTML = AppState.respMro;
    const respCli = document.getElementById("txt-resp-cliente");
    if (respCli) respCli.innerHTML = AppState.respCliente;
    const proxReu = document.getElementById("txt-prox-reuniao");
    if (proxReu) proxReu.innerHTML = AppState.proxReuniao;
    
    if (typeof updatePlaceholderColors === 'function') updatePlaceholderColors();
    if (typeof renderList === 'function') {
        renderList("list-destaques", AppState.destaques);
        renderList("list-atencao", AppState.atencoes);
        renderList("list-passos", AppState.passos);
        renderList("list-pendencias-mro", AppState.pendenciasMro);
        renderList("list-pendencias-cliente", AppState.pendenciasCliente);
        if (AppState.acoes) renderList("list-direcionadores-acoes", AppState.acoes.direcionadoresAcoes);
    }
    
    if (typeof renderTabelaSLAs === 'function') renderTabelaSLAs();
    
    if (AppState.indicadores) {
        AppState.indicadores.forEach(ind => {
            if (typeof atualizarSetaHTML === 'function') atualizarSetaHTML(ind.id, ind.arrow);
        });
    }
    
    if (typeof renderKanbanCards === 'function') renderKanbanCards();
}

// Mantém os metadados editáveis do rodapé do One Page sincronizados com o
// estado. Sem essa sincronização, qualquer nova renderização (inclusive a
// iniciada pela exportação) restaura os textos padrão "Nome" e "dd/mm/aaaa".
function sincronizarMetadadosOnePageDoDOM() {
    [
        ["txt-resp-mro", "respMro", "Nome"],
        ["txt-resp-cliente", "respCliente", "Nome"],
        ["txt-prox-reuniao", "proxReuniao", "dd/mm/aaaa"]
    ].forEach(([elementId, stateKey, fallback]) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        AppState[stateKey] = element.textContent.trim() || fallback;
    });
}

function configurarEventosGerais() {
    const capaPeriodo = document.getElementById("slide1-periodo-text");
    if (capaPeriodo) {
        capaPeriodo.addEventListener("blur", () => {
            const textoPadrao = `Fechamento de Indicadores | ${AppState.periodo}`;
            AppState.capaPeriodoTexto = capaPeriodo.innerHTML.trim() || textoPadrao;
            capaPeriodo.innerHTML = AppState.capaPeriodoTexto;
            salvarDados();
        });
    }

    ["txt-resp-mro", "txt-resp-cliente", "txt-prox-reuniao"].forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) return;

        // O evento input protege o valor mesmo se outra ação renderizar o One
        // Page antes de o campo perder o foco.
        element.addEventListener("input", sincronizarMetadadosOnePageDoDOM);
        element.addEventListener("blur", () => {
            sincronizarMetadadosOnePageDoDOM();
            salvarDados();
            if (typeof updatePlaceholderColors === "function") updatePlaceholderColors();
        });
    });

    if (btnExportPdf) {
        btnExportPdf.addEventListener("click", exportarPDF);
    }

    if (btnExportPptxStandard) {
        btnExportPptxStandard.addEventListener("click", exportarPPTXPadrao);
    }

    if (btnExportPptxEditable) {
        btnExportPptxEditable.addEventListener("click", exportarPPTXEditavel);
    }

    if (btnCloseModal) btnCloseModal.addEventListener("click", fecharModalGrafico);
    if (btnCancelModal) btnCancelModal.addEventListener("click", fecharModalGrafico);
    if (btnSaveModal) btnSaveModal.addEventListener("click", salvarValoresModalGrafico);
    if (chartDataModal) {
        chartDataModal.addEventListener("click", (event) => {
            if (event.target === chartDataModal) fecharModalGrafico();
        });
    }

    if (typeof btnToggleDashboard !== 'undefined' && btnToggleDashboard) {
        btnToggleDashboard.addEventListener("click", () => {
            if (typeof dashboardPanel !== 'undefined') dashboardPanel.classList.toggle("collapsed");
            const isCollapsed = dashboardPanel.classList.contains("collapsed");
            btnToggleDashboard.classList.toggle("active", !isCollapsed);
            const textSpan = btnToggleDashboard.querySelector("span");
            if (textSpan) textSpan.textContent = isCollapsed ? "Exibir Filtros" : "Ocultar Filtros";
        });
    }

    if (typeof filterContrato !== 'undefined' && filterContrato) {
        filterContrato.addEventListener("change", async (e) => {
            AppState.contrato = e.target.value;
            sincronizarDadosContratoAtivo();
            if (AppState.contrato !== "todos" && typeof window.carregarDoSupabaseERenderizar === 'function' && window.supabaseClientObj) {
                await window.carregarDoSupabaseERenderizar();
            } else {
                if (typeof atualizarFiltrosLocalidade === 'function') atualizarFiltrosLocalidade();
                if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
            }
        });
    }

    if (typeof filterLocalidade !== 'undefined' && filterLocalidade) {
        filterLocalidade.addEventListener("change", () => {
            if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
        });
    }

    if (typeof excelFileInput !== 'undefined' && excelFileInput) {
        excelFileInput.addEventListener("change", handleExcelUpload);
    }
    if (typeof excelFileInputAnterior !== 'undefined' && excelFileInputAnterior) {
        excelFileInputAnterior.addEventListener("change", handleExcelUploadAnterior);
    }

    if (typeof btnUpdateCharts !== 'undefined' && btnUpdateCharts) {
        btnUpdateCharts.addEventListener("click", async () => {
            if (typeof processarConfiguracoesEAtualizar === 'function') processarConfiguracoesEAtualizar();
            if (typeof window.carregarDoSupabaseERenderizar === 'function') {
                await window.carregarDoSupabaseERenderizar();
            } else {
                if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
            }
        });
    }

    if (typeof btnSave !== 'undefined' && btnSave) {
        btnSave.addEventListener("click", async () => {
            btnSave.disabled = true;
            const textoAnterior = btnSave.textContent;
            btnSave.textContent = "Salvando versão...";
            try {
                await salvarNovaVersao();
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = textoAnterior;
            }
        });
    }

    if (typeof btnReload !== 'undefined' && btnReload) {
        btnReload.addEventListener("click", () => {
            carregarDados();
            sincronizarDadosContratoAtivo();
            if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
            if (typeof mostrarNotificacao === 'function') mostrarNotificacao("Dados recarregados com sucesso!", "success");
        });
    }

    if (typeof btnToggleEdit !== 'undefined' && btnToggleEdit) {
        btnToggleEdit.addEventListener("click", () => {
            modoEdicao = !modoEdicao;
            btnToggleEdit.classList.toggle("active", modoEdicao);
            atualizarModoUI();
        });
    }

    if (typeof selectVersionsContract !== 'undefined' && selectVersionsContract) {
        selectVersionsContract.addEventListener("change", (e) => {
            const verId = e.target.value;
            if (!verId) return;
            const ver = AppState.historicoVersoes.find(v => v.id === verId);
            if (ver) {
                const tempHistory = AppState.historicoVersoes;
                AppState = JSON.parse(JSON.stringify(ver.dados));
                AppState.historicoVersoes = tempHistory;
                salvarDados();
                if (filterContrato) filterContrato.value = AppState.contrato;
                if (typeof atualizarFiltrosLocalidade === 'function') atualizarFiltrosLocalidade();
                if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
                if (typeof mostrarNotificacao === 'function') mostrarNotificacao(`Versão "${ver.nome}" carregada!`, "success");
            }
        });
    }
}

function atualizarModoUI() {
    const slideCaptureArea = document.getElementById("slide-capture-area");
    if (!slideCaptureArea) return;
    if (modoEdicao) {
        slideCaptureArea.classList.remove("preview-mode");
        slideCaptureArea.classList.add("editing");
        document.querySelectorAll(".editable-text").forEach(el => el.setAttribute("contenteditable", "true"));
    } else {
        slideCaptureArea.classList.remove("editing");
        slideCaptureArea.classList.add("preview-mode");
        document.querySelectorAll(".editable-text").forEach(el => el.setAttribute("contenteditable", "false"));
    }

    // Os controles de inclusão e exclusão pertencem à renderização original
    // das listas/tabela e precisam ser refeitos ao alternar o modo de edição.
    if (typeof renderizarDadosGlobais === "function") renderizarDadosGlobais();
    if (typeof autoFitCompact === "function") autoFitCompact();
}

function gerarTabelaCronograma() {
    const tbody = document.getElementById("tbody-cronograma-reunioes");
    if (!tbody || !AppState.reunioesExecutivas) return;
    tbody.innerHTML = "";
    
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    AppState.reunioesExecutivas.forEach((row, rIdx) => {
        const tr = document.createElement("tr");
        
        const tdClient = document.createElement("td");
        tdClient.innerHTML = `<span class="editable-text font-bold" contenteditable="${modoEdicao}">${row.client}</span>`;
        tdClient.querySelector(".editable-text").addEventListener("blur", (e) => {
            row.client = e.target.innerHTML;
            salvarDados();
        });
        tr.appendChild(tdClient);
        
        const tdClass = document.createElement("td");
        tdClass.innerHTML = `<span class="editable-text" contenteditable="${modoEdicao}">${row.class}</span>`;
        tdClass.querySelector(".editable-text").addEventListener("blur", (e) => {
            row.class = e.target.innerHTML;
            salvarDados();
        });
        tr.appendChild(tdClass);
        
        meses.forEach(mes => {
            const td = document.createElement("td");
            td.innerHTML = `<span class="editable-text" contenteditable="${modoEdicao}">${row[mes] || "-"}</span>`;
            td.querySelector(".editable-text").addEventListener("blur", (e) => {
                row[mes] = e.target.innerHTML;
                salvarDados();
            });
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    mapearElementosDOM();
    prepararLogosMro(document).catch(error => console.error("Erro ao preparar logo MRO:", error));
    carregarDados();
    sincronizarDadosContratoAtivo();
    
    if (typeof carregarListaClientesSupabase === 'function') {
        carregarListaClientesSupabase().then(() => {
            if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
        });
    } else {
        if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
    }
    
    configurarEventosGerais();
    gerarTabelaCronograma();
    atualizarDashboardECartas();
    
    if (typeof carregarMockDadosPlanilha !== 'undefined' && typeof btnLoadTemplate !== 'undefined' && btnLoadTemplate) {
        btnLoadTemplate.addEventListener("click", carregarMockDadosPlanilha);
    }
});


// O Supabase é a fonte oficial do histórico; o AppState mantém somente um cache.
let requisicaoVersoesAtual = 0;

async function atualizarDropdownVersoes() {
    if (!selectVersionsContract) return;

    const numeroRequisicao = ++requisicaoVersoesAtual;
    const valAnterior = selectVersionsContract.value;
    selectVersionsContract.innerHTML = '<option value="">Últimas versões por contrato</option>';
    const contratoAtivo = filterContrato.value;
    if (!contratoAtivo) return;

    let versoesFiltradas = [];
    try {
        if (typeof window.listarVersoesContratoSupabase !== "function") {
            throw new Error("Módulo de versões do Supabase não carregado.");
        }
        versoesFiltradas = await window.listarVersoesContratoSupabase(contratoAtivo);
        if (numeroRequisicao !== requisicaoVersoesAtual || filterContrato.value !== contratoAtivo) return;

        const outrosContratos = (AppState.historicoVersoes || [])
            .filter(versao => versao.contrato !== contratoAtivo);
        AppState.historicoVersoes = [...outrosContratos, ...versoesFiltradas];
        salvarDados();
    } catch (error) {
        console.error("Erro ao carregar versões do Supabase:", error);
        if (numeroRequisicao !== requisicaoVersoesAtual) return;
        const optionErro = document.createElement("option");
        optionErro.value = "";
        optionErro.textContent = "Não foi possível carregar as versões";
        optionErro.disabled = true;
        selectVersionsContract.appendChild(optionErro);
        return;
    }

    versoesFiltradas.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `${v.nome} | ${v.contrato} | ${v.dataHora}`;
        selectVersionsContract.appendChild(opt);
    });
    
    if (versoesFiltradas.some(v => v.id === valAnterior)) {
        selectVersionsContract.value = valAnterior;
    }
}

// Salva uma nova versão acumulativa do dashboard atual
async function salvarNovaVersao() {
    if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
    }
    sincronizarMetadadosOnePageDoDOM();
    
    const defaultName = AppState.contrato || "Versão Sem Nome";
    const nomeVersaoInput = prompt("Digite o nome ou identificador para esta versão:", defaultName);
    if (nomeVersaoInput === null) return;
    
    const nomeVersao = nomeVersaoInput.trim() || defaultName;
    
    const snapshot = {
        contrato: AppState.contrato,
        periodo: AppState.periodo,
        respMro: AppState.respMro,
        respCliente: AppState.respCliente,
        proxReuniao: AppState.proxReuniao,
        destaques: [...AppState.destaques],
        atencoes: [...AppState.atencoes],
        passos: [...AppState.passos],
        pendenciasMro: [...AppState.pendenciasMro],
        pendenciasCliente: [...AppState.pendenciasCliente],
        slas: JSON.parse(JSON.stringify(AppState.slas)),
        indicadores: JSON.parse(JSON.stringify(AppState.indicadores)),
        reunioesExecutivas: JSON.parse(JSON.stringify(AppState.reunioesExecutivas)),
        slide11Participants: [...AppState.slide11Participants],
        excelData: AppState.excelData ? JSON.parse(JSON.stringify(AppState.excelData)) : null,
        dadosContratos: AppState.dadosContratos ? JSON.parse(JSON.stringify(AppState.dadosContratos)) : {},
        anoAnterior: AppState.anoAnterior,
        anoAtual: AppState.anoAtual
    };
    
    const versaoParaSalvar = {
        nome: nomeVersao,
        contrato: AppState.contrato,
        periodo: AppState.periodo,
        dados: snapshot
    };

    try {
        if (typeof window.salvarVersaoContratoSupabase !== "function") {
            throw new Error("Módulo de versões do Supabase não carregado.");
        }
        const novaVersao = await window.salvarVersaoContratoSupabase(versaoParaSalvar);
        AppState.historicoVersoes = AppState.historicoVersoes || [];
        AppState.historicoVersoes = [
            ...AppState.historicoVersoes.filter(versao => versao.id !== novaVersao.id),
            novaVersao
        ];
        salvarDados();
        await atualizarDropdownVersoes();
        selectVersionsContract.value = novaVersao.id;
        mostrarNotificacao(`Versão "${nomeVersao}" salva com sucesso no Supabase!`, "success");
        return novaVersao;
    } catch (error) {
        console.error("Erro ao salvar versão no Supabase:", error);
        alert(error.message);
        return null;
    }
}


// Traduz strings e números de meses de forma robusta (long format)
function obterIndiceMes(mesVal) {
    if (!mesVal) return -1;
    
    if (mesVal instanceof Date) {
        // Adiciona 12 horas para compensar fusos horários locais negativos (como UTC-3 no Brasil)
        // evitando que a data caia no dia/mês anterior devido ao fuso local
        const adjustedDate = new Date(mesVal.getTime() + 12 * 60 * 60 * 1000);
        return adjustedDate.getMonth();
    }
    
    const str = mesVal.toString().trim();
    
    // Se for número serial do Excel (ex: 45000 a 47000)
    const num = parseFloat(str);
    if (!isNaN(num) && num > 40000 && num < 60000) {
        // Adiciona 12 horas de compensação para evitar retrocesso de dia/mês no fuso local
        const date = new Date((num - 25569) * 86400 * 1000 + 12 * 60 * 60 * 1000);
        return date.getMonth();
    }
    
    // Se for formato de data string (ex: "01/02/2026" ou "2026-02-01")
    if (str.includes("/") || str.includes("-")) {
        const parts = str.split(/[\/-]/);
        if (parts.length >= 2) {
            // Em formato DD/MM/YYYY o segundo item é o mês
            let m = parseInt(parts[1]);
            if (!isNaN(m) && m >= 1 && m <= 12) {
                return m - 1;
            }
            // Em formato YYYY-MM-DD o segundo item também é o mês, mas tratamos alternativo se o primeiro for
            let mAlt = parseInt(parts[0]);
            if (!isNaN(mAlt) && mAlt >= 1 && mAlt <= 12) {
                return mAlt - 1;
            }
        }
    }
    
    // Se for abreviação ou nome por extenso
    const strUpper = str.toUpperCase();
    const mesesAbr = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    const mesesExt = ["JANEIRO", "FEVEREIRO", "MAR�!O", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    
    for (let i = 0; i < 12; i++) {
        if (strUpper.startsWith(mesesAbr[i]) || strUpper === mesesExt[i]) {
            return i;
        }
    }
    
    if (strUpper === "MARCO") return 2;
    
    // Se for apenas o número do mês direto (ex: "1" para JAN)
    const mesNum = parseInt(str);
    if (!isNaN(mesNum) && mesNum >= 1 && mesNum <= 12) {
        return mesNum - 1;
    }
    
    return -1;
}

// Analisa e normaliza valores decimais para a escala percentual cheia
function parseValorDadosBase(val, isPercentage) {
    if (val === null || val === undefined || val === "") return null;
    
    let numVal = parseFloat(val.toString().replace("%", "").replace(",", ".").trim());
    if (isNaN(numVal)) return null;
    
    // Converte decimal (ex: 0.6099) para percentual cheio (60.99)
    if (isPercentage && numVal >= 0 && numVal <= 1.5) {
        numVal = parseFloat((numVal * 100).toFixed(4));
    }
    
    return parseFloat(numVal.toFixed(2));
}

const SLOT_INDICADORES = [
    { key: "cpt", name: "Acidentes do Trabalho CPT", isPercentage: false, formula: "Nº de Acidentes CPT" },
    { key: "spt", name: "Acidentes do Trabalho SPT", isPercentage: false, formula: "Nº de Acidentes SPT" },
    { key: "descarga", name: "Nível de Serviço de Descarga", isPercentage: true, formula: "Percentual de Descarga" },
    { key: "ofr", name: "Order Fill Rate (OFR)", isPercentage: true, formula: "Percentual de OFR" },
    { key: "qi", name: "Quality Inbound (QI)", isPercentage: true, formula: "Percentual de QI" },
    { key: "turnover", name: "Turnover", isPercentage: true, formula: "Média de Turnover" }
];

// Atualiza o dropdown de localidades com base no contrato ativo
function atualizarFiltrosLocalidade() {
    if (!filterLocalidade) return;
    
    const valAnterior = filterLocalidade.value;
    filterLocalidade.innerHTML = '<option value="todos">Todas as localidades</option>';
    
    if (AppState.excelData && AppState.excelData.length > 0) {
        const contratoAtivo = filterContrato.value;
        const localidadesSet = new Set();
        
        AppState.excelData.forEach(row => {
            if (contratoAtivo === "todos" || row.contrato === contratoAtivo) {
                if (row.localidade) {
                    localidadesSet.add(row.localidade);
                }
            }
        });
        
        localidadesSet.forEach(loc => {
            const opt = document.createElement("option");
            opt.value = loc;
            opt.textContent = loc;
            filterLocalidade.appendChild(opt);
        });
        
        if (localidadesSet.has(valAnterior)) {
            filterLocalidade.value = valAnterior;
        }
    }
}

// Atualiza todas as exibições com base nos filtros
function atualizarDashboardECartas() {
    AppState.contrato = filterContrato.value;
    
    // Sincroniza dados do contrato ativo antes de renderizar (destaques, reuniões, etc.)
    sincronizarDadosContratoAtivo();
    
    renderizarDadosGlobais();
    
    const dadosFiltrados = obterDadosFiltrados();
    
    // Atualiza contadores do Painel de Controle
    cntContratos.textContent = obterContagemContratos();
    cntIndicadores.textContent = obterContagemIndicadoresUnicos();
    cntGraficos.textContent = dadosFiltrados.length;
    cntIndicadoresNum.textContent = obterContagemIndicadoresNumericos(dadosFiltrados);
    
    recalcularAlertasEAvisos(dadosFiltrados);
    
    // Destrói os gráficos antigos
    Object.keys(chartInstances).forEach(key => {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
        }
    });
    chartInstances = {};
    
    // Recria os slides de gráficos de forma fixa (sempre 6 slides)
    recriarSlidesGraficosDinamicamente(dadosFiltrados);
    renderizarMenuSlides();
    
    // Atualiza a tabela de SLAs do Slide 2
    atualizarSlasComDadosExcel(dadosFiltrados);
    
    // Atualiza dropdown de versões para o contrato ativo
    atualizarDropdownVersoes();
}

function obterContagemContratos() {
    if (!AppState.excelData) return 1;
    const contratosSet = new Set();
    AppState.excelData.forEach(row => contratosSet.add(row.contrato));
    return contratosSet.size;
}

function obterContagemIndicadoresUnicos() {
    const dados = obterDadosFiltrados();
    return dados.length;
}

function obterContagemIndicadoresNumericos(dados) {
    let count = 0;
    dados.forEach(ind => {
        if (!ind.isPercentage) count++;
    });
    return count;
}

// Formata valores com exatamente uma casa decimal e separador de vírgula (padrão brasileiro)
function formatarUmaCasaDecimal(val, isPercentage) {
    if (val === null || val === undefined || val === "" || val === "-") return "-";
    let numVal = parseFloat(String(val).replace("%", "").replace(",", ".").trim());
    if (isNaN(numVal)) return "-";
    if (numVal === 0) return "0";
    return numVal.toFixed(1).replace(".", ",") + (isPercentage ? "%" : "");
}

// Obtém o índice do mês do período ativo (ex: 6 para Julho se o período for "Jul/2026")
function obterIndicePeriodoAtivo() {
    if (!AppState.periodo) return -1;
    const parts = AppState.periodo.split(/[\/-]/);
    const monthPart = parts[0].trim();
    return obterIndiceMes(monthPart);
}

// Sincroniza metadados gerais de volta na base (seja no Excel ou no fallback)
function sincronizarMetadadosIndicador(ind) {
    if (!AppState.excelData) {
        const idx = AppState.indicadores.findIndex(i => i.id === ind.id || i.title === ind.indicador);
        if (idx !== -1) {
            AppState.indicadores[idx].meta = ind.meta;
            AppState.indicadores[idx].formula = ind.formula;
            AppState.indicadores[idx].comment = ind.comment;
            AppState.indicadores[idx].arrow = ind.arrow;
            AppState.indicadores[idx].status = ind.status;
            AppState.indicadores[idx].icon = ind.icon;
        }
        salvarDados();
        return;
    }
    
    let found = false;
    AppState.excelData.forEach(row => {
        const matchContrato = row.contrato === ind.contrato;
        const matchLocalidade = ind.scopeLocalidade === "todos" || row.localidade === ind.scopeLocalidade;
        const matchIndicador = row.indicador === ind.indicador;
        if (matchContrato && matchLocalidade && matchIndicador) {
            row.meta = ind.meta;
            row.formula = ind.formula;
            row.comment = ind.comment;
            row.arrow = ind.arrow;
            row.status = ind.status;
            row.icon = ind.icon;
            found = true;
        }
    });
    
    if (found) {
        salvarDados();
    }
}

// Sincroniza valores numéricos mensais e acumulados de volta na base
function sincronizarValoresGrafico(ind) {
    if (!AppState.excelData) {
        const idx = AppState.indicadores.findIndex(i =>
            i.id === ind.id || (i.indicador || i.title) === ind.indicador
        );
        if (idx !== -1) {
            AppState.indicadores[idx].dados = [...ind.dados];
            AppState.indicadores[idx].metaDados = [...ind.metaDados];
            AppState.indicadores[idx].acum2025 = ind.acumAnterior;
            AppState.indicadores[idx].acum2026 = ind.acumAtual;
        }
        salvarDados();
        return;
    }
    
    // As referências são capturadas no momento em que o gráfico é montado.
    // Assim, editar um slide nunca alcança linhas pertencentes a outro indicador.
    const scopeContrato = ind.scopeContrato && ind.scopeContrato !== "todos"
        ? ind.scopeContrato
        : ind.contrato;
    const scopeLocalidade = ind.scopeLocalidade || ind.localidade || "todos";
    const pertenceAoGrafico = row =>
        row.indicador === ind.indicador &&
        row.contrato === scopeContrato &&
        (scopeLocalidade === "todos" || row.localidade === scopeLocalidade);

    const sourceRows = Array.isArray(ind.sourceRows)
        ? ind.sourceRows.filter(row => AppState.excelData.includes(row) && pertenceAoGrafico(row))
        : AppState.excelData.filter(row =>
            pertenceAoGrafico(row)
        );

    // O acumulado anterior editado pertence somente a este gráfico. Guardá-lo
    // no fallback global por nome fazia contratos diferentes compartilharem o
    // mesmo valor.
    sourceRows.forEach(row => {
        row.acumAnteriorOverride = ind.acumAnterior;
    });

    const templateRow = sourceRows[0] || null;
    
    for (let mIdx = 0; mIdx < 12; mIdx++) {
        const val = ind.dados[mIdx];
        const metaVal = ind.metaDados[mIdx];
        const monthRows = sourceRows.filter(row => row.mesIdx === mIdx);
        const metaStr = ind.isPercentage ? (metaVal !== null ? (metaVal.toFixed(1).replace(".", ",") + "%") : "") : String(metaVal);
        
        if (monthRows.length > 0) {
            monthRows.forEach(row => {
                row.dadosBase = val;
                row.meta = metaStr;
            });
        } else if ((val !== null || metaVal !== 0) && templateRow) {
            const newRow = {
                ...templateRow,
                indicador: ind.indicador,
                mesIdx: mIdx,
                dadosBase: val,
                meta: metaStr
            };
            AppState.excelData.push(newRow);
            sourceRows.push(newRow);
        }
    }
    
    salvarDados();
}

// Filtra e retorna os indicadores da planilha por referência direta. Quando
// "todos" os contratos estão selecionados, cada contrato mantém seu próprio
// gráfico mesmo que possua um indicador com o mesmo nome.
function obterDadosFiltrados() {
    const contratoSel = filterContrato.value;
    const localidadeSel = filterLocalidade.value;
    
    // Se tivermos planilha de Excel, filtramos dela e mantemos os objetos originais por referência
    if (AppState.excelData && AppState.excelData.length > 0) {
        const filteredRaw = AppState.excelData.filter(row => {
            const matchContrato = contratoSel === "todos" || row.contrato === contratoSel;
            const matchLocalidade = localidadeSel === "todos" || row.localidade === localidadeSel;
            return matchContrato && matchLocalidade;
        });
        
        // A identidade do gráfico é contrato + indicador. Localidades continuam
        // consolidadas quando o filtro de localidade estiver em "todos".
        const grouped = {};
        
        filteredRaw.forEach(row => {
            const indName = row.indicador;
            const rowContrato = String(row.contrato || "").trim();
            const groupKey = `${rowContrato}\u0000${indName}`;
            if (!grouped[groupKey]) {
                const nameLower = indName.toLowerCase();
                let isPct = !nameLower.includes("acidente") && !nameLower.includes("cpt") && !nameLower.includes("spt");
                
                grouped[groupKey] = {
                    id: `${rowContrato}-${indName}`.toLowerCase().replace(/[^a-z0-9]/g, ""),
                    contrato: rowContrato,
                    localidade: localidadeSel,
                    scopeContrato: rowContrato,
                    scopeLocalidade: localidadeSel,
                    indicador: indName,
                    pilar: row.pilar,
                    grupo: row.grupo,
                    meta: row.meta || (isPct ? "97,0%" : "0"),
                    acumAnterior: null,
                    acumAtual: 0,
                    dados: new Array(12).fill(null),
                    metaDados: new Array(12).fill(0),
                    arrow: row.arrow || (nameLower.includes("acidente") || nameLower.includes("turnover") ? "down" : "up"),
                    isPercentage: isPct,
                    formula: row.formula || "Fórmula padrão",
                    comment: row.comment || "Comentário sobre o indicador:",
                    status: row.status || null,
                    icon: row.icon || null,
                    hasExcelData: true,
                    sourceRows: [],
                    
                    // Arrays auxiliares para consolidar múltiplos valores mensais (ex: múltiplas localidades)
                    monthlyRawValues: Array.from({ length: 12 }, () => []),
                    monthlyRawMetas: Array.from({ length: 12 }, () => [])
                };
            }

            grouped[groupKey].sourceRows.push(row);
            
            const isPct = grouped[groupKey].isPercentage;
            const valBase = parseValorDadosBase(row.dadosBase, isPct);
            if (valBase !== null) {
                grouped[groupKey].monthlyRawValues[row.mesIdx].push(valBase);
            }
            
            let metaNum = parseFloat(String(row.meta).replace("%", "").replace(",", ".").trim());
            if (!isNaN(metaNum)) {
                if (isPct && metaNum >= 0 && metaNum <= 1.5) {
                    metaNum = metaNum * 100;
                }
                grouped[groupKey].monthlyRawMetas[row.mesIdx].push(metaNum);
            }
        });
        
        const consolidatedList = Object.values(grouped);
        
        consolidatedList.forEach(ind => {
            const isAccidents = ind.indicador.toLowerCase().includes("acidente") || ind.indicador.toLowerCase().includes("cpt") || ind.indicador.toLowerCase().includes("spt");
            
            for (let m = 0; m < 12; m++) {
                // Consolida os dados mensais
                const vals = ind.monthlyRawValues[m];
                if (vals.length > 0) {
                    if (isAccidents) {
                        ind.dados[m] = vals.reduce((a, b) => a + b, 0); // Soma acidentes
                    } else {
                        ind.dados[m] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)); // Média de taxas
                    }
                }
                
                // Consolida metas mensais
                const metas = ind.monthlyRawMetas[m];
                if (metas.length > 0) {
                    ind.metaDados[m] = parseFloat((metas.reduce((a, b) => a + b, 0) / metas.length).toFixed(2));
                }
            }
            
            // Calcula o acumulado atual (média aritmética dos meses preenchidos)
            const validConsolidated = ind.dados.filter(v => v !== null);
            if (validConsolidated.length > 0) {
                if (isAccidents) {
                    ind.acumAtual = validConsolidated.reduce((a, b) => a + b, 0); // Soma para CPT/SPT
                } else {
                    ind.acumAtual = parseFloat((validConsolidated.reduce((a, b) => a + b, 0) / validConsolidated.length).toFixed(1)); // Média aritmética
                }
            } else {
                ind.acumAtual = 0;
            }
            
            // Formata a representação textual da Meta do indicador a partir do primeiro mês preenchido
            let metaRep = ind.meta;
            for (let m = 0; m < 12; m++) {
                const metas = ind.monthlyRawMetas[m];
                if (metas.length > 0) {
                    const avgMeta = metas.reduce((a, b) => a + b, 0) / metas.length;
                    metaRep = ind.isPercentage ? (avgMeta.toFixed(1).replace(".", ",") + "%") : String(avgMeta);
                    break;
                }
            }
            ind.meta = metaRep;
            
                        // Recupera acumulado anterior correspondente a partir da planilha de ano anterior
            const sourceWithOverride = ind.sourceRows.find(row =>
                Object.prototype.hasOwnProperty.call(row, "acumAnteriorOverride")
            );
            let oldAcum = sourceWithOverride
                ? sourceWithOverride.acumAnteriorOverride
                : null;
            if (AppState.excelDataAnterior && AppState.excelDataAnterior.length > 0) {
                const prevRows = oldAcum === null ? AppState.excelDataAnterior.filter(row => {
                    const matchContrato = row.contrato === ind.scopeContrato;
                    const matchLocalidade = ind.scopeLocalidade === "todos" || row.localidade === ind.scopeLocalidade;
                    return matchContrato && matchLocalidade && row.indicador === ind.indicador;
                }) : [];
                
                const prevVals = [];
                prevRows.forEach(row => {
                    const v = parseValorDadosBase(row.dadosBase, ind.isPercentage);
                    if (v !== null) prevVals.push(v);
                });
                
                if (prevVals.length > 0) {
                    if (isAccidents) {
                        oldAcum = prevVals.reduce((a, b) => a + b, 0);
                    } else {
                        oldAcum = parseFloat((prevVals.reduce((a, b) => a + b, 0) / prevVals.length).toFixed(1));
                    }
                }
            }
            
            if (oldAcum === null) {
                // Fallback
                const fallbackIdx = SLOT_INDICADORES.findIndex(slot => {
                    const nameLower = ind.indicador.toLowerCase();
                    return nameLower.includes(slot.key);
                });
                if (fallbackIdx !== -1 && AppState.indicadores[fallbackIdx]) {
                    oldAcum = AppState.indicadores[fallbackIdx].acum2025;
                }
            }
            
            ind.acumAnterior = oldAcum !== null ? oldAcum : 0;
        });
        
        return consolidatedList;
    }
    
    // Caso padrão (fallback sem planilha carregada, usando AppState.indicadores)
    return AppState.indicadores.map(ind => {
        if (!ind.indicador) ind.indicador = ind.title;
        return ind;
    });
}

function obterSetaSVG(direcao) {
    const isDown = direcao === "down";
    const cssClass = isDown ? "arrow-red" : "arrow-green";
    const path = isDown
        ? "M26 4H54V80H72L40 116L8 80H26Z"
        : "M40 4L72 40H54V116H26V40H8Z";

    return `<svg class="arrow-icon-svg ${cssClass}" viewBox="0 0 80 120" role="img" aria-label="${isDown ? "Tendência de queda" : "Tendência de alta"}"><path d="${path}"></path></svg>`;
}

function ehIndicadorAcidenteTrabalho(ind) {
    const nome = String(ind?.indicador || ind?.title || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    return nome.includes("acidentes do trabalho cpt") || nome.includes("acidentes do trabalho spt");
}

function obterDirecaoSetaGrafico(ind) {
    if (!ehIndicadorAcidenteTrabalho(ind)) return ind.arrow || "up";

    const acumulado = parseFloat(String(ind.acumAtual ?? 0).replace("%", "").replace(",", ".").trim());
    return !Number.isNaN(acumulado) && acumulado > 0 ? "down" : "up";
}

// Recria o HTML dos 6 slides de gráficos (IDs de slide-3 a slide-8 fixos)
function recriarSlidesGraficosDinamicamente(indicadoresFiltrados) {
    dynamicChartSlides.innerHTML = "";
    
    indicadoresFiltrados.forEach((ind, index) => {
        const slideIndex = index + 3; // Gráficos começam no slide 3, terminando no slide 8
        const id = `ind-${index}`;
        
        const slide = document.createElement("div");
        slide.className = `slide-container ${slideIndex === activeSlideIndex ? "active" : ""}`;
        slide.id = `slide-${slideIndex}`;
        slide.dataset.index = slideIndex;
        
        slide.innerHTML = `
            <h3 class="chart-slide-title">${ind.indicador}</h3>
            
            <div class="chart-slide-body">
                <div class="chart-container-wrapper">
                    <canvas id="chart-canvas-${id}"></canvas>
                </div>
                
                <div class="direction-arrow-wrapper">
                    <button class="btn-toggle-arrow edit-only-inline" data-id="${id}" title="Alternar direção da seta (Meta)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="swap-icon"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                    </button>
                    <div class="direction-arrow" id="chart-arrow-${id}"></div>
                </div>
            </div>
            
            <div class="chart-metadata-box">
                <div class="meta-box-item">
                    <span class="meta-box-label">Meta:</span>
                    <span class="meta-box-value editable-text" data-id="${id}" data-type="meta" contenteditable="${modoEdicao}">${ind.meta}</span>
                </div>
                <div class="meta-box-item">
                    <span class="meta-box-label">Fórmula de Cálculo:</span>
                    <span class="meta-box-value editable-text" data-id="${id}" data-type="formula" contenteditable="${modoEdicao}">${ind.formula || "Fórmula padrão"}</span>
                </div>
                <div class="meta-box-comment ${(!ind.comment || ind.comment.trim() === "" || ind.comment.replace(/<[^>]*>?/gm, "").trim() === "Comentário sobre o indicador:") ? "empty-comment" : ""}">
                    <span class="meta-box-label">Comentário sobre o indicador:</span>
                    <div class="meta-box-textarea editable-text" data-id="${id}" data-type="comment" contenteditable="${modoEdicao}" placeholder="Digite seu comentário aqui...">${ind.comment || "Comentário sobre o indicador:"}</div>
                </div>
            </div>
            
            <div class="chart-logo-footer">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA5YAAAGBCAYAAAAdRy50AAAQAElEQVR4Aey9XYxc1ZnvvTJIHDwiceNXiUA2somIFOAwNLnwGXPTHY44WOTCbRx4JXNBG8PVgCjDMHpHGtltK9KMJkNcKM4VdigubGkgtpuLJE6iQ9o3eOIL3MDLhwTCtsaWUVCMHdCYg4Ry6l920V/VXXvXXnvt9az9Q2x31a6113qe36qP/d/Ps579V3/hPwhAAAIQgAAEIAABCEAAAhCAQAECf+X4zwABTIQABCAAAQhAAAIQgAAEIBAvAYRlvHODZdYIYC8EIAABCEAAAhCAAARqSgBhWdOJx20I1JUAfkMAAhCAAAQgAAEI+CeAsPTPlB4hAAEIQKAYAY6GAAQgAAEIQMAYAYSlsQnDXAhAAAIQgEAcBLACAhCAAAQgMEMAYTnDgkcQgAAEIAABCEAgLQJ4AwEIQCAQAYRlINAMAwEIQAACEIAABCAAgV4E2AeBFAggLFOYRXyAAAQgAAEIQAACEIAABMokQN99CCAs+wDiZQhAAAIQgAAEIAABCEAAAhBYmkAcwnJpG3kVAhCAAAQgAAEIQAACEIAABCImgLCMeHJiMw17IAABCEAAAhCAAAQgAAEI9CKAsOxFhX0QsEsAyyEAAQhAAAIQgAAEIBCcAMIyOHIGhAAEIAABCEAAAhCAAAQgkBYBhGVa84k3EIAABCDgiwD9QAACEIAABCCQmQDCMjMqGkIAAhCAAAQgEBsB7IEABCAAgTgIICzjmAçõ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" alt="MRO Logo">
            </div>
            
            <button class="btn-edit-data edit-only-block" data-id="${id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M3 3v18h18"></path><rect x="7" y="10" width="4" height="7"></rect><rect x="13" y="5" width="4" height="12"></rect></svg>
                Editar Valores do Gráfico
            </button>
        `;
        
        dynamicChartSlides.appendChild(slide);

        // Mantém a logo incorporada no documento para não contaminar o canvas
        // usado nas exportações de PDF e PowerPoint.
        prepararLogosMro(slide).catch(error => console.error("Erro ao preparar logo MRO:", error));
        
        // Renderiza a seta
        const arrowDiv = slide.querySelector(`#chart-arrow-${id}`);
        ind.arrow = obterDirecaoSetaGrafico(ind);
        arrowDiv.innerHTML = obterSetaSVG(ind.arrow);
        
        // Seta click event listener
        slide.querySelector(".btn-toggle-arrow").addEventListener("click", () => {
            ind.arrow = ehIndicadorAcidenteTrabalho(ind)
                ? obterDirecaoSetaGrafico(ind)
                : (ind.arrow === "up" ? "down" : "up");
            arrowDiv.innerHTML = obterSetaSVG(ind.arrow);
            sincronizarMetadadosIndicador(ind);
        });
        
        // Edit button listener
        slide.querySelector(".btn-edit-data").addEventListener("click", () => {
            abrirModalDadosIndicadorFiltrado(ind, id);
        });
        
        // Blur edit text boxes
        slide.querySelectorAll(".editable-text").forEach(box => {
            box.addEventListener("blur", (e) => {
                                const type = e.target.dataset.type;
                ind[type] = e.target.innerHTML;
                if (type === 'comment') {
                    const isEmpty = (!ind.comment || ind.comment.trim() === '' || ind.comment.replace(/<[^>]*>?/gm, '').trim() === 'Comentário sobre o indicador:');
                    const parent = e.target.closest('.meta-box-comment');
                    if (parent) parent.classList.toggle('empty-comment', isEmpty);
                }
                sincronizarMetadadosIndicador(ind);
            });
        });
        
        // Renderiza o gráfico Chart.js
        const canvas = slide.querySelector(`#chart-canvas-${id}`);
        
        // Configura labelsX e datasets
        const labelsX = [`ACUM\n${AppState.anoAnterior || 2025}`,  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ", `ACUM\n${AppState.anoAtual || 2026}`];
        
        let metaValNum = 0;
        const parsedMeta = parseFloat(String(ind.meta).replace("%", "").replace(",", ".").trim());
        if (!isNaN(parsedMeta)) {
            metaValNum = parsedMeta;
        }
        
        const lineDataset = {
            label: "DADOS BASE",
            data: [null, ...ind.dados, null], // ACUM 2025 e 2026 são barras, linha fica isolada no meio
            borderColor: "#00b080",
            backgroundColor: "#00b080",
            borderWidth: 3.5,
            pointRadius: 4,
            tension: 0.2,
            type: "line",
            yAxisID: "y"
        };
        
        const metaDataset = {
            label: `META (${ind.meta})`,
            data: [
                null, // ACUM 2025 é nulo
                ...new Array(12).fill(metaValNum), // JAN a DEZ têm a meta
                null // ACUM 2026 é nulo
            ],
            borderColor: "#8b5cf6",
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            type: "line",
            yAxisID: "y"
        };
        
        const barDataset = {
            label: "ACUMULADO",
            data: new Array(14).fill(null),
            backgroundColor: "#7c3aed",
            borderColor: "#7c3aed",
            borderWidth: 1,
            barThickness: 32,
            type: "bar",
            yAxisID: "y"
        };
        const normalizarAcumuladoGrafico = valor => {
            if (valor === null || valor === undefined || valor === "") return null;
            const numero = parseFloat(String(valor).replace("%", "").replace(",", ".").trim());
            return Number.isNaN(numero) ? valor : numero;
        };
        // O valor zero precisa permanecer no dataset para que o ChartDataLabels
        // desenhe o rótulo "0" acima da posição do acumulado.
        barDataset.data[0] = normalizarAcumuladoGrafico(ind.acumAnterior);
        barDataset.data[13] = normalizarAcumuladoGrafico(ind.acumAtual);
        
        const chart = new Chart(canvas, {
            plugins: [ChartDataLabels],
            data: {
                labels: labelsX,
                datasets: [lineDataset, metaDataset, barDataset]
            },
            options: {
                devicePixelRatio: 3,
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                    padding: {
                        top: 24
                    }
                },
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let value = context.raw;
                                if (value === null || value === undefined) return '';
                                return context.dataset.label + ": " + formatarUmaCasaDecimal(value, ind.isPercentage);
                            }
                        }
                    },
                    datalabels: {
                        anchor: "end",
                        align: "top",
                        offset: 4,
                        color: "#475569",
                        font: {
                            family: "Inter",
                            size: 10,
                            weight: "bold"
                        },
                        formatter: function(value, context) {
                            if (value === null || value === undefined) return "";
                            if (context.datasetIndex === 1) {
                                return "";
                            }
                            return formatarUmaCasaDecimal(value, ind.isPercentage);
                        }
                    }
                },
                scales: {
                  y: {
                        beginAtZero: true,
                        grace: "10%",
                    suggestedMax: ind.isPercentage ? 100 : 1,
                          ticks: {
                              callback: function(value) {
                                  return formatarUmaCasaDecimal(value, ind.isPercentage);
                              }
                          }
                      },
                      x: {
                          grid: {
                              display: false,
                              drawOnChartArea: false,
                              drawTicks: false
                          }
                      }
                  }
            }
        });
        
        chartInstances[id] = chart;
    });
    
    // Atualiza os IDs e data-indexes dos slides estáticos subsequentes no DOM
    const N = indicadoresFiltrados.length;
    const slideAcoes = document.querySelector(".slide-container#slide-9, .slide-container[data-static='acoes']");
    const slideCrono1 = document.querySelector(".slide-container#slide-10, .slide-container[data-static='crono1']");
    const slideCrono2 = document.querySelector(".slide-container#slide-11, .slide-container[data-static='crono2']");
    
    if (slideAcoes) {
        slideAcoes.setAttribute("data-static", "acoes");
        slideAcoes.id = `slide-${3 + N}`;
        slideAcoes.dataset.index = 3 + N;
    }
    if (slideCrono1) {
        slideCrono1.setAttribute("data-static", "crono1");
        slideCrono1.id = `slide-${4 + N}`;
        slideCrono1.dataset.index = 4 + N;
    }
    if (slideCrono2) {
        slideCrono2.setAttribute("data-static", "crono2");
        slideCrono2.id = `slide-${5 + N}`;
        slideCrono2.dataset.index = 5 + N;
    }
    
    // Atualiza sidebar para manter o foco e títulos corretos
    renderizarMenuSlides();
    atualizarModoUI();
}

const editableListSources = new Map();

function syncEditableList(key, values) {
    if (Object.prototype.hasOwnProperty.call(AppState, key)) {
        AppState[key] = values;
    }

    if (key === "direcionadoresAcoes") {
        AppState.acoes = AppState.acoes || {};
        AppState.acoes.direcionadoresAcoes = values;
    }

    const contrato = AppState.contrato || "CBO";
    if (AppState.dadosContratos && AppState.dadosContratos[contrato] && key !== "direcionadoresAcoes") {
        AppState.dadosContratos[contrato][key] = values;
    }
}

function ensureAddItemButton(card, buttonId, onClick) {
    if (!card) return;
    let button = card.querySelector(`#${buttonId}`);
    if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.id = buttonId;
        button.className = "btn-add-bullet";
        button.innerHTML = '<span aria-hidden="true">+</span> Adicionar item';
        button.addEventListener("click", (event) => {
            // No One Page, o controle permanece visível também na visualização.
            // Ao usá-lo, ativa a edição existente antes de incluir o item.
            if (card.closest("#slide-2") && !modoEdicao) {
                modoEdicao = true;
                if (typeof btnToggleEdit !== "undefined" && btnToggleEdit) {
                    btnToggleEdit.classList.add("active");
                }
                atualizarModoUI();
            }
            onClick(event);
        });
        card.appendChild(button);
    }
}

function renderList(listId, dataArray) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    const key = listEl.dataset.key;
    const values = Array.isArray(dataArray) ? dataArray : [];
    editableListSources.set(listId, values);
    listEl.replaceChildren();

    // No One Page, cards sem comentários permanecem visualmente em branco.
    // Outras telas continuam usando o aviso de lista vazia existente.
    if (values.length === 0 && !listEl.closest("#slide-2")) {
        const placeholder = document.createElement("li");
        placeholder.className = "empty-list-placeholder italic";
        placeholder.textContent = "Nenhum item adicionado.";
        listEl.appendChild(placeholder);
    }

    values.forEach((item, index) => {
        const li = document.createElement("li");
        const text = document.createElement("span");
        text.className = "editable-text onepage-list-text";
        text.contentEditable = modoEdicao ? "true" : "false";
        text.textContent = item;
        text.addEventListener("blur", () => {
            values[index] = text.textContent.trim() || "Novo item";
            syncEditableList(key, values);
            salvarDados();
            autoFitCompact();
        });

        const actions = document.createElement("span");
        actions.className = "bullet-actions";
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn-bullet btn-del-bullet";
        removeButton.title = "Excluir item";
        removeButton.setAttribute("aria-label", "Excluir item");
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => {
            if (!modoEdicao) return;
            values.splice(index, 1);
            syncEditableList(key, values);
            salvarDados();
            renderList(listId, values);
            autoFitCompact();
        });
        actions.appendChild(removeButton);
        li.append(text, actions);
        listEl.appendChild(li);
    });

    ensureAddItemButton(listEl.closest(".card"), `btn-add-item-${listId}`, () => {
        if (!modoEdicao) return;
        const currentValues = editableListSources.get(listId);
        if (!Array.isArray(currentValues)) return;
        currentValues.push("Novo item");
        syncEditableList(key, currentValues);
        salvarDados();
        renderList(listId, currentValues);
        const newItem = listEl.querySelector("li:last-child .onepage-list-text");
        if (newItem) newItem.focus();
        autoFitCompact();
    });
}

function renderTabelaSLAs() {
    const tbody = document.querySelector("#table-slas tbody");
    if (!tbody) return;

    tbody.replaceChildren();
    (AppState.slas || []).forEach((item, index) => {
        const row = document.createElement("tr");
        const status = ["green", "yellow", "red"].includes(item.status) ? item.status : "green";
        row.className = `row-status-${status}`;

        const nome = document.createElement("td");
        const nomeText = document.createElement("span");
        nomeText.className = "editable-text";
        nomeText.contentEditable = modoEdicao ? "true" : "false";
        nomeText.textContent = item.sla || "";
        nomeText.addEventListener("blur", () => window.updateSlaField(index, "sla", nomeText.textContent));
        nome.appendChild(nomeText);
        row.appendChild(nome);

        [
            ["meta", item.meta],
            ["atual", item.atual],
            ["m1", item.m1],
            ["acumulado", item.acumulado]
        ].forEach(([field, value]) => {
            const cell = document.createElement("td");
            cell.dataset.field = field;
            const valueText = document.createElement("span");
            valueText.className = "editable-text";
            valueText.contentEditable = modoEdicao ? "true" : "false";
            valueText.textContent = value ?? "-";
            valueText.addEventListener("blur", () => window.updateSlaField(index, field, valueText.textContent));
            cell.appendChild(valueText);
            const hasUpTrend = typeof item.trendArrow === "string" && item.trendArrow.includes("trend-up");
            const hasDownTrend = typeof item.trendArrow === "string" && item.trendArrow.includes("trend-down");
            if (field === "atual") {
                const trend = document.createElement("span");
                trend.className = hasUpTrend ? "trend-arrow trend-up" : hasDownTrend ? "trend-arrow trend-down" : "trend-arrow trend-dash";
                trend.textContent = hasUpTrend ? " ↑" : hasDownTrend ? " ↓" : " −";
                cell.appendChild(trend);
            }
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        statusCell.className = "status-dot-cell";
        const statusWrapper = document.createElement("div");
        statusWrapper.className = "status-dot-wrapper";
        const statusButton = document.createElement("button");
        statusButton.type = "button";
        statusButton.className = "status-dot-button";
        statusButton.title = "Alterar status";
        statusButton.setAttribute("aria-label", "Alterar status");
        statusButton.addEventListener("click", () => window.toggleSlaStatus(index));
        const dot = document.createElement("span");
        dot.className = `dot dot-${status}`;
        dot.title = status === "green" ? "Dentro da meta" : status === "yellow" ? "Atenção" : "Ação imediata";
        statusButton.appendChild(dot);

        const orderControls = document.createElement("span");
        orderControls.className = "sla-order-controls edit-only-inline";

        const moveUpButton = document.createElement("button");
        moveUpButton.type = "button";
        moveUpButton.className = "sla-order-button";
        moveUpButton.title = "Mover indicador para cima";
        moveUpButton.setAttribute("aria-label", "Mover indicador para cima");
        moveUpButton.textContent = "↑";
        moveUpButton.disabled = index === 0;
        moveUpButton.addEventListener("click", () => window.moveSlaIndicator(index, -1));

        const moveDownButton = document.createElement("button");
        moveDownButton.type = "button";
        moveDownButton.className = "sla-order-button";
        moveDownButton.title = "Mover indicador para baixo";
        moveDownButton.setAttribute("aria-label", "Mover indicador para baixo");
        moveDownButton.textContent = "↓";
        moveDownButton.disabled = index === (AppState.slas || []).length - 1;
        moveDownButton.addEventListener("click", () => window.moveSlaIndicator(index, 1));

        orderControls.append(moveUpButton, moveDownButton);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn-del-sla-row";
        removeButton.title = "Excluir indicador";
        removeButton.setAttribute("aria-label", "Excluir indicador");
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => window.removeSlaIndicator(index));
        statusWrapper.append(statusButton, orderControls, removeButton);
        statusCell.appendChild(statusWrapper);
        row.appendChild(statusCell);
        tbody.appendChild(row);
    });

    ensureAddItemButton(document.querySelector("#slide-2 .card-slas"), "btn-add-item-slas", window.addSlaIndicator);
}

window.updateSlaField = function(index, field, value) {
    if (!AppState.slas || !AppState.slas[index]) return;
    AppState.slas[index][field] = value.trim() || "-";
    salvarDados();
    renderTabelaSLAs();
};

window.toggleSlaStatus = function(index) {
    if (!modoEdicao || !AppState.slas || !AppState.slas[index]) return;
    const current = AppState.slas[index].status;
    AppState.slas[index].status = current === "green" ? "yellow" : current === "yellow" ? "red" : "green";
    salvarDados();
    renderTabelaSLAs();
};

window.addSlaIndicator = function() {
    if (!modoEdicao) return;
    AppState.slas = Array.isArray(AppState.slas) ? AppState.slas : [];
    AppState.slas.push({ sla: "Novo indicador", meta: "-", atual: "-", m1: "-", acumulado: "-", trendArrow: "-", status: "yellow", icon: "default" });
    salvarDados();
    renderTabelaSLAs();
    const newIndicator = document.querySelector("#table-slas tbody tr:last-child td:first-child .editable-text");
    if (newIndicator) newIndicator.focus();
    autoFitCompact();
};

window.removeSlaIndicator = function(index) {
    if (!modoEdicao || !AppState.slas) return;
    AppState.slas.splice(index, 1);
    salvarDados();
    renderTabelaSLAs();
    autoFitCompact();
};

window.moveSlaIndicator = function(index, direction) {
    if (!modoEdicao || !Array.isArray(AppState.slas)) return;
    const destination = index + direction;
    if (index < 0 || destination < 0 || index >= AppState.slas.length || destination >= AppState.slas.length) return;

    [AppState.slas[index], AppState.slas[destination]] = [AppState.slas[destination], AppState.slas[index]];
    salvarDados();
    renderTabelaSLAs();
    autoFitCompact();

    const movedRow = document.querySelector(`#table-slas tbody tr:nth-child(${destination + 1})`);
    if (movedRow) movedRow.classList.add("sla-row-moved");
};

// Atualiza a tabela do slide 2 (SLA) a partir das linhas do Excel filtradas
function atualizarSlasComDadosExcel(dadosFiltrados) {
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
        renderTabelaSLAs();
        return;
    }
    
    // Limpa a lista atual e substitui pelas novas SLAs
    AppState.slas = dadosFiltrados.map(ind => {
        // Encontra o último mês preenchido (mês atual)
        let mesAtualVal = "-";
        let m1Val = "-";
        
        let refMesIdx = obterIndicePeriodoAtivo();
        
        // Se encontramos o mês do período ativo e ele tem dados, usamos ele
        if (refMesIdx >= 0 && refMesIdx < 12 && ind.dados[refMesIdx] !== null && ind.dados[refMesIdx] !== undefined) {
            mesAtualVal = formatarUmaCasaDecimal(ind.dados[refMesIdx], ind.isPercentage);
            if (refMesIdx > 0 && ind.dados[refMesIdx - 1] !== null && ind.dados[refMesIdx - 1] !== undefined) {
                m1Val = formatarUmaCasaDecimal(ind.dados[refMesIdx - 1], ind.isPercentage);
            }
        } else {
            // Caso contrário, fazemos a busca regressiva (começando do refMesIdx ou de 11)
            const startIdx = (refMesIdx >= 0 && refMesIdx < 12) ? refMesIdx : 11;
            for (let i = startIdx; i >= 0; i--) {
                if (ind.dados[i] !== null && ind.dados[i] !== undefined) {
                    mesAtualVal = formatarUmaCasaDecimal(ind.dados[i], ind.isPercentage);
                    if (i > 0 && ind.dados[i - 1] !== null && ind.dados[i - 1] !== undefined) {
                        m1Val = formatarUmaCasaDecimal(ind.dados[i - 1], ind.isPercentage);
                    }
                    break;
                }
            }
        }
        
        // Tenta associar ícones a palavras chave
        let iconType = "default";
        if (ind.indicador.toLowerCase().includes("acidente")) iconType = "warning";
        else if (ind.indicador.toLowerCase().includes("recebimento") || ind.indicador.toLowerCase().includes("ofr") || ind.indicador.toLowerCase().includes("qi")) iconType = "target";
        
                // Item 1: Seta de tendência (Mês Atual vs M-1)
        let trendArrow = "-";
        const curValStr = String(mesAtualVal).replace("%", "").replace(",", ".").trim();
        const m1ValStr = String(m1Val).replace("%", "").replace(",", ".").trim();
        const curNum = parseFloat(curValStr);
        const m1Num = parseFloat(m1ValStr);
        
        if (!isNaN(curNum) && !isNaN(m1Num)) {
            if (curNum === m1Num) {
                trendArrow = "-";
            } else {
                const curIsHigher = curNum > m1Num;
                const higherIsBetter = (ind.arrow !== "down");
                if (curIsHigher === higherIsBetter) {
                    trendArrow = '<span class="trend-arrow trend-up">↑</span>';
                } else {
                    trendArrow = '<span class="trend-arrow trend-down">↓</span>';
                }
            }
        } else {
            trendArrow = "";
        }

        // Item 3: Status baseado no Mês Atual e Acumulado
        let status = "green";
        const metaValStr = String(ind.meta).replace("%", "").replace(",", ".").trim();
        const acumValStr = String(ind.acumAtual).replace("%", "").replace(",", ".").trim();
        const metaNum = parseFloat(metaValStr);
        const acumNum = parseFloat(acumValStr);
        
        if (!isNaN(metaNum)) {
            const higherIsBetter = (ind.arrow !== "down");
            
            function meetsTarget(v) {
                if (isNaN(v)) return true;
                if (higherIsBetter) return v >= metaNum;
                return v <= metaNum;
            }
            
            const curMeets = meetsTarget(curNum);
            const acumMeets = meetsTarget(acumNum);
            
            if (curMeets && acumMeets) {
                status = "green";
            } else if (curMeets && !acumMeets) {
                status = "yellow";
            } else if (!curMeets && acumMeets) {
                status = "yellow";
            } else {
                status = "red";
            }
        }
        
        // Item 4: Override manual de cor
        let hasOverride = false;
        if (ind.status) { // Usa a prop gravada quando o usuário clica manualmente
            status = ind.status;
            hasOverride = true;
        }
        
        let metaText = formatarUmaCasaDecimal(ind.meta, ind.isPercentage);
        let acumuladoText = formatarUmaCasaDecimal(ind.acumAtual, ind.isPercentage);
        
        return {
            sla: ind.indicador,
            meta: metaText,
            atual: mesAtualVal, trendArrow: trendArrow,
            m1: m1Val || "-",
            acumulado: acumuladoText,
            status: status,
            icon: iconType,
            hasOverride: hasOverride
        };
    });
    
    renderTabelaSLAs();
}

function fecharModalGrafico() {
    if (chartDataModal) chartDataModal.classList.remove("active");
    currentModalIndicator = null;
    currentModalChartId = null;
}

function salvarValoresModalGrafico() {
    const ind = currentModalIndicator;
    if (!ind || !chartDataModal?.classList.contains("active")) return;

    const valAcumAnterior = document.getElementById("modal-val-acum2025")?.value ?? "";
    ind.acumAnterior = valAcumAnterior !== "" ? parseFloat(valAcumAnterior) : null;

    const valAcumAtual = document.getElementById("modal-val-acum2026")?.value ?? "";
    ind.acumAtual = valAcumAtual !== "" ? parseFloat(valAcumAtual) : 0;

    modalDataTbody.querySelectorAll(".modal-month-val").forEach(input => {
        const mIdx = parseInt(input.dataset.month, 10);
        ind.dados[mIdx] = input.value !== "" ? parseFloat(input.value) : null;
    });

    modalDataTbody.querySelectorAll(".modal-month-meta").forEach(input => {
        const mIdx = parseInt(input.dataset.month, 10);
        ind.metaDados[mIdx] = input.value !== "" ? parseFloat(input.value) : 0;
    });

    sincronizarValoresGrafico(ind);
    fecharModalGrafico();
    atualizarDashboardECartas();
}

// Abre o modal de edição de valores do gráfico para um indicador filtrado do Excel
function abrirModalDadosIndicadorFiltrado(ind, id) {
    currentModalIndicator = ind;
    currentModalChartId = id;
    
    modalIndicatorTitle.textContent = `Editar Valores — ${ind.indicador}`;
    modalDataTbody.innerHTML = "";
    
    // Linha ACUM anterior
    let tr = document.createElement("tr");
    tr.innerHTML = `
        <td><strong>ACUM anterior</strong></td>
        <td><input type="number" step="any" id="modal-val-acum2025" value="${ind.acumAnterior !== null ? ind.acumAnterior : ''}"></td>
        <td>-</td>
    `;
    modalDataTbody.appendChild(tr);
    
    // JAN a DEZ
    ind.dados.forEach((val, mIdx) => {
        tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${MESES[mIdx]}</strong></td>
            <td><input type="number" step="any" class="modal-month-val" data-month="${mIdx}" value="${val !== null ? val : ''}"></td>
            <td><input type="number" step="any" class="modal-month-meta" data-month="${mIdx}" value="${ind.metaDados[mIdx] !== null ? ind.metaDados[mIdx] : ''}"></td>
        `;
        modalDataTbody.appendChild(tr);
    });
    
    // ACUM atual
    tr = document.createElement("tr");
    tr.innerHTML = `
        <td><strong>ACUM atual</strong></td>
        <td><input type="number" step="any" id="modal-val-acum2026" value="${ind.acumAtual !== null ? ind.acumAtual : ''}"></td>
        <td>-</td>
    `;
    modalDataTbody.appendChild(tr);
    
    chartDataModal.classList.add("active");
}

// Processa o Upload do arquivo Excel
function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validação exclusiva de formato Excel
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        alert("Por favor, selecione exclusivamente arquivos nos formatos do Excel (.xlsx ou .xls).");
        excelFileInput.value = "";
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Pega a primeira aba
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            processExcelData(jsonData);
        } catch (err) {
            alert("Erro ao ler ou processar o arquivo Excel. Detalhes: " + err.message);
            excelFileInput.value = "";
        }
    };
    reader.readAsArrayBuffer(file);
}

// Analisa a matriz de dados do Excel (Long/Tidy format) e preenche o AppState

function handleExcelUploadAnterior(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        alert("Por favor, selecione exclusivamente arquivos nos formatos do Excel (.xlsx ou .xls).");
        excelFileInputAnterior.value = "";
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            processExcelDataAnterior(jsonData);
        } catch (err) {
            alert("Erro ao ler ou processar o arquivo Excel do ano anterior. Detalhes: " + err.message);
            excelFileInputAnterior.value = "";
        }
    };
    reader.readAsArrayBuffer(file);
}

function processExcelDataAnterior(matrix) {
    if (!matrix || matrix.length < 2) {
        alert("A planilha Excel do ano anterior parece vazia ou inválida.");
        return;
    }
    
    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(10, matrix.length); r++) {
        const row = matrix[r];
        if (row && row.some(cell => cell && (cell.toString().toLowerCase().trim().includes("indicador") || cell.toString().toLowerCase().trim().includes("cliente") || cell.toString().toLowerCase().trim().includes("localidade")))) {
            headerRowIdx = r;
            break;
        }
    }
    
    const header = matrix[headerRowIdx];
    
    let idxLocalidade = header.findIndex(h => h && h.toString().toLowerCase().trim().includes("localidade"));
    let idxCliente = header.findIndex(h => h && (h.toString().toLowerCase().trim().includes("cliente") || h.toString().toLowerCase().trim().includes("contrato")));
    let idxIndicador = header.findIndex(h => h && (h.toString().toLowerCase().trim().includes("indicador") || h.toString().toLowerCase().trim().includes("kpi") || h.toString().toLowerCase().trim().includes("sla")));
    let idxMes = header.findIndex(h => h && (h.toString().toLowerCase().trim().includes("mês") || h.toString().toLowerCase().trim().includes("mes")));
    let idxDadosBase = header.findIndex(h => h && (h.toString().toLowerCase().trim().includes("dados base") || h.toString().toLowerCase().trim().includes("dados_base") || h.toString().toLowerCase().trim().includes("resultado")));
    
    if (idxLocalidade === -1) idxLocalidade = 0;
    if (idxCliente === -1) idxCliente = 1;
    if (idxIndicador === -1) idxIndicador = 4;
    if (idxMes === -1) idxMes = 5;
    if (idxDadosBase === -1) idxDadosBase = 6;
    
    const parsedRows = [];
    
    for (let r = headerRowIdx + 1; r < matrix.length; r++) {
        const row = matrix[r];
        if (!row || row.length === 0 || !row[idxIndicador] || !row[idxMes]) continue;
        
        parsedRows.push({
            localidade: String(row[idxLocalidade]).trim(),
            contrato: String(row[idxCliente]).trim(),
            indicador: String(row[idxIndicador]).trim(),
            dadosBase: row[idxDadosBase]
        });
    }
    
    AppState.excelDataAnterior = parsedRows;
    salvarDados();
    alert("Base do ano anterior carregada com sucesso! Atualize os gráficos para visualizar.");
}

function processExcelData(matrix) {
    if(typeof validateAndPreviewExcel === 'function') {
        validateAndPreviewExcel(matrix);
    } else {
        alert('M�dulo de valida��o Supabase n�o carregado.');
    }
}

// Aplica na interface exatamente os registros que acabaram de ser persistidos.
// Assim os slides não dependem de uma segunda consulta ao Supabase para aparecer.
window.aplicarRegistrosImportados = function(records) {
    if (!Array.isArray(records) || records.length === 0) return;

    AppState.excelData = records.map(record => ({
        localidade: record.localidade,
        contrato: record.cliente,
        pilar: record.pilar,
        grupo: record.grupo,
        indicador: record.indicador,
        mesIdx: Math.max(0, parseInt(record.competencia.split('/')[0], 10) - 1),
        dadosBase: record.dados_base,
        meta: record.meta,
        formula: record.formula_calculo
    }));

    const contratos = [...new Set(records.map(record => record.cliente))];
    contratos.forEach(contrato => {
        if (!AppState.dadosContratos?.[contrato]) {
            AppState.contrato = contrato;
            sincronizarDadosContratoAtivo();
        }
    });

    const contratoInicial = records[0].cliente;
    const competenciaInicial = typeof obterUltimaCompetenciaImportada === "function"
        ? (obterUltimaCompetenciaImportada(records) || records[0].competencia)
        : records.reduce((ultima, record) => {
            const [mesAtual, anoAtual] = String(record.competencia || "").split('/').map(Number);
            const [mesUltimo, anoUltimo] = String(ultima || "").split('/').map(Number);
            return anoAtual * 12 + mesAtual > anoUltimo * 12 + mesUltimo ? record.competencia : ultima;
        }, records[0].competencia);
    AppState.contrato = contratoInicial;
    const [mes, ano] = competenciaInicial.split('/');
    const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    AppState.periodo = `${nomesMeses[parseInt(mes, 10) - 1]}/${ano}`;
    AppState.anoAtual = ano;
    if (cfgAnoAtual) cfgAnoAtual.value = ano;

    filterContrato.innerHTML = '<option value="todos">Todos os contratos</option>';
    contratos.forEach(contrato => {
        const option = document.createElement('option');
        option.value = contrato;
        option.textContent = contrato;
        filterContrato.appendChild(option);
    });
    filterContrato.value = contratoInicial;

    sincronizarDadosContratoAtivo();
    atualizarFiltrosLocalidade();
    salvarDados();
    atualizarDashboardECartas();
    selecionarSlide(1);
};
    
    // Carrega os dados de simulação (Mock) no exato formato transacional da imagem
function carregarMockDadosPlanilha() {
    const mockExcelRows = [
        ["Localidade", "Cliente", "Pilar", "Grupo", "Indicador", "Mês", "Dados Base", "Meta", "Fórmula de Cálculo"],
        
        // Enel CE - OFR (Janeiro a Julho)
        ["Fortaleza", "Enel CE", "Processos", "Expedição", "Order Fill Rate (OFR)", "01/01/2026", 0.61, "97,0%", "Pedidos entregues OTIF / Total de pedidos"],
        ["Fortaleza", "Enel CE", "Processos", "Expedição", "Order Fill Rate (OFR)", "01/02/2026", 0.106, "97,0%", "Pedidos entregues OTIF / Total de pedidos"],
        ["Fortaleza", "Enel CE", "Processos", "Expedição", "Order Fill Rate (OFR)", "01/03/2026", 0.114, "97,0%", "Pedidos entregues OTIF / Total de pedidos"],
        ["Fortaleza", "Enel CE", "Processos", "Expedição", "Order Fill Rate (OFR)", "01/04/2026", 0.183, "97,0%", "Pedidos entregues OTIF / Total de pedidos"],
        ["Fortaleza", "Enel CE", "Processos", "Expedição", "Order Fill Rate (OFR)", "01/05/2026", 0.239, "97,0%", "Pedidos entregues OTIF / Total de pedidos"],
        ["Fortaleza", "Enel CE", "Processos", "Expedição", "Order Fill Rate (OFR)", "01/06/2026", 0.172, "97,0%", "Pedidos entregues OTIF / Total de pedidos"],
        ["Fortaleza", "Enel CE", "Processos", "Expedição", "Order Fill Rate (OFR)", "01/07/2026", 0.317, "97,0%", "Pedidos entregues OTIF / Total de pedidos"],
        
        // Enel CE - QI (Janeiro a Julho)
        ["Fortaleza", "Enel CE", "Processos", "Recebimento", "Quality Inbound (QI)", "01/01/2026", 1.0, "99,0%", "Total de recebimentos no prazo / total realizado"],
        ["Fortaleza", "Enel CE", "Processos", "Recebimento", "Quality Inbound (QI)", "01/02/2026", 1.0, "99,0%", "Total de recebimentos no prazo / total realizado"],
        ["Fortaleza", "Enel CE", "Processos", "Recebimento", "Quality Inbound (QI)", "01/03/2026", 0.985, "99,0%", "Total de recebimentos no prazo / total realizado"],
        ["Fortaleza", "Enel CE", "Processos", "Recebimento", "Quality Inbound (QI)", "01/04/2026", 0.994, "99,0%", "Total de recebimentos no prazo / total realizado"],
        ["Fortaleza", "Enel CE", "Processos", "Recebimento", "Quality Inbound (QI)", "01/05/2026", 1.0, "99,0%", "Total de recebimentos no prazo / total realizado"],
        ["Fortaleza", "Enel CE", "Processos", "Recebimento", "Quality Inbound (QI)", "01/06/2026", 1.0, "99,0%", "Total de recebimentos no prazo / total realizado"],
        ["Fortaleza", "Enel CE", "Processos", "Recebimento", "Quality Inbound (QI)", "01/07/2026", 0.997, "99,0%", "Total de recebimentos no prazo / total realizado"],
        
        // Enel CE - CPT (Janeiro a Julho)
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho CPT", "01/01/2026", 0, "0", "Nº de Acidentes CPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho CPT", "01/02/2026", 0, "0", "Nº de Acidentes CPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho CPT", "01/03/2026", 0, "0", "Nº de Acidentes CPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho CPT", "01/04/2026", 0, "0", "Nº de Acidentes CPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho CPT", "01/05/2026", 0, "0", "Nº de Acidentes CPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho CPT", "01/06/2026", 0, "0", "Nº de Acidentes CPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho CPT", "01/07/2026", 0, "0", "Nº de Acidentes CPT"],

        // Enel CE - SPT (Janeiro a Julho)
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho SPT", "01/01/2026", 0, "0", "Nº de Acidentes SPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho SPT", "01/02/2026", 0, "0", "Nº de Acidentes SPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho SPT", "01/03/2026", 0, "0", "Nº de Acidentes SPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho SPT", "01/04/2026", 0, "0", "Nº de Acidentes SPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho SPT", "01/05/2026", 0, "0", "Nº de Acidentes SPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho SPT", "01/06/2026", 0, "0", "Nº de Acidentes SPT"],
        ["Fortaleza", "Enel CE", "SMS", "Saúde Ocupacional", "Acidentes do Trabalho SPT", "01/07/2026", 0, "0", "Nº de Acidentes SPT"],

        // Enel CE - Descarga
        ["Fortaleza", "Enel CE", "Processos", "Operação", "Nível de Serviço de Descarga", "01/05/2026", 1.0, "100,0%", "Percentual de Descargas no Prazo"],
        ["Fortaleza", "Enel CE", "Processos", "Operação", "Nível de Serviço de Descarga", "01/06/2026", 1.0, "100,0%", "Percentual de Descargas no Prazo"],
        ["Fortaleza", "Enel CE", "Processos", "Operação", "Nível de Serviço de Descarga", "01/07/2026", 1.0, "100,0%", "Percentual de Descargas no Prazo"],

        // Enel CE - Turnover
        ["Fortaleza", "Enel CE", "Gente", "Turnover", "Turnover", "01/05/2026", 0.987, "97,0%", "Média de Turnover mensal"],
        ["Fortaleza", "Enel CE", "Gente", "Turnover", "Turnover", "01/06/2026", 0.979, "97,0%", "Média de Turnover mensal"],
        ["Fortaleza", "Enel CE", "Gente", "Turnover", "Turnover", "01/07/2026", 0.99, "97,0%", "Média de Turnover mensal"],

        // CBO - Assertividade (Mês a Mês)
        ["Niterói", "CBO", "Processos", "Operação", "Assertividade no Recebimento", "01/01/2026", 1.0, "95,0%", "Percentual de assertividade no recebimento"],
        ["Niterói", "CBO", "Processos", "Operação", "Assertividade no Recebimento", "01/02/2026", 1.0, "95,0%", "Percentual de assertividade no recebimento"],
        ["Niterói", "CBO", "Processos", "Operação", "Assertividade no Recebimento", "01/03/2026", 0.994, "95,0%", "Percentual de assertividade no recebimento"],
        ["Niterói", "CBO", "Processos", "Operação", "Assertividade no Recebimento", "01/04/2026", 0.997, "95,0%", "Percentual de assertividade no recebimento"],
        ["Niterói", "CBO", "Processos", "Operação", "Assertividade no Recebimento", "01/05/2026", 1.0, "95,0%", "Percentual de assertividade no recebimento"],
        ["Niterói", "CBO", "Processos", "Operação", "Assertividade no Recebimento", "01/06/2026", 1.0, "95,0%", "Percentual de assertividade no recebimento"],
        ["Niterói", "CBO", "Processos", "Operação", "Assertividade no Recebimento", "01/07/2026", 1.0, "95,0%", "Percentual de assertividade no recebimento"]
    ];
    
    processExcelData(mockExcelRows);
}

// Processa as configurações digitadas manualmente no painel e atualiza
function processarConfiguracoesEAtualizar() {
    AppState.anoAnterior = cfgAnoAnterior.value;
    AppState.anoAtual = cfgAnoAtual.value;
    
    // Atualiza o período com base no mês e ano atual
    let mesSel;
    if (cfgMesAcum.value === "auto") {
        const indicesValidos = (AppState.excelData || [])
            .map(row => Number(row.mesIdx))
            .filter(mesIdx => Number.isInteger(mesIdx) && mesIdx >= 0 && mesIdx < 12);
        const ultimoMesIdx = indicesValidos.length > 0 ? Math.max(...indicesValidos) : obterIndicePeriodoAtivo();
        mesSel = MESES[ultimoMesIdx >= 0 ? ultimoMesIdx : 0];
    } else {
        mesSel = MESES[parseInt(cfgMesAcum.value, 10)];
    }
    AppState.periodo = `${mesSel}/${AppState.anoAtual}`;
    
    // Sobrescreve as metas se preenchidas no painel
    const metaPctVal = cfgMetaPadraoPct.value.trim();
    const metaNumVal = cfgMetaPadraoNum.value.trim();
    
    if (AppState.excelData) {
        AppState.excelData.forEach(row => {
            if (row.isPercentage && metaPctVal) {
                row.meta = metaPctVal;
                const mNum = parseFloat(metaPctVal.replace("%", "").replace(",", "."));
                row.metaDados = new Array(12).fill(isNaN(mNum) ? 0 : mNum);
            } else if (!row.isPercentage && metaNumVal) {
                row.meta = metaNumVal;
                const mNum = parseFloat(metaNumVal.replace(",", "."));
                row.metaDados = new Array(12).fill(isNaN(mNum) ? 0 : mNum);
            }
            
            // Aplica acumulados anteriores se configurados
            const acumAntPctVal = cfgAcumAntPct.value.trim();
            const acumAntNumVal = cfgAcumAntNum.value.trim();
            if (row.isPercentage && acumAntPctVal) {
                row.acumAnterior = parseFloat(acumAntPctVal.replace("%", "").replace(",", "."));
            } else if (!row.isPercentage && acumAntNumVal) {
                row.acumAnterior = parseFloat(acumAntNumVal.replace(",", "."));
            }
        });
    }
    
    salvarDados();
    atualizarDashboardECartas();
    
    restoreFeedback.textContent = "Gráficos e configurações atualizados.";
    restoreFeedback.style.display = "block";
    setTimeout(() => restoreFeedback.style.display = "none", 3000);
}

// Recalcula e exibe os alertas e avisos da caixa amarela
function recalcularAlertasEAvisos(dadosFiltrados) {
    warningsListEl.innerHTML = "";
    
    const warnings = [];
    const scope = filterContrato.value === "todos" ? "todos os contratos" : filterContrato.value;
    warningsScopeText.textContent = scope;
    
    let cntSemMeta = 0;
    let cntSemAcumAnt = 0;
    
    dadosFiltrados.forEach(row => {
        if (!row.meta || row.meta === "0" && !row.indicador.toLowerCase().includes("acidente")) {
            cntSemMeta++;
        }
        if (row.acumAnterior === null || row.acumAnterior === undefined) {
            cntSemAcumAnt++;
        }
    });
    
    // Adiciona avisos simulados ou calculados
    if (cntSemMeta > 0) {
        warnings.push(`${cntSemMeta} gráfico(s) sem meta. Preencha a meta padrão ou a meta por contrato/indicador.`);
    }
    if (cntSemAcumAnt > 0) {
        warnings.push(`${cntSemAcumAnt} gráfico(s) sem ACUM ano anterior. Preencha o ACUM padrão ou por contrato/indicador.`);
    }
    
    // Avisos de estrutura padrão
    if (!excelFileInput.files.length && !AppState.excelData) {
        warnings.push("A planilha não possui coluna Meta reconhecida. Verifique se o cabeçalho Meta está separado da coluna Dados Base.");
        warnings.push("A planilha não possui ACUM ano anterior. Preencha o ACUM padrão ou o ACUM por contrato/indicador.");
        warnings.push("A planilha não possui ACUM ano atual. O valor será calculado com base na média dos meses disponíveis.");
    }
    
    if (warnings.length > 0) {
        warnings.forEach(w => {
            const li = document.createElement("li");
            li.textContent = w;
            warningsListEl.appendChild(li);
        });
        warningsBox.style.display = "block";
    } else {
        warningsBox.style.display = "none";
    }
}

// ==========================================================================
// Exportar para PDF
// ==========================================================================
function exportarPDFLegado() {
    const exportOverlay = document.getElementById("export-overlay");
    const statusText = document.getElementById("export-status-text");
    const titleText = document.getElementById("export-title-text");
    const progressFill = document.getElementById("export-progress-fill");
    
    exportOverlay.style.display = "flex";
    if (titleText) titleText.textContent = "Exportando PDF...";
    if (progressFill) progressFill.style.width = "0%";
    statusText.textContent = "Preparando exportação de PDF...";
    
    // Desativa modo de edição temporariamente
    const modoAnterior = modoEdicao;
    modoEdicao = false;
    atualizarModoUI();
    slideCaptureArea.classList.add("capturing");
    
    // Ancorar o contêiner no topo/esquerda absoluto para evitar coordenadas negativas do flexbox center
    const viewport = document.querySelector(".slide-viewport");
    const originalViewportCss = viewport ? viewport.style.cssText : "";
    if (viewport) {
        viewport.style.cssText = "display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; overflow: visible !important; width: 1280px !important; min-height: 720px !important; height: auto !important; z-index: 9999 !important;";
    }
    
    const scaleContainer = document.getElementById("slide-scale-container") || document.querySelector(".slide-scale-container");
    const originalScaleCss = scaleContainer ? scaleContainer.style.cssText : "";
    if (scaleContainer) {
        scaleContainer.style.cssText = "width: 1280px !important; min-height: 720px !important; height: auto !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; transform: none !important; transform-origin: top left !important;";
    }
    window.scrollTo(0, 0);
    
    const { jsPDF } = window.jspdf;
    // Cria PDF no formato paisagem correspondente a 16:9
    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [1280, 720]
    });
    
    const dadosFiltrados = obterDadosFiltrados();
    const TOTAL_SLIDES = 5 + dadosFiltrados.length;
    let promiseSequence = Promise.resolve();
    
    for (let sIdx = 1; sIdx <= TOTAL_SLIDES; sIdx++) {
        promiseSequence = promiseSequence.then(() => {
            return new Promise((resolve) => {
                // Seleciona slide na tela
                selecionarSlide(sIdx);
                const progressPct = Math.round(((sIdx - 1) / TOTAL_SLIDES) * 100);
                if (progressFill) progressFill.style.width = `${progressPct}%`;
                statusText.textContent = `Capturando slide para PDF: ${sIdx}/${TOTAL_SLIDES}`;
                
                // Pequena pausa para garantir renderização correta do Chart.js e CSS
                setTimeout(() => {
                    const slideEl = document.getElementById(`slide-${sIdx}`);
                    if (!slideEl) {
                        resolve();
                        return;
                    }

                    // O One Page usa uma composição compacta específica do PDF,
                    // mantendo o canvas 16:9 preenchido como na visualização desejada.
                    if (sIdx === 2) slideEl.classList.add("pdf-onepage-fit");
                    const captureHeight = 720;
                    
                    
                    const origBodyOverflow = document.body.style.overflow;
                    const origBodyHeight = document.body.style.height;
                    const workspaceBody = document.querySelector('.workspace-body');
                    const origWorkspaceOverflow = workspaceBody ? workspaceBody.style.overflow : '';
                    const origWorkspaceHeight = workspaceBody ? workspaceBody.style.height : '';
                    const appContainer = document.querySelector('.app-container');
                    const origAppOverflow = appContainer ? appContainer.style.overflow : '';
                    const origAppHeight = appContainer ? appContainer.style.height : '';
                    
                    if (sIdx === 2) {
                        document.body.style.setProperty('overflow', 'visible', 'important');
                        document.body.style.setProperty('height', 'auto', 'important');
                        if (workspaceBody) {
                            workspaceBody.style.setProperty('overflow', 'visible', 'important');
                            workspaceBody.style.setProperty('height', 'auto', 'important');
                        }
                        if (appContainer) {
                            appContainer.style.setProperty('overflow', 'visible', 'important');
                            appContainer.style.setProperty('height', 'auto', 'important');
                        }
                    }

                    const capturePromise = html2canvas(slideEl, {
                        scale: 3,
                        width: 1280,
                        height: captureHeight,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: 1280,
                        windowHeight: captureHeight,
                        logging: false,
                        backgroundColor: "#ffffff"
                    });
                    
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("Timeout de captura de tela (15s)")), 15000);
                    });
                    
                    Promise.race([capturePromise, timeoutPromise])
                    .then(canvas => {
                        if (sIdx === 2) {
                            slideEl.classList.remove("pdf-onepage-fit");
                            document.body.style.overflow = origBodyOverflow;
                            document.body.style.height = origBodyHeight;
                            if (workspaceBody) {
                                workspaceBody.style.overflow = origWorkspaceOverflow;
                                workspaceBody.style.height = origWorkspaceHeight;
                            }
                            if (appContainer) {
                                appContainer.style.overflow = origAppOverflow;
                                appContainer.style.height = origAppHeight;
                            }
                        }
                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        
                        if (sIdx > 1) pdf.addPage([1280, 720], "landscape");
                        
                        const pdfW = 1280;
                        const pdfH = 720;
                        const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
                        const drawW = canvas.width * ratio;
                        const drawH = canvas.height * ratio;
                        const drawX = (pdfW - drawW) / 2;
                        const drawY = (pdfH - drawH) / 2;
                        
                        pdf.addImage(imgData, "JPEG", drawX, drawY, drawW, drawH);
                        resolve();
                    }).catch(err => {
                        if (sIdx === 2) {
                            slideEl.classList.remove("pdf-onepage-fit");
                            document.body.style.overflow = origBodyOverflow;
                            document.body.style.height = origBodyHeight;
                            if (workspaceBody) {
                                workspaceBody.style.overflow = origWorkspaceOverflow;
                                workspaceBody.style.height = origWorkspaceHeight;
                            }
                            if (appContainer) {
                                appContainer.style.overflow = origAppOverflow;
                                appContainer.style.height = origAppHeight;
                            }
                        }
                        console.error(`Erro ou timeout ao capturar slide ${sIdx} para PDF:`, err);
                        resolve();
                    });
                }, 150); // 150ms é seguro e garante a repintura completa do slide no navegador
            });
        });
    }
    
    promiseSequence.then(() => {
        const progressFill = document.getElementById("export-progress-fill");
        if (progressFill) progressFill.style.width = "100%";
        statusText.textContent = "Salvando arquivo PDF...";
        const fileName = `Boletim_${AppState.contrato.replace(/\s+/g, "_")}_${AppState.periodo.replace(/\//g, "-")}.pdf`;
        pdf.save(fileName);
    }).catch(err => {
        alert("Erro ao salvar arquivo PDF: " + err.message);
    }).finally(() => {
        // Restaura tela e estilos
        slideCaptureArea.classList.remove("capturing");
        modoEdicao = modoAnterior;
        atualizarModoUI();
        
        // Restaura os estilos alterados
        if (scaleContainer) scaleContainer.style.cssText = originalScaleCss;
        if (viewport) viewport.style.cssText = originalViewportCss;
        
        selecionarSlide(1);
        exportOverlay.style.display = "none";
    });
}

async function criarOnePageParaExportacao(slideOriginal) {
    // Captura o próprio componente já renderizado fora do modo de edição.
    // Não há clone nem CSS alternativo para o One Page.
    // A rotina responsiva existente precisa rodar com o slide visível;
    // quando executada com ele oculto, a altura medida é zero.
    if (typeof autoFitCompact === "function") autoFitCompact();
    await new Promise(resolve => setTimeout(resolve, 40));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    return {
        element: slideOriginal,
        height: 720,
        cleanup() {}
    };
}

// Exportação atual: fotografa o One Page renderizado fora da edição e restaura o estado anterior.
async function exportarPDF() {
    const exportOverlay = document.getElementById("export-overlay");
    const statusText = document.getElementById("export-status-text");
    const titleText = document.getElementById("export-title-text");
    const progressFill = document.getElementById("export-progress-fill");
    const slideAnterior = activeSlideIndex;
    const modoAnterior = modoEdicao;

    sincronizarMetadadosOnePageDoDOM();

    if (!window.jspdf || typeof html2canvas === "undefined") {
        alert("Não foi possível carregar as bibliotecas de exportação. Atualize a página e tente novamente.");
        return;
    }

    if (exportOverlay) exportOverlay.style.display = "flex";
    if (titleText) titleText.textContent = "Exportando PDF...";
    if (progressFill) progressFill.style.width = "0%";
    if (statusText) statusText.textContent = "Preparando exportação de PDF...";
    modoEdicao = false;
    atualizarModoUI();
    slideCaptureArea.classList.add("capturing");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [1280, 720]
    });

    try {
        await prepararLogosMro(slideCaptureArea);
        const slides = obterSlidesDisponiveis();

        for (let index = 0; index < slides.length; index++) {
            const slideInfo = slides[index];
            selecionarSlide(slideInfo.index);
            if (progressFill) progressFill.style.width = `${Math.round((index / slides.length) * 100)}%`;
            if (statusText) statusText.textContent = `Capturando slide para PDF: ${index + 1}/${slides.length}`;

            await new Promise(resolve => setTimeout(resolve, 150));

            let exportVersion = null;
            try {
                exportVersion = slideInfo.index === 2
                    ? await criarOnePageParaExportacao(slideInfo.element)
                    : { element: slideInfo.element, height: 720, cleanup() {} };

                const captureHeight = 720;
                const canvas = await Promise.race([
                    html2canvas(exportVersion.element, {
                        scale: 3,
                        width: 1280,
                        height: captureHeight,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: 1280,
                        windowHeight: captureHeight,
                        useCORS: true,
                        logging: false,
                        backgroundColor: "#ffffff"
                    }),
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("Timeout de captura de tela (20s)")), 20000);
                    })
                ]);

                if (index > 0) {
                    pdf.addPage([1280, 720], "landscape");
                }
                pdf.addImage(
                    canvas.toDataURL("image/jpeg", 0.95),
                    "JPEG",
                    0,
                    0,
                    1280,
                    captureHeight
                );
            } finally {
                if (exportVersion) exportVersion.cleanup();
            }
        }

        if (progressFill) progressFill.style.width = "100%";
        if (statusText) statusText.textContent = "Salvando arquivo PDF...";
        const fileName = `Boletim_${AppState.contrato.replace(/\s+/g, "_")}_${AppState.periodo.replace(/\//g, "-")}.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        alert("Erro ao salvar arquivo PDF: " + error.message);
    } finally {
        slideCaptureArea.classList.remove("capturing");
        modoEdicao = modoAnterior;
        atualizarModoUI();
        selecionarSlide(slideAnterior);
        if (exportOverlay) exportOverlay.style.display = "none";
    }
}

// ==========================================================================
// Exportar para PowerPoint padrão (slides como imagens de alta resolução)
// ==========================================================================
async function exportarPPTXPadrao() {
    const exportOverlay = document.getElementById("export-overlay");
    const statusText = document.getElementById("export-status-text");
    const titleText = document.getElementById("export-title-text");
    const progressFill = document.getElementById("export-progress-fill");
    const viewport = document.querySelector(".slide-viewport");
    const scaleContainer = document.getElementById("slide-scale-container") || document.querySelector(".slide-scale-container");
    const originalViewportCss = viewport ? viewport.style.cssText : "";
    const originalScaleCss = scaleContainer ? scaleContainer.style.cssText : "";
    const slideAnterior = activeSlideIndex;
    const modoAnterior = modoEdicao;

    sincronizarMetadadosOnePageDoDOM();

    if (typeof PptxGenJS === "undefined" || typeof html2canvas === "undefined") {
        alert("Não foi possível carregar as bibliotecas de exportação. Atualize a página e tente novamente.");
        return;
    }

    try {
        if (exportOverlay) exportOverlay.style.display = "flex";
        if (titleText) titleText.textContent = "Exportando PowerPoint...";
        if (progressFill) progressFill.style.width = "0%";
        if (statusText) statusText.textContent = "Preparando os slides...";

        modoEdicao = false;
        atualizarModoUI();
        slideCaptureArea.classList.add("capturing");

        if (viewport) {
            viewport.style.cssText = "display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; overflow: visible !important; width: 1280px !important; min-height: 720px !important; height: auto !important; z-index: 9999 !important;";
        }
        if (scaleContainer) {
            scaleContainer.style.cssText = "width: 1280px !important; min-height: 720px !important; height: auto !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; transform: none !important; transform-origin: top left !important;";
        }
        window.scrollTo(0, 0);

        await prepararLogosMro(slideCaptureArea);

        const slides = obterSlidesDisponiveis();
        const pres = new PptxGenJS();
        pres.layout = "LAYOUT_16x9";
        pres.author = "MRO";
        pres.subject = "Boletim de Clientes";
        pres.title = `Boletim ${AppState.contrato}`;

        for (let index = 0; index < slides.length; index++) {
            const slideInfo = slides[index];
            selecionarSlide(slideInfo.index);
            if (progressFill) progressFill.style.width = `${Math.round((index / slides.length) * 100)}%`;
            if (statusText) statusText.textContent = `Capturando slide ${index + 1} de ${slides.length}...`;

            await new Promise(resolve => setTimeout(resolve, 150));
            let exportVersion = null;
            let canvas;
            try {
                exportVersion = slideInfo.index === 2
                    ? await criarOnePageParaExportacao(slideInfo.element)
                    : { element: slideInfo.element, height: 720, cleanup() {} };

                canvas = await Promise.race([
                    html2canvas(exportVersion.element, {
                        scale: 2,
                        width: 1280,
                        height: exportVersion.height,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: 1280,
                        windowHeight: exportVersion.height,
                        useCORS: true,
                        logging: false,
                        backgroundColor: "#ffffff"
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Tempo limite excedido ao capturar o slide.")), 20000))
                ]);
            } finally {
                if (exportVersion) exportVersion.cleanup();
            }
            
            const imageData = canvas.toDataURL("image/jpeg", 0.95);
            const drawW = 10;
            const drawH = 5.625;

            const pptSlide = pres.addSlide();
            pptSlide.background = { color: "FFFFFF" };
            pptSlide.addImage({ data: imageData, x: 0, y: 0, w: drawW, h: drawH });
        }

        if (progressFill) progressFill.style.width = "100%";
        if (statusText) statusText.textContent = "Salvando PowerPoint...";
        const fileName = `Boletim_${AppState.contrato.replace(/\s+/g, "_")}_${AppState.periodo.replace(/\//g, "-")}.pptx`;
        await pres.writeFile({ fileName });
    } catch (error) {
        console.error("Erro ao exportar PowerPoint:", error);
        alert("Erro ao salvar o PowerPoint: " + error.message);
    } finally {
        if (viewport) viewport.style.cssText = originalViewportCss;
        if (scaleContainer) scaleContainer.style.cssText = originalScaleCss;
        slideCaptureArea.classList.remove("capturing");
        modoEdicao = modoAnterior;
        atualizarModoUI();
        selecionarSlide(slideAnterior);
        if (exportOverlay) exportOverlay.style.display = "none";
    }
}

// ==========================================================================
// Exportar para PowerPoint Editável
// ==========================================================================
async function exportarPPTXEditavel() {
    const exportOverlay = document.getElementById("export-overlay");
    const statusText = document.getElementById("export-status-text");
    const titleText = document.getElementById("export-title-text");
    const progressFill = document.getElementById("export-progress-fill");
    const modoAnterior = modoEdicao;

    sincronizarMetadadosOnePageDoDOM();
    
    exportOverlay.style.display = "flex";
    if (titleText) titleText.textContent = "Gerando PPTX Editável Perfeito...";
    if (progressFill) progressFill.style.width = "0%";
    statusText.textContent = "Preparando capturas...";
    
    modoEdicao = false;
    atualizarModoUI();
    slideCaptureArea.classList.add("capturing");

    await prepararLogosMro(slideCaptureArea);
    
    const viewport = document.querySelector(".slide-viewport");
    const originalViewportCss = viewport ? viewport.style.cssText : "";
    if (viewport) {
        viewport.style.cssText = "display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; overflow: visible !important; width: 1280px !important; min-height: 720px !important; height: auto !important; z-index: 9999 !important;";
    }
    
    const scaleContainer = document.getElementById("slide-scale-container") || document.querySelector(".slide-scale-container");
    const originalScaleCss = scaleContainer ? scaleContainer.style.cssText : "";
    if (scaleContainer) {
        scaleContainer.style.cssText = "width: 1280px !important; min-height: 720px !important; height: auto !important; position: absolute !important; top: 0 !important; left: 0 !important; margin: 0 !important; transform: none !important; transform-origin: top left !important;";
    }
    window.scrollTo(0, 0);
    
    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_16x9";
    
    const dadosFiltrados = obterDadosFiltrados();
    const TOTAL_SLIDES = 5 + dadosFiltrados.length;
    
    let promiseSequence = Promise.resolve();
    
    // Funcao auxiliar para converter cor rgb(x, y, z) para HEX
    function rgbToHex(rgbStr) {
        const rgb = rgbStr.match(/\d+/g);
        if (!rgb || rgb.length < 3) return "000000";
        const hex = rgb.slice(0,3).map(x => {
            const h = parseInt(x).toString(16);
            return h.length === 1 ? "0" + h : h;
        }).join("");
        return hex.toUpperCase();
    }
    
    for (let sIdx = 1; sIdx <= TOTAL_SLIDES; sIdx++) {
        promiseSequence = promiseSequence.then(() => {
            return new Promise((resolve) => {
                selecionarSlide(sIdx);
                const progressPct = Math.round(((sIdx - 1) / TOTAL_SLIDES) * 100);
                if (progressFill) progressFill.style.width = progressPct + "%";
                statusText.textContent = "Processando slide " + sIdx + " de " + TOTAL_SLIDES + "...";
                
                setTimeout(async () => {
                    const sourceSlide = document.querySelector(".slide-container[data-index='" + sIdx + "']");
                    if (!sourceSlide) {
                        resolve();
                        return;
                    }

                    let exportVersion = null;
                    let slideElem = sourceSlide;
                    try {
                        exportVersion = sIdx === 2
                            ? await criarOnePageParaExportacao(sourceSlide)
                            : { element: sourceSlide, height: 720, cleanup() {} };
                        slideElem = exportVersion.element;
                    } catch (error) {
                        console.error(error);
                        resolve();
                        return;
                    }
                    
                    if (sIdx === 1 || sIdx === 2) {
                        slideElem.classList.add("hide-text-for-capture");
                    }
                    
                    // Usa EXATAMENTE os mesmos parametros de captura da funcao padrao exportarPPTX
                    html2canvas(slideElem, { 
                        scale: 3, 
                        width: 1280,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: 1280,
                        height: exportVersion.height,
                        windowHeight: exportVersion.height,
                        useCORS: true, 
                        logging: false,
                        backgroundColor: "#ffffff"
                    }).then(canvas => {
                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        
                        // Mantém a escala 128 px = 1 polegada; páginas mais altas
                        // crescem sem reduzir fontes, colunas ou conteúdo.
                        const drawW = 10;
                        const drawH = 5.625;
                        const drawX = 0;
                        const drawY = 0;

const contRect = slideElem.getBoundingClientRect();
const scaleUniform = drawW / contRect.width; // ex: 10 / 1280
                        
                        const s = pres.addSlide();
                        s.background = { fill: "FFFFFF" };
                        
                        s.addImage({ data: imgData, x: drawX, y: drawY, w: drawW, h: drawH });
                        
                        if (sIdx === 1 || sIdx === 2) {
                            slideElem.classList.remove("hide-text-for-capture");
                        }
                        
                        // Funcao injetora local que captura os bounds baseada no scaleUniform
                        function cloneTextNode(el, defaultColor, defaultFont, isLi = false) {
                            if (!el) return;
                            const rect = el.getBoundingClientRect();
                            const contRect = slideElem.getBoundingClientRect();
                            
                            let x = drawX + ((rect.left - contRect.left) * scaleUniform);
                            let y = drawY + ((rect.top - contRect.top) * scaleUniform);
                            let w = rect.width * scaleUniform;
                            let h = rect.height * scaleUniform;
                            
                            const style = window.getComputedStyle(el);
                            const fontSizePx = parseFloat(style.fontSize);
                            const fontSizePt = fontSizePx * 0.75; // sem distorcao vertical
                            
                            let align = style.textAlign;
                            if (align === "start") align = "left";
                            if (align === "end") align = "right";
                            
                            // Ajuste fino do PptxGenJS (que as vezes empurra o texto sutilmente para baixo)
                            y = y - 0.02;
                            
                            const coords = { 
                                x, y, w, h, 
                                fontSize: fontSizePt, 
                                align, 
                                margin: 0, 
                                valign: "middle",
                                color: rgbToHex(style.color) || defaultColor,
                                fontFace: style.fontFamily.includes("Outfit") ? "Outfit" : defaultFont
                            };
                            
                            if(style.fontWeight > 500) coords.bold = true;
                            
                            let text = el.innerText || el.textContent;
                            text = text.trim();
                            if(!text) return;
                            
                            if (isLi) {
                                coords.bullet = true;
                                coords.align = "left";
                            }
                            
                            s.addText(text, coords);
                        }
                        
                        if (sIdx === 1) {
                            cloneTextNode(slideElem.querySelector(".capa-subtitle"), "00B080", "Outfit");
                            cloneTextNode(slideElem.querySelector(".capa-title"), "0F2B5C", "Outfit");
                            cloneTextNode(slideElem.querySelector(".capa-periodo"), "00B080", "Inter");
                        } else if (sIdx === 2) {
                            cloneTextNode(slideElem.querySelector("#slide2-header-contrato"), "0F2B5C", "Outfit");
                            cloneTextNode(slideElem.querySelector("#slide2-header-title"), "0F2B5C", "Outfit");
                            cloneTextNode(slideElem.querySelector("#slide2-header-subtitle"), "00B080", "Inter");
                            
                            slideElem.querySelectorAll("#list-destaques li").forEach(li => cloneTextNode(li, "001A70", "Inter", true));
slideElem.querySelectorAll("#list-atencao li").forEach(li => cloneTextNode(li, "001A70", "Inter", true));
slideElem.querySelectorAll("#list-passos li").forEach(li => cloneTextNode(li, "001A70", "Inter", true));
slideElem.querySelectorAll("#list-pendencias-mro li").forEach(li => cloneTextNode(li, "001A70", "Inter", true));
slideElem.querySelectorAll("#list-pendencias-cliente li").forEach(li => cloneTextNode(li, "001A70", "Inter", true));
                            cloneTextNode(slideElem.querySelector(".sla-inline-title"), "0F2B5C", "Outfit");
slideElem.querySelectorAll("#table-slas th:not(.skip-clone), #table-slas td .editable-text").forEach(cell => {
                                cloneTextNode(cell, "0F2B5C", "Inter");
                            });
                        }
                        
                        exportVersion.cleanup();
                        resolve();
                    }).catch(err => {
                        console.error(err);
                        if (sIdx === 1 || sIdx === 2) {
                            slideElem.classList.remove("hide-text-for-capture");
                        }
                        exportVersion.cleanup();
                        resolve();
                    });
                }, 100);
            });
        });
    }
    
    promiseSequence.then(() => {
        statusText.textContent = "Finalizando PowerPoint Editável...";
        if (progressFill) progressFill.style.width = "100%";
        
        pres.writeFile({ fileName: "Boletim_Clientes_Editavel_" + AppState.contrato.replace(/\s+/g, "_") + ".pptx" }).then(() => {
            if (viewport) viewport.style.cssText = originalViewportCss;
            if (scaleContainer) scaleContainer.style.cssText = originalScaleCss;
            slideCaptureArea.classList.remove("capturing");
            modoEdicao = modoAnterior;
            atualizarModoUI();
            
            exportOverlay.style.display = "none";
        }).catch(err => {
            alert("Erro ao salvar arquivo: " + err);
            exportOverlay.style.display = "none";
            if (viewport) viewport.style.cssText = originalViewportCss;
            if (scaleContainer) scaleContainer.style.cssText = originalScaleCss;
            slideCaptureArea.classList.remove("capturing");
            modoEdicao = modoAnterior;
            atualizarModoUI();
        });
    });
}

function mostrarNotificacao(msg, tipo = "success") {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        document.body.appendChild(toast);
    }
    
    toast.textContent = msg;
    toast.className = `toast-visible toast-${tipo}`;
    
    setTimeout(() => {
        toast.className = "";
    }, 3000);
}





// ==========================================================================
// Rich Text Editor Toolbar (Item 5)
// ==========================================================================
const textToolbar = document.getElementById('text-editor-toolbar');
const btnFontInc = document.getElementById('btn-font-increase');
const btnFontDec = document.getElementById('btn-font-decrease');
const colorPickerText = document.getElementById('color-picker-text');

let currentEditingElement = null;
let savedSelection = null;

function saveSelection() {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
        return sel.getRangeAt(0);
    }
    return null;
}

function restoreSelection(range) {
    if (range) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

document.addEventListener('mouseup', (e) => {
    if (typeof modoEdicao === 'undefined' || !modoEdicao) return;
    
    // Pequeno delay para garantir que o blur nuo remova a seleuo antes
    setTimeout(() => {
        const sel = window.getSelection();
        if (!sel.isCollapsed && sel.anchorNode) {
            let editableParent = sel.anchorNode.parentElement;
            while (editableParent && editableParent.contentEditable !== 'true') {
                editableParent = editableParent.parentElement;
            }
            
            if (editableParent) {
                currentEditingElement = editableParent;
                savedSelection = saveSelection();
                
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                if (textToolbar) { textToolbar.style.display = 'flex'; }
                if (textToolbar) textToolbar.style.top = (rect.top + window.scrollY - 40) + 'px';
                if (textToolbar) textToolbar.style.left = (rect.left + window.scrollX) + 'px';
                return;
            }
        }
        
        if (textToolbar && !textToolbar.contains(e.target)) {
            textToolbar.style.display = 'none';
        }
    }, 10);
});





if (colorPickerText) colorPickerText.addEventListener('input', (e) => {
    if (!currentEditingElement) return;
    restoreSelection(savedSelection);
    document.execCommand('foreColor', false, e.target.value);
    currentEditingElement.dispatchEvent(new Event('blur'));
});


function changeFontSizeGradually(step) {
    if (!currentEditingElement) return;
    
    let wrapper = currentEditingElement.querySelector(".format-wrapper");
    let sizeElement = wrapper ? wrapper : currentEditingElement;
    let currentSize = parseFloat(window.getComputedStyle(sizeElement).fontSize);
    
    if (isNaN(currentSize)) currentSize = 12;
    
    let newSize = currentSize + step;
    
    currentEditingElement.querySelectorAll("font[size]").forEach(f => {
        f.removeAttribute("size");
    });
    
    if (!wrapper || wrapper.parentNode !== currentEditingElement || currentEditingElement.childNodes.length > 1) {
        let inner = currentEditingElement.innerHTML;
        currentEditingElement.innerHTML = `<span class="format-wrapper" style="font-size: ${newSize}px; display: inline-block; width: 100%; line-height: 1.2;">${inner}</span>`;
    } else {
        wrapper.style.fontSize = newSize + "px";
    }
    
    currentEditingElement.dispatchEvent(new Event("blur"));
}

if (btnFontInc) btnFontInc.addEventListener('click', (e) => {
    e.preventDefault();
    changeFontSizeGradually(1);
});

if (btnFontDec) btnFontDec.addEventListener('click', (e) => {
    e.preventDefault();
    changeFontSizeGradually(-1);
});


// ==========================================================================
// COMPACT-MODE AUTO: Redimensiona verticalmente removendo margens
// ==========================================================================
function autoFitCompact() {
    const container = document.getElementById('slide-2');
    if (!container) return;
    
    // Desliga as classes para medir o tamanho natural
    container.classList.remove('compact-1', 'compact-2', 'compact-3');

    // Durante a edição, o slide e os cards crescem com o conteúdo. Ao sair
    // da edição, o modo compacto volta a preservar a proporção de exportação.
    if (modoEdicao) return;
    
    // Usa um pequeno timeout para o navegador recalcular o scrollHeight
    setTimeout(() => {
        let isOverflowing = container.scrollHeight > 720;
        
        if (isOverflowing) {
            container.classList.add('compact-1');
            if (container.scrollHeight > 720) {
                container.classList.add('compact-2');
                if (container.scrollHeight > 720) {
                    container.classList.add('compact-3');
                }
            }
        }
    }, 10);
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const grid = document.querySelector('.onepage-grid');
        if (grid) {
            const observer = new MutationObserver(() => {
                observer.disconnect();
                autoFitCompact();
                setTimeout(() => {
                    observer.observe(grid, { childList: true, subtree: true, characterData: true });
                }, 50);
            });
            observer.observe(grid, { childList: true, subtree: true, characterData: true });
            autoFitCompact();
        }
    }, 1000);
});




// ==========================================
// INTEGRA��O COM SUPABASE - CARREGAMENTO
// ==========================================
window.carregarDoSupabaseERenderizar = async function() {
    if (!window.supabaseClientObj || typeof fetchDashboardData !== 'function') return;
    
    // Mostra loading se existir
    const btn = document.getElementById('btn-update-charts');
    if (btn) btn.textContent = 'Carregando...';

    const MESES_MAP = { "Jan": "01", "Fev": "02", "Mar": "03", "Abr": "04", "Mai": "05", "Jun": "06", "Jul": "07", "Ago": "08", "Set": "09", "Out": "10", "Nov": "11", "Dez": "12" };
    
    const parts = AppState.periodo.split('/');
    if (parts.length === 2 && MESES_MAP[parts[0]]) {
        const compBackend = MESES_MAP[parts[0]] + '/' + parts[1];
        try {
            const dados = await fetchDashboardData(AppState.contrato, compBackend);
            
            if (dados && dados.excelData && dados.excelData.length > 0) {
                AppState.excelData = dados.excelData;
                Object.assign(AppState, dados.comentarios);
                salvarDados(); // Cache local
                console.log("Dados atualizados com sucesso via Supabase.");
            } else {
                AppState.excelData = [];
                console.warn("Nenhum dado encontrado no Supabase para " + AppState.contrato + " em " + compBackend);
            }
        } catch (e) {
            console.error("Erro na leitura Supabase:", e);
        } finally {
            if (btn) btn.textContent = 'Atualizar Gráficos';
        }
    }
    
    // Atualiza interface sempre
    atualizarDashboardECartas();
    
    if (btn) btn.textContent = 'Atualizar Gr�ficos';
};
