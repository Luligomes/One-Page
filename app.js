const { escapeAttribute, escapeHtml, sanitizeRichHtml, setSafeRichText } = window.SecurityUtils;

function atualizarStatusBases() {
    const statusAtual = document.getElementById("status-base-atual");
    const statusAnterior = document.getElementById("status-base-anterior");
    
    if (statusAtual) {
        if (AppState.excelData && AppState.excelData.length > 0) {
            statusAtual.textContent = "✓ Base atual carregada na memória";
        } else {
            statusAtual.innerHTML = "";
        }
    }
    
    if (statusAnterior) {
        if (window.MRO_ACUMULADO_2025?.valores) {
            statusAnterior.textContent = "✓ Acumulado 2025 fixo carregado";
        } else if (AppState.excelDataAnterior && AppState.excelDataAnterior.length > 0) {
            statusAnterior.textContent = "✓ Base anterior carregada na memória";
        } else {
            statusAnterior.innerHTML = "";
        }
    }
}
/* ==========================================================================
   Boletim Clientes — Lógica Principal (JavaScript)
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
let filterLocalidadeToggle;
let filterLocalidadeMenu;
let filterLocalidadeResumo;
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
    filterLocalidadeToggle = document.getElementById("filter-localidade-toggle");
    filterLocalidadeMenu = document.getElementById("filter-localidade-menu");
    filterLocalidadeResumo = document.getElementById("filter-localidade-resumo");
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
    acoes: "Plano de Acompanhamento",
    crono1: "Realização das Reuniões",
    crono2: "Periodicidade e Participantes"
};

function obterSlidesDisponiveis() {
    return Array.from(document.querySelectorAll(".slide-container[data-index]"))
        .map(slide => ({
            index: Number(slide.dataset.index),
            element: slide,
            titulo: (slide.dataset.index === "1" ? "Capa" : null) ||
                (slide.dataset.index === "2" ? "One-Page Executivo" : null) ||
                NOMES_SLIDES_ESTATICOS[slide.dataset.static] ||
                slide.querySelector(".chart-slide-title")?.textContent?.trim() ||
                `Slide ${slide.dataset.index}`
        }))
        .filter(slide => Number.isFinite(slide.index))
        .sort((a, b) => a.index - b.index);
}

let logoMroDataUrlPromise = null;

function carregarLogoMroIncorporada() {
    if (!logoMroDataUrlPromise) {
        logoMroDataUrlPromise = Promise.resolve().then(async () => {
            const logoCabecalho = document.querySelector(".header-logo");
            const logoSource = logoCabecalho?.getAttribute("src") || "mro_logo.png";
            if (logoSource.startsWith("data:image/")) return logoSource.replace(/\s/g, "");

            const response = await fetch(logoSource, { cache: "force-cache" });
            if (!response.ok) throw new Error("Não foi possível carregar a logo MRO.");
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener("load", () => resolve(reader.result), { once: true });
                reader.addEventListener("error", reject, { once: true });
                reader.readAsDataURL(blob);
            });
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
        item.setAttribute("role", "button");
        item.tabIndex = 0;
        item.setAttribute("aria-current", slide.index === activeSlideIndex ? "true" : "false");
        item.innerHTML = `<span class="slide-num-badge">${escapeHtml(slide.index)}</span><span>${escapeHtml(slide.titulo)}</span>`;
        item.addEventListener("click", () => selecionarSlide(slide.index));
        item.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            selecionarSlide(slide.index);
        });
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

function ajustarEscalaPreview() {
    const viewport = document.querySelector(".slide-viewport");
    const container = document.querySelector(".slide-scale-container");
    if (!viewport || !container) return;

    const larguraDisponivel = Math.max(320, viewport.clientWidth - 48);
    const escala = Math.min(1, larguraDisponivel / 1280);
    container.style.setProperty("--preview-scale", escala.toFixed(4));
    container.style.marginRight = `${Math.round(1280 * (escala - 1))}px`;
    container.style.marginBottom = `${Math.round(720 * (escala - 1))}px`;
}

window.addEventListener("resize", ajustarEscalaPreview, { passive: true });
document.addEventListener("DOMContentLoaded", ajustarEscalaPreview, { once: true });

document.addEventListener("keydown", event => {
    const openModal = Array.from(document.querySelectorAll('[role="dialog"][aria-hidden="false"]'))
        .find(modal => getComputedStyle(modal).display !== "none");
    if (!openModal) return;

    if (event.key === "Escape") {
        event.preventDefault();
        if (openModal.id === "chart-data-modal") fecharModalGrafico();
        if (openModal.id === "import-preview-modal") {
            document.getElementById("btn-close-import-modal")?.click();
        }
        return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(openModal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

function salvarDados() {
    try {
        // O Supabase é a fonte oficial. O cache local guarda apenas o estado
        // leve da interface; bases e histórico completos excedem facilmente a
        // cota do sessionStorage e já podem ser recarregados do banco.
        const estadoLeve = { ...AppState };
        delete estadoLeve.excelData;
        delete estadoLeve.excelDataAnterior;
        delete estadoLeve.historicoVersoes;
        sessionStorage.setItem("MRO_Boletim_Dados", JSON.stringify(estadoLeve));
    } catch (error) {
        console.warn("Não foi possível atualizar o cache local:", error);
        if (typeof mostrarNotificacao === "function") {
            mostrarNotificacao("O cache local atingiu o limite, mas os dados salvos no Supabase permanecem disponíveis.", "warning");
        }
    }
}

function carregarDados() {
    const saved = sessionStorage.getItem("MRO_Boletim_Dados") || localStorage.getItem("MRO_Boletim_Dados");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            AppState = { ...DADOS_PADRAO, ...parsed };
            sessionStorage.setItem("MRO_Boletim_Dados", JSON.stringify(AppState));
            localStorage.removeItem("MRO_Boletim_Dados");
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

    // Cabeçalhos pertencem ao contrato, não ao estado global da última tela
    // exibida. Assim, ao alternar o filtro, um título editado em outro
    // contrato não permanece indevidamente no One Page atual.
    const cabecalhoPadrao = {
        contrato: c,
        titulo: `One-Page Executivo - ${c}`,
        subtitulo: `${c} | ${AppState.periodo}`
    };
    AppState.dadosContratos[c].cabecalho = {
        ...cabecalhoPadrao,
        ...(AppState.dadosContratos[c].cabecalho || {})
    };
    AppState.slide2HeaderContrato = AppState.dadosContratos[c].cabecalho.contrato;
    AppState.slide2HeaderTitle = AppState.dadosContratos[c].cabecalho.titulo;
    AppState.slide2HeaderSubtitle = AppState.dadosContratos[c].cabecalho.subtitulo;
    
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
    setSafeRichText(elPeriodo, AppState.capaPeriodoTexto, `Fechamento de Indicadores | ${AppState.periodo}`);
    
    const elHContrato = document.getElementById("slide2-header-contrato");
    setSafeRichText(elHContrato, AppState.slide2HeaderContrato, AppState.contrato);
    
    const elHTitle = document.getElementById("slide2-header-title");
    setSafeRichText(elHTitle, AppState.slide2HeaderTitle, `One-Page Executivo - ${AppState.contrato}`);
    
    const elHSub = document.getElementById("slide2-header-subtitle");
    setSafeRichText(elHSub, AppState.slide2HeaderSubtitle, `${AppState.contrato} | ${AppState.periodo}`);
    
    const elPendCliente = document.getElementById("label-pendencias-cliente");
    if (elPendCliente) elPendCliente.textContent = `Pendências ${AppState.contrato}`;
    
    document.querySelectorAll(".contrato-nome-placeholder").forEach(el => el.textContent = AppState.contrato);
    document.querySelectorAll(".periodo-placeholder").forEach(el => el.textContent = AppState.periodo);
    
    const respMro = document.getElementById("txt-resp-mro");
    setSafeRichText(respMro, AppState.respMro);
    const respCli = document.getElementById("txt-resp-cliente");
    setSafeRichText(respCli, AppState.respCliente);
    const proxReu = document.getElementById("txt-prox-reuniao");
    setSafeRichText(proxReu, AppState.proxReuniao);
    
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

function obterHtmlEditavelOuFallback(element, fallback) {
    if (!element || !element.textContent.trim()) return fallback;
    return sanitizeRichHtml(element.innerHTML);
}

// Mantém todo o conteúdo rico do One Page sincronizado com o estado antes de
// qualquer nova renderização. Cor e tamanho são gravados como marcação inline
// pelo editor e, por isso, não podem ser convertidos para texto simples.
function sincronizarMetadadosOnePageDoDOM() {
    [
        ["slide2-header-contrato", "slide2HeaderContrato", AppState.contrato || "CBO"],
        ["slide2-header-title", "slide2HeaderTitle", `One-Page Executivo - ${AppState.contrato}`],
        ["slide2-header-subtitle", "slide2HeaderSubtitle", `${AppState.contrato} | ${AppState.periodo}`],
        ["txt-resp-mro", "respMro", "Nome"],
        ["txt-resp-cliente", "respCliente", "Nome"],
        ["txt-prox-reuniao", "proxReuniao", "dd/mm/aaaa"]
    ].forEach(([elementId, stateKey, fallback]) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        AppState[stateKey] = obterHtmlEditavelOuFallback(element, fallback);
    });

    const contrato = AppState.contrato || "CBO";
    if (AppState.dadosContratos?.[contrato]) {
        AppState.dadosContratos[contrato].cabecalho = {
            contrato: AppState.slide2HeaderContrato || contrato,
            titulo: AppState.slide2HeaderTitle || `One-Page Executivo - ${contrato}`,
            subtitulo: AppState.slide2HeaderSubtitle || `${contrato} | ${AppState.periodo}`
        };
    }

    document.querySelectorAll("#slide-2 .editable-list[data-key]").forEach(list => {
        const values = Array.from(list.querySelectorAll(":scope > li .onepage-list-text"))
            .map(element => obterHtmlEditavelOuFallback(element, "Novo item"));
        syncEditableList(list.dataset.key, values);
        editableListSources.set(list.id, values);
    });

    document.querySelectorAll("#table-slas tbody tr[data-sla-index]").forEach(row => {
        const item = AppState.slas?.[Number(row.dataset.slaIndex)];
        if (!item) return;
        row.querySelectorAll(".editable-text[data-field]").forEach(element => {
            item[element.dataset.field] = obterHtmlEditavelOuFallback(element, "-");
        });
    });
}

function configurarEventosGerais() {
    const capaPeriodo = document.getElementById("slide1-periodo-text");
    if (capaPeriodo) {
        capaPeriodo.addEventListener("blur", () => {
            const textoPadrao = `Fechamento de Indicadores | ${AppState.periodo}`;
            AppState.capaPeriodoTexto = sanitizeRichHtml(capaPeriodo.innerHTML).trim() || textoPadrao;
            setSafeRichText(capaPeriodo, AppState.capaPeriodoTexto);
            salvarDados();
        });
    }

    [
        "slide2-header-contrato",
        "slide2-header-title",
        "slide2-header-subtitle",
        "txt-resp-mro",
        "txt-resp-cliente",
        "txt-prox-reuniao"
    ].forEach(elementId => {
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
        filterLocalidade.addEventListener("change", event => {
            const alterada = event.target;
            if (!(alterada instanceof HTMLInputElement)) return;

            const todas = filterLocalidade.querySelector('input[value="todos"]');
            const outras = [...filterLocalidade.querySelectorAll('input:not([value="todos"])')];
            if (alterada.value === "todos" && alterada.checked) {
                outras.forEach(input => { input.checked = false; });
            } else if (alterada.value !== "todos") {
                if (todas) todas.checked = false;
                if (!outras.some(input => input.checked) && todas) todas.checked = true;
            }
            atualizarResumoFiltroLocalidade();
            if (typeof atualizarDashboardECartas === 'function') atualizarDashboardECartas();
        });
    }

    if (filterLocalidadeToggle && filterLocalidadeMenu) {
        filterLocalidadeToggle.addEventListener("click", () => {
            const abrir = filterLocalidadeMenu.hidden;
            filterLocalidadeMenu.hidden = !abrir;
            filterLocalidadeToggle.setAttribute("aria-expanded", String(abrir));
        });
        document.addEventListener("click", event => {
            if (!event.target.closest(".localidade-multiselect")) {
                filterLocalidadeMenu.hidden = true;
                filterLocalidadeToggle.setAttribute("aria-expanded", "false");
            }
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                filterLocalidadeMenu.hidden = true;
                filterLocalidadeToggle.setAttribute("aria-expanded", "false");
                filterLocalidadeToggle.focus();
            }
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
            if (modoEdicao) {
                sincronizarMetadadosOnePageDoDOM();
                salvarDados();
            }
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
                const restaurouSlas = restaurarInformacoesComplementaresDaVersao(ver.dados);
                salvarDados();
                if (filterContrato) filterContrato.value = AppState.contrato;
                if (typeof atualizarFiltrosLocalidade === 'function') atualizarFiltrosLocalidade();
                if (typeof atualizarDashboardECartas === 'function') {
                    atualizarDashboardECartas({ preservarSlas: restaurouSlas });
                }
                if (typeof mostrarNotificacao === 'function') mostrarNotificacao(`Comentários e informações complementares da versão "${ver.nome}" carregados!`, "success");
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
        tdClient.innerHTML = `<span class="editable-text font-bold" contenteditable="${modoEdicao}">${sanitizeRichHtml(row.client)}</span>`;
        tdClient.querySelector(".editable-text").addEventListener("blur", (e) => {
            row.client = sanitizeRichHtml(e.target.innerHTML);
            salvarDados();
        });
        tr.appendChild(tdClient);
        
        const tdClass = document.createElement("td");
        tdClass.innerHTML = `<span class="editable-text" contenteditable="${modoEdicao}">${sanitizeRichHtml(row.class)}</span>`;
        tdClass.querySelector(".editable-text").addEventListener("blur", (e) => {
            row.class = sanitizeRichHtml(e.target.innerHTML);
            salvarDados();
        });
        tr.appendChild(tdClass);
        
        meses.forEach(mes => {
            const td = document.createElement("td");
            td.innerHTML = `<span class="editable-text" contenteditable="${modoEdicao}">${sanitizeRichHtml(row[mes] || "-")}</span>`;
            td.querySelector(".editable-text").addEventListener("blur", (e) => {
                row[mes] = sanitizeRichHtml(e.target.innerHTML);
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
    atualizarStatusBases();
    atualizarFiltrosLocalidade();
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

function copiarParaVersao(valor) {
    return valor === undefined ? undefined : JSON.parse(JSON.stringify(valor));
}

function normalizarChaveVersao(valor) {
    return String(valor ?? "").trim().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// A mesma chave é usada ao importar e ao recuperar uma versão. Ela não depende
// da posição da linha na planilha, que pode mudar entre competências.
function obterChaveRegistroEstavel(registro) {
    const mes = registro.mesIdx ?? registro.competencia ?? registro.mes ?? "";
    return [
        registro.contrato ?? registro.cliente,
        registro.localidade,
        registro.pilar,
        registro.grupo,
        registro.indicador,
        mes
    ].map(normalizarChaveVersao).join("\u0000");
}

function atualizarPeriodoPelaCompetencia(competencia) {
    const match = String(competencia || "").match(/^(\d{2})\/(\d{4})$/);
    if (!match) return;

    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const indiceMes = Number(match[1]) - 1;
    if (indiceMes < 0 || indiceMes > 11) return;

    const periodoAnterior = AppState.periodo;
    const periodoNovo = `${meses[indiceMes]}/${match[2]}`;
    const contrato = AppState.contrato || "CBO";
    AppState.periodo = periodoNovo;
    AppState.anoAtual = match[2];

    // Apenas subtítulos automáticos acompanham a competência importada.
    // Um subtítulo que o usuário tenha personalizado continua intacto.
    const dadosContrato = AppState.dadosContratos?.[contrato];
    const cabecalho = dadosContrato?.cabecalho;
    if (cabecalho && (!cabecalho.subtitulo || cabecalho.subtitulo === `${contrato} | ${periodoAnterior}`)) {
        cabecalho.subtitulo = `${contrato} | ${periodoNovo}`;
        AppState.slide2HeaderSubtitle = cabecalho.subtitulo;
    }
}

// Comentários e ajustes visuais pertencem ao registro lógico, e não à posição
// que ele ocupa em uma importação. Esta mesclagem protege esses campos quando
// a base do mesmo contrato/indicador é atualizada.
function preservarInformacoesComplementaresNosRegistros(novosRegistros) {
    if (!Array.isArray(novosRegistros)) return novosRegistros;

    const anterioresPorChave = new Map((AppState.excelData || []).map(registro => [
        registro.registroId || obterChaveRegistroEstavel(registro), registro
    ]));

    return novosRegistros.map(registro => {
        const registroId = obterChaveRegistroEstavel(registro);
        const anterior = anterioresPorChave.get(registroId);
        const resultado = { ...registro, registroId };
        if (anterior) {
            ["comment", "arrow", "status", "icon", "acumAnteriorOverride"].forEach(campo => {
                if (anterior[campo] !== undefined) resultado[campo] = anterior[campo];
            });
        }
        return resultado;
    });
}

function mesclarRegistrosImportados(registrosImportados) {
    const atualizados = preservarInformacoesComplementaresNosRegistros(registrosImportados);
    const porChave = new Map((AppState.excelData || []).map(registro => [
        registro.registroId || obterChaveRegistroEstavel(registro), registro
    ]));
    atualizados.forEach(registro => porChave.set(registro.registroId, registro));
    return [...porChave.values()];
}

function obterAnotacoesIndicadoresDaVersao() {
    return (AppState.indicadores || []).map(indicador => ({
        // contrato + localidade + indicador são a identidade estável do cartão.
        contrato: indicador.scopeContrato || indicador.contrato || AppState.contrato,
        localidade: indicador.scopeLocalidade || indicador.localidade || "todos",
        localidades: indicador.scopeLocalidades || normalizarEscopoLocalidades(indicador.scopeLocalidade || indicador.localidade),
        indicador: indicador.indicador || indicador.title,
        comment: indicador.comment,
        arrow: indicador.arrow,
        status: indicador.status,
        icon: indicador.icon,
        acumAnterior: indicador.acumAnterior
    }));
}

function aplicarAnotacoesIndicadoresDaVersao(anotacoes) {
    if (!Array.isArray(anotacoes) || !Array.isArray(AppState.excelData)) return;

    anotacoes.forEach(anotacao => {
        const contrato = anotacao.contrato || AppState.contrato;
        const localidades = anotacao.localidades || anotacao.localidade || "todos";
        AppState.excelData.forEach(registro => {
            if (registro.contrato !== contrato || registro.indicador !== anotacao.indicador) return;
            if (!linhaPertenceAoEscopoLocalidades(registro, localidades)) return;
            ["comment", "arrow", "status", "icon"].forEach(campo => {
                if (anotacao[campo] !== undefined) registro[campo] = anotacao[campo];
            });
            if (anotacao.acumAnterior !== undefined) registro.acumAnteriorOverride = anotacao.acumAnterior;
        });
    });
}

function restaurarInformacoesComplementaresDaVersao(dadosVersao) {
    if (!dadosVersao || typeof dadosVersao !== "object") return false;

    const atual = AppState;
    const historicoVersoes = atual.historicoVersoes || [];
    const complemento = dadosVersao.complementar || dadosVersao;
    const contrato = atual.contrato;

    // Versões antigas continham o AppState completo. A leitura continua
    // compatível, mas nunca reaproveita excelData nem dados de período delas.
    const camposGlobais = [
        "capaPeriodoTexto", "respMro", "respCliente", "proxReuniao",
        "slide2HeaderContrato", "slide2HeaderTitle", "slide2HeaderSubtitle"
    ];
    camposGlobais.forEach(campo => {
        if (complemento[campo] !== undefined) atual[campo] = copiarParaVersao(complemento[campo]);
    });

    // Snapshots anteriores a cabeçalhos por contrato ainda guardam esses
    // campos no nível principal. Migra-os em memória ao restaurar, sem alterar
    // o formato já armazenado no Supabase.
    if (camposGlobais.some(campo => complemento[campo] !== undefined)) {
        atual.dadosContratos = atual.dadosContratos || {};
        atual.dadosContratos[contrato] = atual.dadosContratos[contrato] || {};
        atual.dadosContratos[contrato].cabecalho = {
            ...(atual.dadosContratos[contrato].cabecalho || {}),
            ...(complemento.slide2HeaderContrato !== undefined ? { contrato: copiarParaVersao(complemento.slide2HeaderContrato) } : {}),
            ...(complemento.slide2HeaderTitle !== undefined ? { titulo: copiarParaVersao(complemento.slide2HeaderTitle) } : {}),
            ...(complemento.slide2HeaderSubtitle !== undefined ? { subtitulo: copiarParaVersao(complemento.slide2HeaderSubtitle) } : {})
        };
    }

    const dadosContratoVersao = complemento.dadosContrato || complemento.dadosContratos?.[contrato];
    if (dadosContratoVersao) {
        atual.dadosContratos = atual.dadosContratos || {};
        atual.dadosContratos[contrato] = {
            ...(atual.dadosContratos[contrato] || {}),
            ...copiarParaVersao(dadosContratoVersao)
        };
    }

    // Compatibilidade com versões anteriores, que guardavam as listas também
    // no nível principal do snapshot.
    ["destaques", "atencoes", "passos", "pendenciasMro", "pendenciasCliente",
        "reunioesExecutivas", "slide11Participants"].forEach(campo => {
        if (complemento[campo] === undefined) return;
        atual.dadosContratos = atual.dadosContratos || {};
        atual.dadosContratos[contrato] = atual.dadosContratos[contrato] || {};
        atual.dadosContratos[contrato][campo] = copiarParaVersao(complemento[campo]);
    });

    if (complemento.acoes?.direcionadoresAcoes !== undefined) {
        atual.acoes = atual.acoes || {};
        atual.acoes.direcionadoresAcoes = copiarParaVersao(complemento.acoes.direcionadoresAcoes);
    }

    const restaurouSlas = Array.isArray(complemento.slas);
    if (restaurouSlas) {
        atual.slas = copiarParaVersao(complemento.slas);
    }

    aplicarAnotacoesIndicadoresDaVersao(complemento.anotacoesIndicadores || complemento.indicadores);
    atual.historicoVersoes = historicoVersoes;
    sincronizarDadosContratoAtivo();
    return restaurouSlas;
}

// Salva o conteúdo editorial no Supabase para compartilhamento e persistência.
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
        formato: "complementar-v3",
        contrato: AppState.contrato,
        complementar: {
        respMro: AppState.respMro,
        respCliente: AppState.respCliente,
        proxReuniao: AppState.proxReuniao,
        capaPeriodoTexto: AppState.capaPeriodoTexto,
        slide2HeaderContrato: AppState.slide2HeaderContrato,
        slide2HeaderTitle: AppState.slide2HeaderTitle,
        slide2HeaderSubtitle: AppState.slide2HeaderSubtitle,
        dadosContrato: copiarParaVersao(AppState.dadosContratos?.[AppState.contrato] || {}),
        acoes: { direcionadoresAcoes: copiarParaVersao(AppState.acoes?.direcionadoresAcoes || []) },
        slas: (AppState.slas || []).map(item => ({
            ...copiarParaVersao(item),
            scopeContrato: item.scopeContrato || AppState.contrato,
            scopeLocalidade: item.scopeLocalidade || "todos",
            scopeLocalidades: item.scopeLocalidades || obterLocalidadesSelecionadas()
        })),
        anotacoesIndicadores: obterAnotacoesIndicadoresDaVersao()
        }
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
        AppState.historicoVersoes = [
            ...(AppState.historicoVersoes || []).filter(versao => versao.id !== novaVersao.id),
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
    const mesesExt = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    
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

function normalizarParteChaveHistorica(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function obterAcumuladoHistoricoFixo(contrato, localidade, indicador) {
    const base = window.MRO_ACUMULADO_2025;
    if (!base?.valores) return null;

    const aliasesContrato = {
        "equatorial - go": "equatorial go",
        "petrobras - gas": "petrobras"
    };
    const contratoNormalizado = normalizarParteChaveHistorica(contrato);
    const contratoKey = aliasesContrato[contratoNormalizado] || contratoNormalizado;
    const indicadorKey = normalizarParteChaveHistorica(indicador);
    const localidades = normalizarEscopoLocalidades(localidade);
    const chaveContrato = `${contratoKey}|*|${indicadorKey}`;

    if (localidades.includes("todos")) {
        return Object.prototype.hasOwnProperty.call(base.valores, chaveContrato)
            ? base.valores[chaveContrato]
            : null;
    }

    const seriesSelecionadas = localidades
        .map(item => `${contratoKey}|${normalizarParteChaveHistorica(item)}|${indicadorKey}`)
        .map(chave => base.series?.[chave])
        .filter(Boolean);
    if (seriesSelecionadas.length === 0) return null;

    if (seriesSelecionadas[0].a) {
        return parseFloat(seriesSelecionadas.reduce((total, serie) =>
            total + serie.m.reduce((soma, mes) => soma + (mes?.[0] || 0), 0), 0
        ).toFixed(4));
    }

    const mediasMensais = [];
    for (let mesIdx = 0; mesIdx < 12; mesIdx++) {
        let soma = 0;
        let quantidade = 0;
        seriesSelecionadas.forEach(serie => {
            const mes = serie.m[mesIdx];
            if (mes) {
                soma += mes[0];
                quantidade += mes[1];
            }
        });
        if (quantidade > 0) mediasMensais.push(soma / quantidade);
    }
    if (mediasMensais.length === 0) return null;
    return parseFloat((mediasMensais.reduce((a, b) => a + b, 0) / mediasMensais.length).toFixed(1));
}

const SLOT_INDICADORES = [
    { key: "cpt", name: "Acidentes do Trabalho CPT", isPercentage: false, formula: "Nº de Acidentes CPT" },
    { key: "spt", name: "Acidentes do Trabalho SPT", isPercentage: false, formula: "Nº de Acidentes SPT" },
    { key: "descarga", name: "Nível de Serviço de Descarga", isPercentage: true, formula: "Percentual de Descarga" },
    { key: "ofr", name: "Order Fill Rate (OFR)", isPercentage: true, formula: "Percentual de OFR" },
    { key: "qi", name: "Quality Inbound (QI)", isPercentage: true, formula: "Percentual de QI" },
    { key: "turnover", name: "Turnover", isPercentage: true, formula: "Média de Turnover" }
];

function obterLocalidadesSelecionadas() {
    if (!filterLocalidade) return ["todos"];
    const selecionadas = [...filterLocalidade.querySelectorAll('input[type="checkbox"]:checked')]
        .map(input => input.value);
    return selecionadas.length > 0 ? selecionadas : ["todos"];
}

function normalizarEscopoLocalidades(escopo) {
    if (Array.isArray(escopo)) return escopo.length > 0 ? escopo : ["todos"];
    return escopo ? [escopo] : ["todos"];
}

function linhaPertenceAoEscopoLocalidades(row, escopo) {
    const localidades = normalizarEscopoLocalidades(escopo);
    return localidades.includes("todos") || localidades.includes(row.localidade);
}

function atualizarResumoFiltroLocalidade() {
    if (!filterLocalidadeResumo) return;
    const selecionadas = obterLocalidadesSelecionadas();
    if (selecionadas.includes("todos")) {
        filterLocalidadeResumo.textContent = "Todas as localidades";
    } else if (selecionadas.length === 1) {
        filterLocalidadeResumo.textContent = selecionadas[0];
    } else {
        filterLocalidadeResumo.textContent = `${selecionadas.length} localidades selecionadas`;
    }
}

function criarOpcaoLocalidade(valor, texto, marcada) {
    const id = `localidade-${normalizarParteChaveHistorica(valor).replace(/[^a-z0-9]+/g, "-") || "todos"}`;
    const label = document.createElement("label");
    label.className = "localidade-option";
    label.htmlFor = id;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.value = valor;
    input.checked = marcada;

    const span = document.createElement("span");
    span.textContent = texto;
    label.append(input, span);
    return label;
}

// Atualiza a lista de localidades com base no contrato ativo, preservando
// todas as opções ainda válidas que o usuário já havia marcado.
function atualizarFiltrosLocalidade() {
    if (!filterLocalidade) return;

    const selecaoAnterior = new Set(obterLocalidadesSelecionadas());
    const contratoAtivo = filterContrato?.value || "todos";
    const localidadesSet = new Set();
    (AppState.excelData || []).forEach(row => {
        if ((contratoAtivo === "todos" || row.contrato === contratoAtivo) && row.localidade) {
            localidadesSet.add(row.localidade);
        }
    });

    const localidades = [...localidadesSet].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const manterTodas = selecaoAnterior.has("todos") ||
        !localidades.some(localidade => selecaoAnterior.has(localidade));

    filterLocalidade.replaceChildren(
        criarOpcaoLocalidade("todos", "Todas as localidades", manterTodas),
        ...localidades.map(localidade => criarOpcaoLocalidade(
            localidade,
            localidade,
            !manterTodas && selecaoAnterior.has(localidade)
        ))
    );
    atualizarResumoFiltroLocalidade();
}

// Atualiza todas as exibições com base nos filtros
function atualizarDashboardECartas(opcoes = {}) {
    AppState.contrato = filterContrato.value;
    
    // Sincroniza dados do contrato ativo antes de renderizar (destaques, reuniões, etc.)
    sincronizarDadosContratoAtivo();
    
    renderizarDadosGlobais();
    
    const dadosFiltrados = obterDadosFiltrados();

    // O One Page é a fonte da ordem de apresentação. Acidentes CPT e SPT são
    // prioridades fixas; os demais indicadores respeitam a sequência escolhida
    // pelo usuário na tabela de SLA.
    if (opcoes.preservarSlas) {
        atualizarSlasPreservandoSelecao(dadosFiltrados, AppState.slas || []);
    } else {
        atualizarSlasComDadosExcel(dadosFiltrados);
    }
    garantirAcidentesNoInicioDosSlas();
    renderTabelaSLAs();
    const dadosOrdenados = ordenarIndicadoresPelosSlas(dadosFiltrados, AppState.slas || []);
    
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
    
    // Os slides seguem exatamente a ordem visível no SLA do One Page.
    recriarSlidesGraficosDinamicamente(dadosOrdenados);
    renderizarMenuSlides();
    
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
        const matchLocalidade = linhaPertenceAoEscopoLocalidades(
            row,
            ind.scopeLocalidades || ind.scopeLocalidade
        );
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
    const scopeLocalidade = ind.scopeLocalidades || ind.scopeLocalidade || ind.localidade || "todos";
    const pertenceAoGrafico = row =>
        row.indicador === ind.indicador &&
        row.contrato === scopeContrato &&
        linhaPertenceAoEscopoLocalidades(row, scopeLocalidade);

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
    const localidadesSel = obterLocalidadesSelecionadas();
    const todasLocalidades = localidadesSel.includes("todos");
    const localidadeEscopo = todasLocalidades ? "todos" : [...localidadesSel];
    
    // Se tivermos planilha de Excel, filtramos dela e mantemos os objetos originais por referência
    if (AppState.excelData && AppState.excelData.length > 0) {
        const filteredRaw = AppState.excelData.filter(row => {
            const matchContrato = contratoSel === "todos" || row.contrato === contratoSel;
            const matchLocalidade = todasLocalidades || localidadesSel.includes(row.localidade);
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
                const isPct = typeof row.isPercentage === "boolean"
                    ? row.isPercentage
                    : !nameLower.includes("acidente") && !nameLower.includes("cpt") && !nameLower.includes("spt");
                const metodoAcumulado = row.metodoAcumulado ||
                    (nameLower.includes("acidente") || nameLower.includes("cpt") || nameLower.includes("spt") ? "soma" : "media");
                
                grouped[groupKey] = {
                    id: `${rowContrato}-${indName}`.toLowerCase().replace(/[^a-z0-9]/g, ""),
                    contrato: rowContrato,
                    localidade: localidadeEscopo,
                    scopeContrato: rowContrato,
                    scopeLocalidade: localidadeEscopo,
                    scopeLocalidades: todasLocalidades ? ["todos"] : [...localidadesSel],
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
                    metodoAcumulado,
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
            const usaSoma = ind.metodoAcumulado === "soma";
            
            for (let m = 0; m < 12; m++) {
                // Consolida os dados mensais
                const vals = ind.monthlyRawValues[m];
                if (vals.length > 0) {
                    if (usaSoma) {
                        ind.dados[m] = vals.reduce((a, b) => a + b, 0); // Soma indicadores totalizáveis
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
                if (usaSoma) {
                    ind.acumAtual = validConsolidated.reduce((a, b) => a + b, 0); // Soma conforme cadastro
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
                    const matchLocalidade = linhaPertenceAoEscopoLocalidades(
                        row,
                        ind.scopeLocalidades || ind.scopeLocalidade
                    );
                    return matchContrato && matchLocalidade && row.indicador === ind.indicador;
                }) : [];
                
                const prevVals = [];
                prevRows.forEach(row => {
                    const v = parseValorDadosBase(row.dadosBase, ind.isPercentage);
                    if (v !== null) prevVals.push(v);
                });
                
                if (prevVals.length > 0) {
                    if (usaSoma) {
                        oldAcum = prevVals.reduce((a, b) => a + b, 0);
                    } else {
                        oldAcum = parseFloat((prevVals.reduce((a, b) => a + b, 0) / prevVals.length).toFixed(1));
                    }
                }
            }
            
            if (oldAcum === null) {
                oldAcum = obterAcumuladoHistoricoFixo(
                    ind.scopeContrato,
                    ind.scopeLocalidades || ind.scopeLocalidade,
                    ind.indicador
                );
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
            <h3 class="chart-slide-title">${escapeHtml(ind.indicador)}</h3>
            
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
                    <span class="meta-box-value editable-text" data-id="${id}" data-type="meta" contenteditable="${modoEdicao}">${sanitizeRichHtml(ind.meta)}</span>
                </div>
                <div class="meta-box-item">
                    <span class="meta-box-label">Fórmula de Cálculo:</span>
                    <span class="meta-box-value editable-text" data-id="${id}" data-type="formula" contenteditable="${modoEdicao}">${sanitizeRichHtml(ind.formula || "Fórmula padrão")}</span>
                </div>
                <div class="meta-box-comment ${(!ind.comment || ind.comment.trim() === "" || ind.comment.replace(/<[^>]*>?/gm, "").trim() === "Comentário sobre o indicador:") ? "empty-comment" : ""}">
                    <span class="meta-box-label">Comentário sobre o indicador:</span>
                    <div class="meta-box-textarea editable-text" data-id="${id}" data-type="comment" contenteditable="${modoEdicao}" placeholder="Digite seu comentário aqui...">${sanitizeRichHtml(ind.comment || "Comentário sobre o indicador:")}</div>
                </div>
            </div>
            
            <div class="chart-logo-footer">
                <img src="mro_logo.png" alt="MRO Logo">
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
                ind[type] = sanitizeRichHtml(e.target.innerHTML);
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
    const slideAcoes = document.querySelector(".slide-container[data-static='acoes']");
    const slideCrono1 = document.querySelector(".slide-container[data-static='crono1']");
    const slideCrono2 = document.querySelector(".slide-container[data-static='crono2']");
    
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
        setSafeRichText(text, item);
        text.addEventListener("blur", () => {
            values[index] = obterHtmlEditavelOuFallback(text, "Novo item");
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

let slaDragIndex = null;

function renderTabelaSLAs() {
    const tbody = document.querySelector("#table-slas tbody");
    if (!tbody) return;

    tbody.replaceChildren();
    (AppState.slas || []).forEach((item, index) => {
        const row = document.createElement("tr");
        row.dataset.slaIndex = index;
        const acidenteComPosicaoFixa = obterPrioridadeIndicadorAcidente(item.sla) < 2;
        row.draggable = modoEdicao && !acidenteComPosicaoFixa;
        const status = ["green", "yellow", "red"].includes(item.status) ? item.status : "green";
        row.className = `row-status-${status}${row.draggable ? " sla-row-draggable" : ""}`;

        row.addEventListener("dragstart", event => {
            if (!modoEdicao) {
                event.preventDefault();
                return;
            }
            slaDragIndex = index;
            row.classList.add("sla-row-dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(index));
        });
        row.addEventListener("dragover", event => {
            if (!modoEdicao || slaDragIndex === null || slaDragIndex === index) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            row.classList.add("sla-drop-target");
        });
        row.addEventListener("dragleave", () => row.classList.remove("sla-drop-target"));
        row.addEventListener("drop", event => {
            if (!modoEdicao) return;
            event.preventDefault();
            row.classList.remove("sla-drop-target");
            const origem = slaDragIndex ?? Number(event.dataTransfer.getData("text/plain"));
            slaDragIndex = null;
            moverSlaParaPosicao(origem, index);
        });
        row.addEventListener("dragend", () => {
            slaDragIndex = null;
            row.classList.remove("sla-row-dragging");
            document.querySelectorAll("#table-slas tbody .sla-drop-target")
                .forEach(item => item.classList.remove("sla-drop-target"));
        });

        const nome = document.createElement("td");
        const dragHandle = document.createElement("span");
        dragHandle.className = `sla-drag-handle edit-only-inline${acidenteComPosicaoFixa ? " sla-drag-handle-fixed" : ""}`;
        dragHandle.title = acidenteComPosicaoFixa ? "Indicador fixo no início" : "Arraste para ordenar o indicador";
        dragHandle.setAttribute("aria-hidden", "true");
        dragHandle.textContent = acidenteComPosicaoFixa ? "●" : "⋮⋮";
        const nomeText = document.createElement("span");
        nomeText.className = "editable-text";
        nomeText.dataset.field = "sla";
        nomeText.contentEditable = modoEdicao ? "true" : "false";
        setSafeRichText(nomeText, item.sla || "");
        nomeText.addEventListener("blur", () => window.updateSlaField(index, "sla", nomeText.innerHTML, nomeText.textContent));
        nome.append(dragHandle, nomeText);
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
            valueText.dataset.field = field;
            valueText.contentEditable = modoEdicao ? "true" : "false";
            setSafeRichText(valueText, value ?? "-");
            valueText.addEventListener("blur", () => window.updateSlaField(index, field, valueText.innerHTML, valueText.textContent));
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
        moveUpButton.disabled = acidenteComPosicaoFixa || index === 0;
        moveUpButton.addEventListener("click", () => window.moveSlaIndicator(index, -1));

        const moveDownButton = document.createElement("button");
        moveDownButton.type = "button";
        moveDownButton.className = "sla-order-button";
        moveDownButton.title = "Mover indicador para baixo";
        moveDownButton.setAttribute("aria-label", "Mover indicador para baixo");
        moveDownButton.textContent = "↓";
        moveDownButton.disabled = acidenteComPosicaoFixa || index === (AppState.slas || []).length - 1;
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

window.updateSlaField = function(index, field, value, plainText = value) {
    if (!AppState.slas || !AppState.slas[index]) return;
    AppState.slas[index][field] = String(plainText).trim() ? sanitizeRichHtml(value) : "-";
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

function moverSlaParaPosicao(index, destination) {
    if (!modoEdicao || !Array.isArray(AppState.slas)) return;
    if (index < 0 || destination < 0 || index >= AppState.slas.length || destination >= AppState.slas.length) return;
    if (index === destination) return;

    sincronizarMetadadosOnePageDoDOM();
    const [movido] = AppState.slas.splice(index, 1);
    AppState.slas.splice(destination, 0, movido);
    garantirAcidentesNoInicioDosSlas();
    salvarDados();
    atualizarDashboardECartas({ preservarSlas: true });
    autoFitCompact();

    const novaPosicao = AppState.slas.indexOf(movido);
    const movedRow = document.querySelector(`#table-slas tbody tr:nth-child(${novaPosicao + 1})`);
    if (movedRow) movedRow.classList.add("sla-row-moved");
}

window.moveSlaIndicator = function(index, direction) {
    moverSlaParaPosicao(index, index + direction);
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
            hasOverride: hasOverride,
            scopeContrato: ind.scopeContrato || ind.contrato || AppState.contrato,
            scopeLocalidade: ind.scopeLocalidade || ind.localidade || "todos",
            scopeLocalidades: ind.scopeLocalidades || normalizarEscopoLocalidades(ind.scopeLocalidade || ind.localidade)
        };
    });
    
    renderTabelaSLAs();
}

function normalizarIdentificadorSla(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterPrioridadeIndicadorAcidente(valor) {
    const nome = normalizarIdentificadorSla(valor);
    if (nome.includes("acidentes do trabalho cpt")) return 0;
    if (nome.includes("acidentes do trabalho spt")) return 1;
    return 2;
}

function garantirAcidentesNoInicioDosSlas() {
    if (!Array.isArray(AppState.slas)) return;
    AppState.slas = AppState.slas
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
            const prioridade = obterPrioridadeIndicadorAcidente(a.item?.sla) - obterPrioridadeIndicadorAcidente(b.item?.sla);
            return prioridade || a.index - b.index;
        })
        .map(({ item }) => item);
}

function ordenarIndicadoresPelosSlas(dadosFiltrados, slas) {
    const dados = Array.isArray(dadosFiltrados) ? dadosFiltrados : [];
    const usados = new Set();
    const ordenados = [];

    (slas || []).forEach(sla => {
        const indice = dados.findIndex((indicador, index) =>
            !usados.has(index) && indicadorCorrespondeAoSla(indicador, sla)
        );
        if (indice < 0) return;
        usados.add(indice);
        ordenados.push(dados[indice]);
    });

    dados.forEach((indicador, index) => {
        if (!usados.has(index)) ordenados.push(indicador);
    });
    return ordenados;
}

function indicadorCorrespondeAoSla(indicador, slaSalvo) {
    if (normalizarIdentificadorSla(indicador?.indicador) !== normalizarIdentificadorSla(slaSalvo?.sla)) {
        return false;
    }

    const contratoSalvo = slaSalvo.scopeContrato;
    const localidadeSalva = slaSalvo.scopeLocalidades || slaSalvo.scopeLocalidade;
    const contratoIndicador = indicador.scopeContrato || indicador.contrato;
    const localidadeIndicador = indicador.scopeLocalidades || indicador.scopeLocalidade || indicador.localidade;

    if (contratoSalvo && contratoIndicador && contratoSalvo !== contratoIndicador) return false;
    const salvas = normalizarEscopoLocalidades(localidadeSalva);
    const atuais = normalizarEscopoLocalidades(localidadeIndicador);
    if (!salvas.includes("todos")) {
        const chaveSalva = [...salvas].sort().join("\u0000");
        const chaveAtual = [...atuais].sort().join("\u0000");
        if (chaveSalva !== chaveAtual) return false;
    }
    return true;
}

function atualizarSlasPreservandoSelecao(dadosFiltrados, slasSalvos) {
    const snapshot = copiarParaVersao(Array.isArray(slasSalvos) ? slasSalvos : []);
    if (snapshot.length === 0) {
        AppState.slas = [];
        renderTabelaSLAs();
        return;
    }

    const usados = new Set();
    const correspondencias = snapshot.map(slaSalvo => {
        const indice = (dadosFiltrados || []).findIndex((indicador, index) =>
            !usados.has(index) && indicadorCorrespondeAoSla(indicador, slaSalvo)
        );
        if (indice >= 0) usados.add(indice);
        return { slaSalvo, indicador: indice >= 0 ? dadosFiltrados[indice] : null };
    });

    const indicadoresEncontrados = correspondencias
        .filter(item => item.indicador)
        .map(item => item.indicador);

    let slasAtualizados = [];
    if (indicadoresEncontrados.length > 0) {
        atualizarSlasComDadosExcel(indicadoresEncontrados);
        slasAtualizados = copiarParaVersao(AppState.slas || []);
    }

    let indiceAtualizado = 0;
    AppState.slas = correspondencias.map(({ slaSalvo, indicador }) => {
        if (!indicador) return slaSalvo;
        const atualizado = slasAtualizados[indiceAtualizado++] || {};
        return {
            ...slaSalvo,
            ...atualizado,
            sla: slaSalvo.sla,
            status: slaSalvo.status ?? atualizado.status,
            icon: slaSalvo.icon ?? atualizado.icon,
            scopeContrato: slaSalvo.scopeContrato || indicador.scopeContrato || indicador.contrato || AppState.contrato,
            scopeLocalidade: slaSalvo.scopeLocalidade || indicador.scopeLocalidade || indicador.localidade || "todos"
        };
    });

    renderTabelaSLAs();
}

function fecharModalGrafico() {
    if (chartDataModal) {
        chartDataModal.classList.remove("active");
        chartDataModal.setAttribute("aria-hidden", "true");
    }
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
        <td><input type="number" step="any" id="modal-val-acum2025" value="${escapeAttribute(ind.acumAnterior !== null ? ind.acumAnterior : '')}"></td>
        <td>-</td>
    `;
    modalDataTbody.appendChild(tr);
    
    // JAN a DEZ
    ind.dados.forEach((val, mIdx) => {
        tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${MESES[mIdx]}</strong></td>
            <td><input type="number" step="any" class="modal-month-val" data-month="${mIdx}" value="${escapeAttribute(val !== null ? val : '')}"></td>
            <td><input type="number" step="any" class="modal-month-meta" data-month="${mIdx}" value="${escapeAttribute(ind.metaDados[mIdx] !== null ? ind.metaDados[mIdx] : '')}"></td>
        `;
        modalDataTbody.appendChild(tr);
    });
    
    // ACUM atual
    tr = document.createElement("tr");
    tr.innerHTML = `
        <td><strong>ACUM atual</strong></td>
        <td><input type="number" step="any" id="modal-val-acum2026" value="${escapeAttribute(ind.acumAtual !== null ? ind.acumAtual : '')}"></td>
        <td>-</td>
    `;
    modalDataTbody.appendChild(tr);
    
    chartDataModal.classList.add("active");
    chartDataModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => chartDataModal.querySelector(".modal-container")?.focus());
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
        alert('Módulo de validação Supabase não carregado.');
    }
}

// Aplica na interface exatamente os registros que acabaram de ser persistidos.
// Assim os slides não dependem de uma segunda consulta ao Supabase para aparecer.
window.aplicarRegistrosImportados = function(records) {
    if (!Array.isArray(records) || records.length === 0) return;

    AppState.excelData = mesclarRegistrosImportados(records.map(record => ({
        localidade: record.localidade,
        contrato: record.cliente,
        pilar: record.pilar,
        grupo: record.grupo,
        indicador: record.indicador,
        mesIdx: Math.max(0, parseInt(record.competencia.split('/')[0], 10) - 1),
        dadosBase: record.dados_base,
        meta: record.meta,
        formula: record.formula_calculo
    })));

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
    // A exportação usa um clone isolado. Assim, os cards podem crescer e se
    // redistribuir sem alterar a tela de edição nem sobrescrever estilos inline
    // (fonte, tamanho, cor e ênfases) escolhidos pelo usuário.
    const renderStage = document.createElement("div");
    renderStage.className = "onepage-export-render-stage capturing";

    const exportSlide = slideOriginal.cloneNode(true);
    exportSlide.classList.remove("compact-1", "compact-2", "compact-3");
    exportSlide.classList.add("active", "onepage-export-layout");
    exportSlide.querySelectorAll("[style]").forEach(element => {
        const inlineColor = element.style.getPropertyValue("color");
        if (inlineColor) element.style.setProperty("color", inlineColor, "important");
    });
    exportSlide.querySelectorAll("[contenteditable]").forEach(element => {
        element.setAttribute("contenteditable", "false");
    });
    renderStage.appendChild(exportSlide);
    document.body.appendChild(renderStage);

    // O texto padrão da próxima reunião é apenas uma orientação de edição e
    // não deve aparecer no arquivo quando nenhuma data foi informada.
    const proxReuniao = exportSlide.querySelector("#txt-prox-reuniao");
    const proxReuniaoTexto = proxReuniao ? proxReuniao.textContent.trim() : "";
    const ocultarPlaceholderProximaReuniao = proxReuniao && (
        proxReuniaoTexto === "" || /^dd\s*\/\s*mm\s*\/\s*(?:aa|aaaa)$/i.test(proxReuniaoTexto)
    );

    if (ocultarPlaceholderProximaReuniao) {
        proxReuniao.innerHTML = "";
    }

    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Testa proporções de coluna e mantém a que exige menos altura. A fonte
    // nunca participa deste cálculo: somente a distribuição horizontal muda.
    const grid = exportSlide.querySelector(".onepage-grid");
    if (grid) {
        let melhorPercentual = 37;
        let menorAltura = Number.POSITIVE_INFINITY;
        [36, 40, 32, 44, 48, 52, 56, 60].forEach(percentual => {
            grid.style.gridTemplateColumns = `${percentual}fr ${100 - percentual}fr`;
            const altura = exportSlide.scrollHeight;
            if (altura < menorAltura) {
                menorAltura = altura;
                melhorPercentual = percentual;
            }
        });
        grid.style.gridTemplateColumns = `${melhorPercentual}fr ${100 - melhorPercentual}fr`;
    }

    // Antes de aumentar a página, recupera espaço apenas em paddings, margens
    // e gaps. As classes compactas não contêm mais nenhuma regra de fonte.
    if (exportSlide.scrollHeight > 720) {
        exportSlide.classList.add("compact-1");
        if (exportSlide.scrollHeight > 720) {
            exportSlide.classList.add("compact-2");
            if (exportSlide.scrollHeight > 720) exportSlide.classList.add("compact-3");
        }
    }

    // Na fileira inferior, cards com mais texto recebem proporcionalmente mais
    // largura. Isso reduz quebras de linha sem modificar nenhum estilo de texto.
    const cardsInferiores = Array.from(exportSlide.querySelectorAll(".cards-row > .card"));
    cardsInferiores.forEach(card => {
        const caracteres = Math.max(1, (card.textContent || "").trim().length);
        card.style.flex = `${Math.min(3, Math.max(1, caracteres / 80))} 1 0`;
    });

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const captureHeight = Math.max(720, Math.ceil(exportSlide.scrollHeight));
    exportSlide.style.height = `${captureHeight}px`;
    exportSlide.style.minHeight = `${captureHeight}px`;

    return {
        element: exportSlide,
        height: captureHeight,
        cleanup() {
            renderStage.remove();
        }
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

                const captureHeight = exportVersion.height;
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
                    pdf.addPage([1280, captureHeight], captureHeight > 1280 ? "portrait" : "landscape");
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
        let onePageHeight = 720;
        const onePageInfo = slides.find(slide => slide.index === 2);
        if (onePageInfo) {
            const measuredOnePage = await criarOnePageParaExportacao(onePageInfo.element);
            onePageHeight = measuredOnePage.height;
            measuredOnePage.cleanup();
        }

        // Um PowerPoint possui um único tamanho de página. Se o One Page
        // precisar crescer, o deck cresce junto, preservando a escala dos
        // textos em vez de comprimir a imagem verticalmente.
        const deckHeightInches = Math.max(5.625, onePageHeight / 128);
        const pres = new PptxGenJS();
        pres.defineLayout({ name: "ONEPAGE_RESPONSIVE", width: 10, height: deckHeightInches });
        pres.layout = "ONEPAGE_RESPONSIVE";
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
            const drawH = exportVersion.height / 128;
            const drawY = (deckHeightInches - drawH) / 2;

            const pptSlide = pres.addSlide();
            pptSlide.background = { color: "FFFFFF" };
            pptSlide.addImage({ data: imageData, x: 0, y: drawY, w: drawW, h: drawH });
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
    
    const dadosFiltrados = obterDadosFiltrados();
    const TOTAL_SLIDES = 5 + dadosFiltrados.length;

    let onePageHeight = 720;
    const onePageOriginal = document.querySelector(".slide-container[data-index='2']");
    if (onePageOriginal) {
        const measuredOnePage = await criarOnePageParaExportacao(onePageOriginal);
        onePageHeight = measuredOnePage.height;
        measuredOnePage.cleanup();
    }

    const deckHeightInches = Math.max(5.625, onePageHeight / 128);
    const pres = new PptxGenJS();
    pres.defineLayout({ name: "ONEPAGE_RESPONSIVE", width: 10, height: deckHeightInches });
    pres.layout = "ONEPAGE_RESPONSIVE";
    
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
                        
                        // Mantém a escala 128 px = 1 polegada. Páginas mais altas
                        // crescem sem reduzir fontes, colunas ou conteúdo.
                        const drawW = 10;
                        const drawH = exportVersion.height / 128;
                        const drawX = 0;
                        const drawY = (deckHeightInches - drawH) / 2;

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

                            // O editor grava estilos em elementos filhos (span/font).
                            // Converte cada trecho em um run do PptxGenJS para manter
                            // cor, tamanho e ênfases aplicadas individualmente.
                            const textRuns = [];
                            function appendRun(text, runStyle) {
                                if (!text) return;
                                const normalizedText = text.replace(/\u00a0/g, " ");
                                if (!normalizedText) return;

                                const runOptions = {
                                    color: rgbToHex(runStyle.color) || defaultColor,
                                    fontFace: runStyle.fontFamily.includes("Outfit") ? "Outfit" : defaultFont,
                                    fontSize: parseFloat(runStyle.fontSize) * 0.75
                                };
                                const numericWeight = parseInt(runStyle.fontWeight, 10);
                                if (runStyle.fontWeight === "bold" || (!Number.isNaN(numericWeight) && numericWeight > 500)) {
                                    runOptions.bold = true;
                                }
                                if (runStyle.fontStyle === "italic") runOptions.italic = true;
                                if (runStyle.textDecorationLine?.includes("underline")) runOptions.underline = true;

                                const previous = textRuns[textRuns.length - 1];
                                if (previous && JSON.stringify(previous.options) === JSON.stringify(runOptions)) {
                                    previous.text += normalizedText;
                                } else {
                                    textRuns.push({ text: normalizedText, options: runOptions });
                                }
                            }

                            function walkRichText(node) {
                                if (node.nodeType === Node.TEXT_NODE) {
                                    appendRun(node.nodeValue, window.getComputedStyle(node.parentElement || el));
                                    return;
                                }
                                if (node.nodeType !== Node.ELEMENT_NODE) return;
                                if (node.matches(".bullet-actions, .edit-only-inline, .edit-only-block")) return;
                                if (window.getComputedStyle(node).display === "none") return;
                                if (node.tagName === "BR") {
                                    appendRun("\n", window.getComputedStyle(node.parentElement || el));
                                    return;
                                }
                                Array.from(node.childNodes).forEach(walkRichText);
                            }

                            walkRichText(el);
                            if (!textRuns.length) return;
                            textRuns[0].text = textRuns[0].text.replace(/^\s+/, "");
                            textRuns[textRuns.length - 1].text = textRuns[textRuns.length - 1].text.replace(/\s+$/, "");
                            const richText = textRuns.filter(run => run.text.length > 0);
                            if (!richText.length) return;
                            
                            if (isLi) {
                                coords.bullet = true;
                                coords.align = "left";
                            }
                            
                            s.addText(richText, coords);
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
        let inner = sanitizeRichHtml(currentEditingElement.innerHTML);
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
// INTEGRAÇÃO COM SUPABASE - CARREGAMENTO
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
                AppState.excelData = preservarInformacoesComplementaresNosRegistros(dados.excelData);
                atualizarPeriodoPelaCompetencia(dados.competencia);
                Object.assign(AppState, dados.comentarios);
                atualizarFiltrosLocalidade();
                salvarDados(); // Cache local
                console.log("Dados atualizados com sucesso via Supabase.");
            } else {
                AppState.excelData = [];
                atualizarFiltrosLocalidade();
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
    
    if (btn) btn.textContent = 'Atualizar Gráficos';
};
