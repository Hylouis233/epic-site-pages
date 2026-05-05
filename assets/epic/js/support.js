(function () {
    const config = window.EPIC_SUPPORT_CONFIG || {};
    const elements = {
        themeToggle: document.getElementById("theme-toggle"),
        homeLink: document.getElementById("support-home-link"),
        highlights: document.getElementById("support-highlights"),
        paymentNotice: document.getElementById("support-payment-notice"),
        methodGroups: document.getElementById("support-method-groups"),
        sponsorList: document.getElementById("support-sponsor-list"),
        adsDescription: document.getElementById("support-ads-description"),
        adGrid: document.getElementById("support-ad-grid"),
        business: document.getElementById("support-business"),
    };

    const groupLabels = {
        domestic: () => config.ui?.domesticTitle || "国内用户支持方式",
        international: () => config.ui?.internationalTitle || "海外用户支持方式",
        crypto: () => config.ui?.cryptoTitle || "数字货币支持方式",
    };

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getActiveTheme() {
        return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    }

    function applyTheme(theme) {
        const normalizedTheme = theme === "dark" ? "dark" : "light";
        document.documentElement.dataset.theme = normalizedTheme;
        if (elements.themeToggle) {
            const isDark = normalizedTheme === "dark";
            elements.themeToggle.textContent = isDark ? "浅色" : "深色";
            elements.themeToggle.setAttribute("aria-pressed", String(isDark));
        }
    }

    function setupThemeToggle() {
        applyTheme(getActiveTheme());
        if (!elements.themeToggle) {
            return;
        }
        elements.themeToggle.addEventListener("click", function () {
            const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
            try {
                window.localStorage.setItem("epic-theme", nextTheme);
            } catch (error) {
                // Local storage may be unavailable.
            }
        });
    }

    function setupHomeLink() {
        if (elements.homeLink && config.site?.homePath) {
            elements.homeLink.href = config.site.homePath;
        }
    }

    async function copyText(value, button) {
        const text = String(value || "");
        if (!text) {
            return;
        }
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                textarea.remove();
            }
            const oldText = button.textContent;
            button.textContent = config.ui?.copiedLabel || "已复制";
            window.setTimeout(function () {
                button.textContent = oldText;
            }, 1600);
        } catch (error) {
            button.textContent = "复制失败";
        }
    }

    function renderHighlights() {
        const highlights = Array.isArray(config.ui?.highlights) ? config.ui.highlights : [];
        elements.highlights.innerHTML = highlights.map(function (item) {
            return `<li>${escapeHtml(item)}</li>`;
        }).join("");
    }

    function renderPaymentMethod(method) {
        const linkAttrs = method.opensInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
        const action = method.href
            ? `<a class="button button--primary" href="${escapeHtml(method.href)}"${linkAttrs}>${escapeHtml(method.buttonLabel || "打开")}</a>`
            : "";
        const qr = method.qrCodeSrc
            ? `<img src="${escapeHtml(method.qrCodeSrc)}" alt="${escapeHtml(method.qrCodeAlt || method.label)}" loading="lazy">`
            : "";
        return `
            <article class="support-card" id="${escapeHtml(method.key)}">
                <div>
                    <h3>${escapeHtml(method.label)}</h3>
                    <p>${escapeHtml(method.description)}</p>
                </div>
                ${qr}
                ${action || '<span class="support-card__hint">请扫码支持</span>'}
            </article>
        `;
    }

    function cryptoMetadata(asset) {
        const metadata = [
            asset.tokenStandard ? ["协议", asset.tokenStandard] : null,
            asset.chainId ? ["Chain ID", asset.chainId] : null,
            asset.addressFormatHint ? ["地址格式", asset.addressFormatHint] : null,
        ].filter(Boolean);

        if (!metadata.length) {
            return "";
        }

        return `
            <dl class="support-card__meta">
                ${metadata.map(function (item) {
                    return `<div><dt>${escapeHtml(item[0])}</dt><dd>${escapeHtml(item[1])}</dd></div>`;
                }).join("")}
            </dl>
        `;
    }

    function renderCryptoCard(asset) {
        const qr = asset.qrCodeSrc
            ? `<img src="${escapeHtml(asset.qrCodeSrc)}" alt="${escapeHtml(asset.label)} QR Code" loading="lazy">`
            : "";
        return `
            <article class="support-card support-card--crypto" id="${escapeHtml(asset.id)}" data-crypto-symbol="${escapeHtml(asset.symbol)}">
                <div>
                    <h3>${escapeHtml(asset.label)}</h3>
                    <p>${escapeHtml(asset.note)}</p>
                </div>
                ${cryptoMetadata(asset)}
                ${qr}
                ${asset.address ? `<code class="support-card__address">${escapeHtml(asset.address)}</code>` : ""}
                ${asset.address ? `<button class="button button--secondary" type="button" data-copy-address="${escapeHtml(asset.address)}">${escapeHtml(config.ui?.copyAddressLabel || "复制地址")}</button>` : ""}
            </article>
        `;
    }

    function bindCopyButtons() {
        document.querySelectorAll("[data-copy-address]").forEach(function (button) {
            button.addEventListener("click", function () {
                copyText(button.getAttribute("data-copy-address"), button);
            });
        });
    }

    function renderCryptoFilters(assets) {
        const symbols = Array.from(new Set(assets.map(function (asset) {
            return asset.symbol;
        }).filter(Boolean)));
        if (!symbols.length) {
            return "";
        }
        return `
            <p class="support-notice">${escapeHtml(config.ui?.cryptoNetworkWarning || "")}</p>
            <div class="support-filters" role="tablist" aria-label="${escapeHtml(config.ui?.cryptoTitle || "数字货币支持方式")}">
                <button class="support-filter is-active" type="button" role="tab" aria-selected="true" data-crypto-filter="all">${escapeHtml(config.ui?.cryptoFilterAllLabel || "全部")}</button>
                ${symbols.map(function (symbol) {
                    return `<button class="support-filter" type="button" role="tab" aria-selected="false" data-crypto-filter="${escapeHtml(symbol)}">${escapeHtml(symbol)}</button>`;
                }).join("")}
            </div>
        `;
    }

    function bindCryptoFilters() {
        document.querySelectorAll("[data-crypto-filter]").forEach(function (button) {
            button.addEventListener("click", function () {
                const symbol = button.getAttribute("data-crypto-filter");
                document.querySelectorAll("[data-crypto-filter]").forEach(function (item) {
                    const active = item === button;
                    item.classList.toggle("is-active", active);
                    item.setAttribute("aria-selected", String(active));
                });
                document.querySelectorAll("[data-crypto-symbol]").forEach(function (card) {
                    const matches = symbol === "all" || card.getAttribute("data-crypto-symbol") === symbol;
                    card.classList.toggle("hidden", !matches);
                });
            });
        });
    }

    function renderMethods() {
        const methods = (Array.isArray(config.paymentMethods) ? config.paymentMethods : []).filter(function (method) {
            return method.enabled;
        });
        const assets = (Array.isArray(config.cryptoAssets) ? config.cryptoAssets : []).filter(function (asset) {
            return asset.enabled;
        });
        const groups = ["domestic", "international", "crypto"];
        elements.paymentNotice.textContent = config.ui?.paymentNotice || "";
        elements.methodGroups.innerHTML = groups.map(function (group) {
            const groupMethods = methods.filter(function (method) {
                return method.group === group;
            });
            const showCrypto = group === "crypto" && assets.length > 0;
            if (!groupMethods.length && !showCrypto) {
                return "";
            }
            return `
                <section class="support-method-group" id="${escapeHtml(group)}">
                    <h3>${escapeHtml(groupLabels[group]())}</h3>
                    ${showCrypto ? renderCryptoFilters(assets) : ""}
                    <div class="support-card-grid">
                        ${groupMethods.map(renderPaymentMethod).join("")}
                        ${showCrypto ? assets.map(renderCryptoCard).join("") : ""}
                    </div>
                </section>
            `;
        }).join("");
        bindCopyButtons();
        bindCryptoFilters();
    }

    function renderSponsors() {
        const sponsors = config.sponsors || {};
        const items = Array.isArray(sponsors.items) ? sponsors.items : [];
        if (!items.length) {
            elements.sponsorList.innerHTML = `
                <div class="support-empty">
                    <span class="support-empty__marker">OPEN</span>
                    <h3>${escapeHtml(sponsors.emptyTitle || "首批赞助者招募中")}</h3>
                    <p>${escapeHtml(sponsors.emptyDescription || "")}</p>
                </div>
            `;
            return;
        }
        elements.sponsorList.innerHTML = `
            <div class="support-card-grid">
                ${items.map(function (item) {
                    return `
                        <article class="support-card">
                            <h3>${escapeHtml(item.name)}</h3>
                            <p>${escapeHtml(item.description)}</p>
                            ${item.href ? `<a class="table-cell__link" href="${escapeHtml(item.href)}" target="_blank" rel="sponsored nofollow noopener noreferrer">访问赞助者</a>` : ""}
                        </article>
                    `;
                }).join("")}
            </div>
        `;
    }

    function renderAds() {
        const ads = config.ads || {};
        const slots = Array.isArray(ads.slots) ? ads.slots : [];
        elements.adsDescription.textContent = ads.description || "";
        elements.adGrid.innerHTML = slots.map(function (slot) {
            return `
                <article class="support-ad-slot">
                    <span class="support-ad-slot__position">${escapeHtml(slot.position)}</span>
                    <h3>${escapeHtml(slot.title)}</h3>
                    <p>${escapeHtml(slot.description)}</p>
                    <strong>${escapeHtml(slot.ctaLabel || "广告位招租")}</strong>
                </article>
            `;
        }).join("");
    }

    function renderBusiness() {
        const business = config.business || {};
        const offerings = Array.isArray(business.offerings) ? business.offerings : [];
        elements.business.innerHTML = `
            <p class="support-business__description">${escapeHtml(business.description || "")}</p>
            <ul class="support-business__offerings">
                ${offerings.map(function (item) {
                    return `<li>${escapeHtml(item)}</li>`;
                }).join("")}
            </ul>
            ${business.contactHref ? `<a class="button button--primary" href="${escapeHtml(business.contactHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(business.contactLabel || "联系合作")}</a>` : ""}
        `;
    }

    function bootstrap() {
        if (!document.querySelector("[data-support-page]")) {
            return;
        }
        setupThemeToggle();
        setupHomeLink();
        renderHighlights();
        renderMethods();
        renderSponsors();
        renderAds();
        renderBusiness();
    }

    document.addEventListener("DOMContentLoaded", bootstrap);
})();
