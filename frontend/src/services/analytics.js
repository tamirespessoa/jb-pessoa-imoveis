/**
 * Serviço centralizado de Analytics (Google Analytics 4).
 *
 * Regras:
 * - Todo envio ao GA4 passa por `sendEvent`, que só aceita parâmetros de uma
 *   lista permitida e descarta qualquer valor que pareça e-mail ou telefone.
 * - Nenhum dado pessoal de clientes ou proprietários (nome, telefone, e-mail,
 *   mensagem, endereço, renda etc.) é enviado ao GA4.
 * - Eventos repetidos (StrictMode, duplo clique, duplo envio) são descartados.
 * - O `page_view` automático do GA4 fica desligado (`send_page_view: false`
 *   no index.html); as visualizações são enviadas por `trackPageView`,
 *   chamado pelo roteador do React, apenas para rotas públicas (/site).
 *
 * Variáveis de ambiente opcionais (frontend/.env):
 *   VITE_GA_ENABLED=true  → envia eventos também em desenvolvimento
 *   VITE_GA_DEBUG=true    → registra os eventos no console do navegador
 */

export const GA_MEASUREMENT_ID = "G-6BEGLWRHQ5";

const IS_ENABLED =
  import.meta.env.PROD || import.meta.env.VITE_GA_ENABLED === "true";
const IS_DEBUG = import.meta.env.VITE_GA_DEBUG === "true";

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  VIEW_ITEM: "view_item",
  CONTACT_WHATSAPP: "contact_whatsapp",
  GENERATE_LEAD: "generate_lead",
  PROPERTY_REGISTRATION: "property_registration"
};

/* ------------------------------------------------------------------ */
/* Sanitização (sem dados pessoais)                                    */
/* ------------------------------------------------------------------ */

const PUBLIC_PATH_PREFIX = "/site";

// Parâmetros de URL que podem conter texto digitado pelo usuário. São
// removidos da URL enviada ao GA4. UTMs, gclid, fbclid etc. são mantidos
// para preservar a atribuição de campanhas.
const SENSITIVE_QUERY_PARAMS = [
  "search",
  "q",
  "query",
  "busca",
  "name",
  "nome",
  "email",
  "phone",
  "telefone",
  "whatsapp",
  "message",
  "mensagem",
  "cpf"
];

const ALLOWED_PARAMS = new Set([
  "page_location",
  "page_path",
  "page_title",
  "link_location",
  "contact_method",
  "lead_source",
  "form_name",
  "property_purpose",
  "item_id",
  "currency",
  "value",
  "items"
]);

const ALLOWED_ITEM_FIELDS = new Set([
  "item_id",
  "item_name",
  "item_category",
  "price",
  "quantity"
]);

const MAX_STRING_LENGTH = 100;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

// Identificadores técnicos (cuid, código do imóvel) podem ter muitos dígitos
// sem serem telefone; para eles só a regra de e-mail se aplica.
const ID_FIELDS = new Set(["item_id"]);

function looksLikePersonalData(value, key) {
  if (EMAIL_PATTERN.test(value)) return true;

  if (ID_FIELDS.has(key)) return false;

  // 10+ dígitos: telefone, CPF, CEP + número etc.
  return value.replace(/\D/g, "").length >= 10;
}

function sanitizeValue(value, key) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const text = value.trim().slice(0, MAX_STRING_LENGTH);

    if (!text || looksLikePersonalData(text, key)) return undefined;

    return text;
  }

  return undefined;
}

function sanitizeItem(item) {
  if (!item || typeof item !== "object") return null;

  const clean = {};

  Object.keys(item).forEach((key) => {
    if (!ALLOWED_ITEM_FIELDS.has(key)) return;

    const value = sanitizeValue(item[key], key);

    if (value !== undefined) clean[key] = value;
  });

  return Object.keys(clean).length > 0 ? clean : null;
}

