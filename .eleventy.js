module.exports = function (eleventyConfig) {
  // 讓 static 目錄的檔案（如圖片）原樣複製到 _site
  eleventyConfig.addPassthroughCopy("static");

  // 定義 projects collection 並依年份由新到舊排序
  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("projects/*.md").sort((a, b) => {
      return b.data.year - a.data.year;
    });
  });

  return {
    dir: {
      input: ".",          // 輸入目錄為根目錄
      includes: "_includes",
      data: "_data",
      output: "_site",     // 產出目錄
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
