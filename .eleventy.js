module.exports = function (eleventyConfig) {
  // ✅ 靜態檔案複製
  eleventyConfig.addPassthroughCopy({ "static/uploads": "uploads" });
  eleventyConfig.addPassthroughCopy("admin");

  // ✅ markdown-it filter（確保已安裝）
  const markdownIt = require("markdown-it")({ html: true });
  eleventyConfig.addFilter("markdown", (content) =>
    markdownIt.render(content || "")
  );

  // ✅ 圖片 URL 容錯：
  // - Array / 逗號或空白分隔字串：取「最後一張」（通常是你最後選的那張）
  // - 物件：取 secure_url/url/path/src
  // - 字串：清除 ["…"] / 殘字元（], %22 等）
  eleventyConfig.addFilter("imageUrlSafe", (v) => {
    try {
      // Array -> 取最後一張
      if (Array.isArray(v)) v = v.length ? v[v.length - 1] : "";

      // 逗號 / 空白分隔的多值字串 -> 取最後一段
      if (typeof v === "string" && (v.includes(",") || /\shttps?:\/\//i.test(v))) {
        const parts = v.trim().replace(/^[\[\s"]+/, "").replace(/[\s"\]]+$/, "").split(/[,\s]+/).filter(Boolean);
        v = parts.length ? parts[parts.length - 1] : "";
      }

      // 常見物件（例如 Cloudinary 回傳物件）與 Immutable 結構
      if (v && typeof v === "object") {
        if (typeof v.get === "function") {
          // Immutable.List -> 取最後一張（修正重點：由 get(0) 改成 get(size-1)）
          if (typeof v.size === "number") {
            v = v.size > 0 ? v.get(v.size - 1) : "";
          } else {
            // Immutable.Map
            v = v.get("secure_url") || v.get("url") || v.get("path") || v.get("src") || "";
          }
        } else {
          v = v.secure_url || v.url || v.path || v.src || "";
        }
      }

      // 字串清理
      if (typeof v === "string") {
        v = v.replace(/^[\[\s"]+/, "").replace(/[\s"\]]+$/, "").replace(/%22/g, "").replace(/\]$/, "");
        if (/\bList\b|\[|\]/.test(v)) return "";
      }

      return typeof v === "string" ? v : "";
    } catch {
      return "";
    }
  });

  // （可選）小輔助：從多個候選中挑第一個非空值
  eleventyConfig.addFilter("pickFirst", (...args) => {
    for (const a of args) {
      if (a !== undefined && a !== null && a !== "" && !(Array.isArray(a) && a.length === 0)) {
        return a;
      }
    }
    return "";
  });

  // ✅ 自定義 collection: projects（以年份排序，缺值視為 0）
  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("projects/*.md").sort((a, b) => {
      const ya = Number(b.data.year || 0);
      const yb = Number(a.data.year || 0);
      return ya - yb;
    });
  });

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