export function sanitizeParams(params = {}) {
  const clean = {};

  Object.keys(params || {}).forEach((key) => {
    if (!ALLOWED_PARAMS.has(key)) return;

    if (key === "items") {
      const items = Array.isArray(params.items)
        ? params.items.map(sanitizeItem).filter(Boolean)
        : [];

      if (items.length > 0) clean.items = items;

      return;
    }

    const value = sanitizeValue(params[key], key);

    if (value !== undefined) clean[key] = value;
  });

  return clean;
}

export function getSafePageLocation() {
  if (typeof window === "undefined") return "";

  try {
    const url = new URL(window.location.href);

    SENSITIVE_QUERY_PARAMS.forEach((param) => url.searchParams.delete(param));
    url.hash = "";

    return url.toString();
  } catch {
    return `${window.location.origin}${window.location.pathname}`;
  }
}

export function isPublicPath(pathname) {
  const path = String(pathname || "");

  return (
    path === PUBLIC_PATH_PREFIX || path.startsWith(`${PUBLIC_PATH_PREFIX}/`)
  );
}

/* ------------------------------------------------------------------ */
/* Controle de duplicidade                                             */
/* ------------------------------------------------------------------ */

const MAX_KEYS = 200;
const recentEvents = new Map();
const seenOnce = new Set();

// Bloqueia o mesmo evento repetido dentro de `ttlMs` (duplo clique,
// duplo envio, efeitos executados duas vezes).
function isDuplicate(key, ttlMs) {
  const now = Date.now();
  const last = recentEvents.get(key);

  if (last && now - last < ttlMs) return true;

  recentEvents.set(key, now);

  if (recentEvents.size > MAX_KEYS) {
    recentEvents.delete(recentEvents.keys().next().value);
  }

  return false;
}

// Permite o evento uma única vez para a chave informada.
function isRepeatedOnce(key) {
  if (seenOnce.has(key)) return true;

  seenOnce.add(key);

  if (seenOnce.size > MAX_KEYS) {
    seenOnce.delete(seenOnce.values().next().value);
  }

  return false;
}

/* ------------------------------------------------------------------ */
/* Inicialização                                                       */
/* ------------------------------------------------------------------ */

let initialized = false;

function ensureGtag() {
  if (typeof window === "undefined") return false;

  window.dataLayer = window.dataLayer || [];

  // O snippet do index.html normalmente já define o gtag. Este bloco só
  // atua como reserva caso ele tenha sido removido.
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = scriptSrc;
      document.head.appendChild(script);
    }

    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
  }

  return true;
}

function isWhatsAppHost(hostname) {
  return (
    hostname === "wa.me" ||
    hostname === "whatsapp.com" ||
    hostname.endsWith(".whatsapp.com")
  );
}

function getWhatsAppAnchor(event) {
  const target = event.target;

  if (!target || typeof target.closest !== "function") return null;

  const anchor = target.closest("a[href]");

  if (!anchor) return null;

  try {
    const { hostname } = new URL(anchor.href, window.location.href);

    return isWhatsAppHost(hostname) ? anchor : null;
  } catch {
    return null;
  }
}

// Um único ouvinte global captura todos os links de WhatsApp do site, sem
// precisar alterar (nem duplicar) o tracking em cada componente.
function handleDocumentClick(event) {
  const anchor = getWhatsAppAnchor(event);

  if (!anchor) return;

  trackWhatsAppClick({
    location: anchor.getAttribute("data-analytics-location") || undefined
  });
}

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;

  initialized = true;

  ensureGtag();

  document.addEventListener("click", handleDocumentClick, true);
}

/* ------------------------------------------------------------------ */
/* Envio                                                               */
/* ------------------------------------------------------------------ */

function sendEvent(name, params = {}) {
  const payload = sanitizeParams({
    page_path:
      typeof window !== "undefined" ? window.location.pathname : undefined,
    page_location: getSafePageLocation(),
    ...params
  });

  if (IS_DEBUG) {
    console.debug(
      `[analytics] ${name}${IS_ENABLED ? "" : " (desativado neste ambiente)"}`,
      payload
    );
  }

  if (!IS_ENABLED || !ensureGtag()) return;

  try {
    window.gtag("event", name, payload);
  } catch (error) {
    if (IS_DEBUG) console.error("[analytics] erro ao enviar evento", error);
  }
}

