/* -------------- Brand CSS inside the editor preview -------------- */
CMS.registerPreviewStyle("/admin/admin.css");

/* -------------- Simple “Projects” live preview ------------------- */
/* Works with your frontmatter: title_en, title_zh, year, thumbnail, gallery, etc. */
const ProjectPreview = createClass({
  render() {
    const entry = this.props.entry;
    const data  = entry.getIn(["data"]);
    const titleEn = data.get("title_en");
    const titleZh = data.get("title_zh");
    const year    = data.get("year");
    const thumb   = data.get("thumbnail");
    const gallery = data.get("gallery");

    return h("div", { className: "preview-wrap" }, [
      h("header", { className: "preview-hero" }, [
        thumb ? h("img", { src: thumb, alt: "Project thumbnail" }) : null,
        h("h1", {}, `${titleEn || ""} ${titleZh ? " / " + titleZh : ""}`),
        year ? h("p", { className: "muted" }, String(year)) : null,
      ]),
      h("section", { className: "preview-body" }, [
        /* Render markdown bodies */
        h("div", { className: "lang-en" },
          this.props.widgetFor && this.props.widgetFor("body_en")
        ),
        h("div", { className: "lang-zh" },
          this.props.widgetFor && this.props.widgetFor("body_zh")
        ),
      ]),
      gallery && gallery.size
        ? h("section", { className: "preview-gallery" },
            gallery.toJS().map((item, i) =>
              h("figure", { key: i }, [
                h("img", { src: item.image, alt: item.caption_en || item.caption_zh || `Image ${i+1}` }),
                h("figcaption", {}, item.caption_en || item.caption_zh || "")
              ])
            )
          )
        : null,
    ]);
  }
});
CMS.registerPreviewTemplate("projects", ProjectPreview);

/* -------------- Optional: “About” / “Contact” previews ----------- */
const SimplePagePreview = createClass({
  render() {
    return h("article", { className: "preview-page" }, [
      h("h1", {}, this.props.entry.getIn(["data", "title_en"])),
      this.props.widgetFor("body_en"),
      h("hr"),
      h("h1", {}, this.props.entry.getIn(["data", "title_zh"])),
      this.props.widgetFor("body_zh"),
    ]);
  }
});
CMS.registerPreviewTemplate("about", SimplePagePreview);
CMS.registerPreviewTemplate("contact", SimplePagePreview);

/* -------------- Optional: custom editor UI tweaks ----------------- */
// Rename publish labels, enable editorial workflow labels, etc.
CMS.registerLocale('en', {
  app: { header: { content: "Atelier3rd CMS" } },
  workflow: { workflow: { drafts: "草稿", inReview: "審核中", ready: "準備發布" } }
});

/* -------------- Optional: custom widget (example: year range) ----- */
// A super-tiny display widget example—skip if not needed.
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
