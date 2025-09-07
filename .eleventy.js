const markdownIt = require("markdown-it")({ html: true });

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "static/uploads": "uploads" });
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("css");

  eleventyConfig.addFilter("markdown", (content) =>
    markdownIt.render(content || "")
  );

  eleventyConfig.addFilter("concat", (arr1, arr2) => (arr1 || []).concat(arr2 || []));

  eleventyConfig.addFilter("keys", obj => {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.keys(obj);
    }
    return [];
  });

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


  // ✅ projects: 照 year 新到舊
  eleventyConfig.addCollection("projects", (collectionApi) => {
    return collectionApi.getFilteredByGlob("projects/*.md").sort((a, b) => {
      return (Number(b.data.year || 0)) - (Number(a.data.year || 0));
    });
  });

  // ✅ 合併 corepages + projects，core 在前，依 order 排序
  eleventyConfig.addCollection("allContent", (collectionApi) => {
    const core = collectionApi.getFilteredByGlob("core-pages/*.md").sort((a, b) => {
      return (a.data.order || 0) - (b.data.order || 0);
    }).map(item => {
      item.data.isCore = true;
      return item;
    });

    const projects = collectionApi.getFilteredByGlob("projects/*.md").sort((a, b) => {
      return (Number(b.data.year || 0)) - (Number(a.data.year || 0));
    });

    return core.concat(projects);
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