/* ------------------------------------------------------------------ */
/* Eventos                                                             */
/* ------------------------------------------------------------------ */

let lastTrackedPath = null;
let currentItemId = null;

function getPageName(pathname) {
  if (pathname === "/site") return "home";
  if (pathname.startsWith("/site/imoveis/") || pathname.startsWith("/site/imovel/")) {
    return "detalhe_imovel";
  }
  if (pathname.startsWith("/site/imoveis")) return "lista_imoveis";
  if (pathname.startsWith("/site/cadastrar-imovel")) return "cadastrar_imovel";

  return "site";
}

// Navegação entre páginas públicas (SPA). Mudanças apenas de query string
// ou #âncora na mesma rota não geram novo page_view.
export function trackPageView(pathname) {
  if (!isPublicPath(pathname)) return;

  if (pathname === lastTrackedPath) return;

  lastTrackedPath = pathname;
  currentItemId = null;

  sendEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: pathname,
    page_title: typeof document !== "undefined" ? document.title : undefined
  });
}

// Visualização individual de imóvel. Envia somente dados públicos do imóvel
// (código/id, título, tipo e preço), nunca dados do proprietário.
// `navigationKey` (location.key do React Router) garante um único envio por
// navegação, mesmo com StrictMode.
export function trackViewItem(property, { navigationKey = "" } = {}) {
  if (!property) return;

  const itemId = property.code || property.id;

  if (!itemId) return;

  currentItemId = String(itemId);

  if (isRepeatedOnce(`view_item:${navigationKey}:${currentItemId}`)) return;

  const price = Number(property.price);
  const hasPrice = Number.isFinite(price) && price > 0;

  const category =
    property.type === "SALE"
      ? "venda"
      : property.type === "RENT"
        ? "locacao"
        : undefined;

  sendEvent(ANALYTICS_EVENTS.VIEW_ITEM, {
    currency: hasPrice ? "BRL" : undefined,
    value: hasPrice ? price : undefined,
    items: [
      {
        item_id: currentItemId,
        item_name: property.title || currentItemId,
        item_category: category,
        price: hasPrice ? price : undefined,
        quantity: 1
      }
    ]
  });
}

// Clique em botão/link de WhatsApp. Links <a> são capturados pelo ouvinte
// global; botões que usam window.open chamam esta função diretamente.
export function trackWhatsAppClick({ location } = {}) {
  const where =
    location ||
    (typeof window !== "undefined"
      ? getPageName(window.location.pathname)
      : "site");

  if (isDuplicate(`contact_whatsapp:${where}:${currentItemId || ""}`, 1000)) {
    return;
  }

  sendEvent(ANALYTICS_EVENTS.CONTACT_WHATSAPP, {
    contact_method: "whatsapp",
    link_location: where,
    item_id: currentItemId || undefined
  });
}

// Lead enviado com sucesso. Chamar somente após a API confirmar o envio.
export function trackGenerateLead({ source } = {}) {
  if (isDuplicate(`generate_lead:${source || ""}`, 5000)) return;

  sendEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    lead_source: source,
    form_name: source,
    item_id: source === "formulario_imovel" ? currentItemId : undefined
  });
}

// Cadastro de imóvel enviado por proprietário. Chamar somente após sucesso.
export function trackPropertyRegistration({ purpose } = {}) {
  if (isDuplicate("property_registration", 5000)) return;

  sendEvent(ANALYTICS_EVENTS.PROPERTY_REGISTRATION, {
    form_name: "cadastrar_imovel",
    property_purpose:
      purpose === "RENT" ? "locacao" : purpose === "SALE" ? "venda" : undefined
  });
}
