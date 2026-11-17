(function initSecurityUtils(global) {
    "use strict";

    const ALLOWED_TAGS = new Set(["B", "BR", "EM", "I", "SPAN", "STRONG", "U"]);
    const ALLOWED_STYLE_PROPERTIES = new Set([
        "color",
        "display",
        "font-size",
        "font-style",
        "font-weight",
        "line-height",
        "text-decoration",
        "width"
    ]);

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function sanitizeStyle(styleText) {
        return String(styleText || "")
            .split(";")
            .map(declaration => declaration.trim())
            .filter(Boolean)
            .map(declaration => {
                const separator = declaration.indexOf(":");
                if (separator < 1) return "";
                const property = declaration.slice(0, separator).trim().toLowerCase();
                const value = declaration.slice(separator + 1).trim();
                if (!ALLOWED_STYLE_PROPERTIES.has(property)) return "";
                if (/url\s*\(|expression\s*\(|javascript:|@import/i.test(value)) return "";

                if (property === "display" && !/^(inline|inline-block|block)$/i.test(value)) return "";
                if (property === "width" && !/^(auto|100%)$/i.test(value)) return "";
                if (property === "font-style" && !/^(normal|italic|oblique)$/i.test(value)) return "";
                if (property === "font-weight" && !/^(normal|bold|[1-9]00)$/i.test(value)) return "";
                if (property === "text-decoration" && !/^(none|underline|line-through)$/i.test(value)) return "";
                if (property === "font-size" && !/^\d+(?:\.\d+)?(?:px|rem|em|%)$/i.test(value)) return "";
                if (property === "line-height" && !/^(?:normal|\d+(?:\.\d+)?(?:px|rem|em|%)?)$/i.test(value)) return "";
                if (property === "color" && !/^(?:#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|hsla?\([\d\s,.%deg]+\)|[a-z]+)$/i.test(value)) return "";

                return `${property}: ${value}`;
            })
            .filter(Boolean)
            .join("; ");
    }

    function sanitizeRichHtml(value) {
        const template = document.createElement("template");
        template.innerHTML = String(value ?? "");

        function cleanChildren(parent) {
            Array.from(parent.childNodes).forEach(node => {
                if (node.nodeType === Node.COMMENT_NODE) {
                    node.remove();
                    return;
                }
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                cleanChildren(node);
                if (!ALLOWED_TAGS.has(node.tagName)) {
                    const fragment = document.createDocumentFragment();
                    while (node.firstChild) fragment.appendChild(node.firstChild);
                    node.replaceWith(fragment);
                    return;
                }

                const style = node.tagName === "SPAN" ? sanitizeStyle(node.getAttribute("style")) : "";
                const keepFormatClass = node.tagName === "SPAN" && node.classList.contains("format-wrapper");
                Array.from(node.attributes).forEach(attribute => node.removeAttribute(attribute.name));
                if (style) node.setAttribute("style", style);
                if (keepFormatClass) node.className = "format-wrapper";
            });
        }

        cleanChildren(template.content);
        return template.innerHTML;
    }

    function setSafeRichText(element, value, fallback = "") {
        if (!element) return;
        const sanitized = sanitizeRichHtml(value);
        element.innerHTML = sanitized.trim() ? sanitized : sanitizeRichHtml(fallback);
    }

    global.SecurityUtils = Object.freeze({
        escapeAttribute: escapeHtml,
        escapeHtml,
        sanitizeRichHtml,
        setSafeRichText
    });
})(window);
