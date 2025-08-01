module.exports = function (eleventyConfig) {
  // ✅ 靜態檔案複製
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addPassthroughCopy("admin"); // ← 加入這行

  // ✅ 加入 markdown-it filter（確保已安裝）
  const markdownIt = require("markdown-it")({ html: true });
  eleventyConfig.addFilter("markdown", content =>
    markdownIt.render(content || "")
  );

  // ✅ 自定義 collection: projects
  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("projects/*.md").sort((a, b) => {
      return b.data.year - a.data.year;
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
