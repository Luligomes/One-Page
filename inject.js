const fs = require('fs');
const path = 'C:/Users/Luiza.gomes/.gemini/antigravity/scratch/boletim-clientes/app.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /function exportarPPTXEditavel\(\) \{[\s\S]*?(?=\n\/\/ ==========================================================================|\nfunction |\n$)/;
const newFunc = unction exportarPPTXEditavel() {
    const exportOverlay = document.getElementById("export-overlay");
    const statusText = document.getElementById("export-status-text");
    const progressFill = document.getElementById("export-progress-fill");
    
    exportOverlay.style.display = "flex";
    statusText.textContent = "Gerando PPTX Híbrido com Alinhamento Dinâmico...";
    if (progressFill) progressFill.style.width = "0%";
    
    const modoAnterior = modoEdicao;
    modoEdicao = false;
    atualizarModoUI();
    
    slideCaptureArea.classList.add("capturing");
    
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
    
    function getCoords(el, containerEl) {
        const rect = el.getBoundingClientRect();
        const contRect = containerEl.getBoundingClientRect();
        const x = (rect.left - contRect.left) / 128;
        let y = (rect.top - contRect.top) / 128;
        const w = rect.width / 128;
        let h = rect.height / 128;
        const compStyle = window.getComputedStyle(el);
        const fontSizePx = parseFloat(compStyle.fontSize);
        const fontSizePt = fontSizePx * 0.75;
        let align = compStyle.textAlign;
        if (align === "start") align = "left";
        if (align === "end") align = "right";
        
        // Ajuste fino de padding vertical do PPTX
        y = y - (0.05); // shift up slightly to match HTML line-height rendering
        
        return { x, y, w, h, fontSize: fontSizePt, align, margin: 0 };
    }
    
    function rgbToHex(rgbStr) {
        const rgb = rgbStr.match(/\\d+/g);
        if (!rgb || rgb.length < 3) return "000000";
        const hex = rgb.slice(0,3).map(x => {
            const h = parseInt(x).toString(16);
            return h.length === 1 ? "0" + h : h;
        }).join("");
        return hex.toUpperCase();
    }
    
    function cloneTextNode(s, el, containerEl, defaultColor, defaultFont, isLi = false) {
        if (!el) return;
        const coords = getCoords(el, containerEl);
        const style = window.getComputedStyle(el);
        coords.color = rgbToHex(style.color) || defaultColor;
        coords.fontFace = style.fontFamily.includes("Outfit") ? "Outfit" : defaultFont;
        if(style.fontWeight > 500) coords.bold = true;
        
        let text = el.innerText || el.textContent;
        text = text.trim();
        if(!text) return;
        
        if (isLi) {
            text = "• " + text;
            coords.align = "left";
        }
        
        s.addText(text, coords);
    }
    
    for (let sIdx = 1; sIdx <= TOTAL_SLIDES; sIdx++) {
        promiseSequence = promiseSequence.then(() => {
            return new Promise((resolve) => {
                selecionarSlide(sIdx);
                const progressPct = Math.round(((sIdx - 1) / TOTAL_SLIDES) * 100);
                if (progressFill) progressFill.style.width = progressPct + "%";
                statusText.textContent = "Processando slide " + sIdx + " de " + TOTAL_SLIDES + "...";
                
                setTimeout(() => {
                    const slideElem = document.querySelector(".slide-container[data-index='" + sIdx + "']");
                    if (!slideElem) {
                        resolve();
                        return;
                    }
                    
                    if (sIdx === 1 || sIdx === 2) {
                        slideElem.classList.add("hide-text-for-capture");
                    }
                    
                    html2canvas(slideElem, { scale: 2, useCORS: true, logging: false }).then(canvas => {
                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        const s = pres.addSlide();
                        s.background = { fill: "FFFFFF" };
                        
                        s.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
                        
                        if (sIdx === 1 || sIdx === 2) {
                            slideElem.classList.remove("hide-text-for-capture");
                        }
                        
                        if (sIdx === 1) {
                            cloneTextNode(s, slideElem.querySelector(".capa-subtitle"), slideElem, "00B080", "Outfit");
                            cloneTextNode(s, slideElem.querySelector(".capa-title"), slideElem, "0F2B5C", "Outfit");
                            cloneTextNode(s, slideElem.querySelector(".capa-periodo"), slideElem, "00B080", "Inter");
                        } else if (sIdx === 2) {
                            cloneTextNode(s, slideElem.querySelector("#slide2-header-contrato"), slideElem, "0F2B5C", "Outfit");
                            cloneTextNode(s, slideElem.querySelector("#slide2-header-title"), slideElem, "0F2B5C", "Outfit");
                            cloneTextNode(s, slideElem.querySelector("#slide2-header-subtitle"), slideElem, "00B080", "Inter");
                            
                            slideElem.querySelectorAll("#list-destaques li").forEach(li => cloneTextNode(s, li, slideElem, "1E293B", "Inter", true));
                            slideElem.querySelectorAll("#list-atencao li").forEach(li => cloneTextNode(s, li, slideElem, "1E293B", "Inter", true));
                            slideElem.querySelectorAll("#list-passos li").forEach(li => cloneTextNode(s, li, slideElem, "1E293B", "Inter", true));
                            
                            slideElem.querySelectorAll("#table-slas th, #table-slas td").forEach(cell => {
                                cloneTextNode(s, cell, slideElem, "0F2B5C", "Inter");
                            });
                        }
                        
                        resolve();
                    }).catch(err => {
                        console.error(err);
                        resolve();
                    });
                }, 100);
            });
        });
    }
    
    promiseSequence.then(() => {
        statusText.textContent = "Finalizando PowerPoint Editável...";
        if (progressFill) progressFill.style.width = "100%";
        
        pres.writeFile({ fileName: "Boletim_Clientes_Editavel_" + AppState.contrato.replace(/\\s+/g, "_") + ".pptx" }).then(() => {
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
        });
    });
}
;
content = content.replace(regex, newFunc);
fs.writeFileSync(path, content, 'utf8');
console.log('Function replaced!');
