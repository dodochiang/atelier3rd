/* ===============================
   Decap CMS – Project & Pages Preview
   =============================== */

/* -------- Register Cloudinary media library (robust) -------- */
(function registerCloudinary(retries = 20) {
  const ok = (window.CMS && (window.cloudinary || window.Cloudinary)) ? true : false;
  if (ok) {
    CMS.registerMediaLibrary(window.cloudinary || window.Cloudinary);
  } else if (retries > 0) {
    setTimeout(() => registerCloudinary(retries - 1), 150);
  } else {
    console.warn('[CMS] Cloudinary media library not found. Is the plugin script loaded in /admin/index.html?');
  }
})();

/* 預覽面板樣式（右側 preview） */
CMS.registerPreviewStyle("/admin/preview.css");

/* ===== Helpers ===== */
const { createClass, h } = window;

const TYPE_EN = {
  "住宅": "Residential",
  "商業": "Commercial",
  "文化": "Cultural",
  "公共": "Public",
  "裝置": "Installation",
  "工作營": "Workshop",
  "展覽": "Exhibition",
};

const SEP = "｜"; // 全形豎線

const ensureStr = (v) => (v === null || v === undefined) ? "" : String(v);

const normSrc = (src) => {
  const s = ensureStr(src).trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : (s.startsWith("/") ? s : "/" + s);
};

const fmtArea = (v, lang) => {
  const s = ensureStr(v).trim();
  if (!s) return "";
  if (/㎡|m²|sqm/i.test(s)) return s;
  return lang === "zh" ? s + "㎡" : s + " sqm";
};

const fmtUnits = (v, lang) => {
  const s = ensureStr(v).trim();
  if (!s) return "";
  if (/戶|units/i.test(s)) return s;
  return lang === "zh" ? s + "戶" : s + " units";
};

