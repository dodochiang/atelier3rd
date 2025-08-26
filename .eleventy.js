module.exports = function (eleventyConfig) {
  // ✅ 靜態檔案複製
  eleventyConfig.addPassthroughCopy({ "static/uploads": "uploads" });
  eleventyConfig.addPassthroughCopy("admin");

  // ✅ markdown-it filter（確保已安裝）
  const markdownIt = require("markdown-it")({ html: true });
  eleventyConfig.addFilter("markdown", (content) =>
    markdownIt.render(content || "")
  );

  // ✅ 圖片 URL 容錯：陣列取第一個、物件取 url/path/src、字串清除殘字元（如 ["…"]、尾巴的 ] ）
  eleventyConfig.addFilter("imageUrlSafe", (v) => {
    try {
      // Array -> 第一個
      if (Array.isArray(v)) v = v[0] || "";

      // 常見物件（例如 Cloudinary 回傳物件）
      if (v && typeof v === "object") {
        // 若是 Immutable 結構（保險處理，typeof function）
        if (typeof v.get === "function") {
          // Immutable.List
          if (typeof v.size === "number") {
            v = v.size > 0 ? v.get(0) : "";
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
        // 去掉開頭的 [ " 空白，與尾端的 " ] 空白
        v = v.replace(/^[\[\s"]+/, "").replace(/[\s"\]]+$/, "");
        // 若仍殘留 List[...] 等污染，直接判定為空，避免 404
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
