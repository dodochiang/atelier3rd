const markdownIt = require("markdown-it")({ html: true });

module.exports = function (eleventyConfig) {
  // ✅ 靜態檔案複製
  eleventyConfig.addPassthroughCopy({ "static/uploads": "uploads" });
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("css"); // 加上 css 資料夾

  // ✅ markdown-it filter
  eleventyConfig.addFilter("markdown", (content) =>
    markdownIt.render(content || "")
  );

  // ✅ 圖片 URL 容錯處理 filter
  eleventyConfig.addFilter("imageUrlSafe", (v) => {
    try {
      if (Array.isArray(v)) v = v.length ? v[v.length - 1] : "";
      if (v && typeof v === "object") {
        if (typeof v.get === "function") {
          if (typeof v.size === "number") {
            v = v.size > 0 ? v.get(v.size - 1) : "";
          } else {
            v =
              v.get("secure_url") ||
              v.get("url") ||
              v.get("path") ||
              v.get("src") ||
              "";
          }
        } else {
          v = v.secure_url || v.url || v.path || v.src || "";
        }
      }
      if (typeof v === "string") {
        let s = v.trim().replace(/^[\[\s"]+/, "").replace(/[\s"\]]+$/, "");
        const urls = s.match(/https?:\/\/[^\s"'\]]+/g);
        if (urls && urls.length) {
          s = urls[urls.length - 1];
        }
        s = s.replace(/%22/g, "").replace(/\]$/, "");
        if (/\bList\b|\[|\]/.test(s)) return "";
        return s;
      }
      return typeof v === "string" ? v : "";
    } catch {
      return "";
    }
  });

  // ✅ 小輔助：取第一個有效值
  eleventyConfig.addFilter("pickFirst", (...args) => {
    for (const a of args) {
      if (
        a !== undefined &&
        a !== null &&
        a !== "" &&
        !(Array.isArray(a) && a.length === 0)
      ) {
        return a;
      }
    }
    return "";
  });

  // ✅ 自定義 collection: projects
  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("projects/*.md").sort((a, b) => {
      const ya = Number(b.data.year || 0);
      const yb = Number(a.data.year || 0);
      return ya - yb;
    });
  });

  // ✅ Eleventy 專案目錄設定
  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