/* ===== Projects – Live Preview（兩行 meta、gallery_images、credits） ===== */
const ProjectPreview = createClass({
  render() {
    const entry = this.props.entry;
    const get = (k) => entry.getIn(["data", k]);
    const getList = (k) => entry.getIn(["data", k]) || [];

    const title_en = ensureStr(get("title_en"));
    const title_zh = ensureStr(get("title_zh"));
    const year     = ensureStr(get("year"));
    const loc_en   = ensureStr(get("location_en"));
    const loc_zh   = ensureStr(get("location_zh"));
    const type_zh  = ensureStr(get("type"));
    const type_en  = TYPE_EN[type_zh] || "";

    // 新 meta
    const floor_area = get("floor_area"); // number or string
    const units      = get("units");      // number or string

    // Credits（markdown）
    const credits_en = this.props.widgetFor("credits_en");
    const credits_zh = this.props.widgetFor("credits_zh");

    // 逗號安全化（視覺仍是逗號）
    const loc_en_safe = loc_en.replace(/,/g, "&#44;");
    const loc_zh_safe = loc_zh.replace(/，/g, "&#65292;").replace(/,/g, "&#44;");

    // 兩行 meta
    const line1_en = [type_en, loc_en_safe].filter(Boolean).join(SEP);
    const line1_zh = [type_zh, loc_zh_safe].filter(Boolean).join(SEP);

    const u_en = fmtUnits(units, "en");
    const u_zh = fmtUnits(units, "zh");
    const a_en = fmtArea(floor_area, "en");
    const a_zh = fmtArea(floor_area, "zh");

    const line2_en = [u_en, a_en, year].filter(Boolean).join(SEP);
    const line2_zh = [u_zh, a_zh, year].filter(Boolean).join(SEP);

    // 圖片
    const thumbnail   = ensureStr(get("thumbnail"));
    const heroSrc     = normSrc(thumbnail);
    const gallery     = getList("gallery");
    const galleryImgs = getList("gallery_images");

    // 合併相簿來源
    let previewList = [];
    const gArr  = gallery.toJS?.() || [];
    const giArr = galleryImgs.toJS?.() || [];
    if (Array.isArray(gArr) && gArr.length) {
      previewList = gArr
        .map(it => ({
          image: normSrc(it.image),
          caption_en: ensureStr(it.caption_en),
          caption_zh: ensureStr(it.caption_zh)
        }))
        .filter(it => it.image);
    } else if (Array.isArray(giArr) && giArr.length) {
      previewList = giArr
        .map(src => ({ image: normSrc(src), caption_en: "", caption_zh: "" }))
        .filter(it => it.image);
    }
    const first = previewList[0];

    const body_en = this.props.widgetFor("body_en");
    const body_zh = this.props.widgetFor("body_zh");

    return h("div", { className: "cms-preview-content" }, [
      // hero
      heroSrc && h("div", { className: "project-hero" },
        h("img", { src: heroSrc, alt: "Project thumbnail" })
      ),

      // title
      h("h1", { className: "project-title" }, [
        h("span", { className: "lang-en", style: { display: "block" } }, title_en),
        h("span", { className: "lang-zh", style: { display: "block", fontWeight: "normal" } }, title_zh)
      ]),

      // meta line 1：類型｜地點
      h("p", { className: "project-meta-line" }, [
        h("span", { className: "lang-en", style: { display: "block" } }, line1_en),
        h("span", { className: "lang-zh", style: { display: "block" } }, line1_zh)
      ]),

      // meta line 2：戶數｜面積｜年份
      h("p", { className: "project-meta-line" }, [
        h("span", { className: "lang-en", style: { display: "block" } }, line2_en),
        h("span", { className: "lang-zh", style: { display: "block" } }, line2_zh)
      ]),

      // body
      h("div", { className: "project-content" }, [
        h("div", { className: "lang-en" }, body_en),
        h("div", { className: "lang-zh" }, body_zh)
      ]),

      // Credits（放在描述下、相簿前）
      (credits_en || credits_zh) && h("div", { className: "project-credits" }, [
        h("div", { className: "lang-en" }, credits_en || null),
        h("div", { className: "lang-zh" }, credits_zh || null)
      ]),

      // gallery（預覽只帶第一張）
      first && h("div", { className: "project-slider" }, [
        h("div", { className: "slide-image-wrapper" },
          h("img", { src: first.image, alt: "Preview image" })
        ),
        (first.caption_en || first.caption_zh) &&
          h("div", { className: "gallery-caption" }, [
            h("div", { className: "lang-en" }, first.caption_en),
            h("div", { className: "lang-zh" }, first.caption_zh)
          ])
      ])
    ]);
  }
});
CMS.registerPreviewTemplate("projects", ProjectPreview);

/* ===== About / Contact – 簡單預覽 ===== */
const SimplePagePreview = createClass({
  render() {
    return h("article", { className: "preview-page" }, [
      h("h1", {}, this.props.entry.getIn(["data", "title_en"])),
      this.props.widgetFor("body_en"),
      h("hr"),
      h("h1", {}, this.props.entry.getIn(["data", "title_zh"])),
      this.props.widgetFor("body_zh")
    ]);
  }
});
CMS.registerPreviewTemplate("about", SimplePagePreview);
CMS.registerPreviewTemplate("contact", SimplePagePreview);

/* ===== Optional：介面字串調整（保留） ===== */
CMS.registerLocale("en", {
  app: { header: { content: "Atelier3rd CMS" } },
  workflow: { workflow: { drafts: "草稿", inReview: "審核中", ready: "準備發布" } }
});

/* ===== Optional：自訂小 widget（保留） ===== */
const YearWidget = createClass({
  render() {
    return h("input", {
      type: "number",
      min: 1900, max: 2100,
      value: this.props.value || "",
      onChange: e => this.props.onChange(e.target.value)
    });
  }
});
CMS.registerWidget("year", YearWidget);
