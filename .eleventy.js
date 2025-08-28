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
  // - Array / Immutable.List：取「最後一張」
  // - 物件：取 secure_url/url/path/src
  // - 字串：從內容中擷取「最後一個完整 URL」（避免 f_auto,q_auto 的逗號被誤切）
  //         並清除 ["…"] / 殘字元（], %22 等）
  eleventyConfig.addFilter("imageUrlSafe", (v) => {
    try {
      // Array -> 取最後一張
      if (Array.isArray(v)) v = v.length ? v[v.length - 1] : "";

      // 常見物件（例如 Cloudinary 回傳物件）與 Immutable 結構
      if (v && typeof v === "object") {
        if (typeof v.get === "function") {
          // Immutable.List -> 取最後
          if (typeof v.size === "number") {
            v = v.size > 0 ? v.get(v.size - 1) : "";
          } else {
            // Immutable.Map
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
        // 基本清理
        let s = v
          .trim()
          .replace(/^[\[\s"]+/, "")
          .replace(/[\s"\]]+$/, "");

        // ✅ 從字串抓出所有完整 URL，取最後一個
        //    （不會被 f_auto,q_auto 的逗號影響）
        const urls = s.match(/https?:\/\/[^\s"'\]]+/g);
        if (urls && urls.length) {
          s = urls[urls.length - 1];
        }

        // 去除殘餘雜字
        s = s.replace(/%22/g, "").replace(/\]$/, "");
        if (/\bList\b|\[|\]/.test(s)) return "";

        return s;
      }

      return typeof v === "string" ? v : "";
    } catch {
      return "";
    }
  });

  // （可選）小輔助：從多個候選中挑第一個非空值
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
