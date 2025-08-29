(function () {
  // 小工具會用到的 h（Preact）
  const h =
    (window.h) ||
    (window.preact && window.preact.h) ||
    (window.CMS && CMS.lib && CMS.lib.h);

  // 統一把各種型態 → 乾淨的單一 URL 字串
  function normalizeUrl(v) {
    try {
      // 1) 原生 Array → 取最後一張（較符合使用者最後選的）
      if (Array.isArray(v)) v = v.length ? v[v.length - 1] : '';

      // 2) Immutable.List
      if (v && typeof v.get === 'function' && typeof v.size === 'number') {
        v = v.size > 0 ? v.get(v.size - 1) : '';
      }

      // 3) Immutable.Map
      if (v && typeof v.get === 'function' && typeof v.size !== 'number') {
        v = v.get('secure_url') || v.get('url') || v.get('path') || v.get('src') || '';
      }

      // 4) 一般物件（Cloudinary 常見回傳）
      if (v && typeof v === 'object') {
        v = v.secure_url || v.url || v.path || v.src || '';
      }

      // 5) 字串：去雜訊；從字串內抓「最後一個完整 URL」
      if (typeof v === 'string') {
        let s = v.trim()
          .replace(/^[\[\s"]+/, '')
          .replace(/[\s"\]]+$/, '')
          .replace(/%22/g, '')
          .replace(/\]$/, '');
        const urls = s.match(/https?:\/\/[^\s"'\]]+/g);
        if (urls && urls.length) s = urls[urls.length - 1];
        if (/\bList\b|\[|\]/.test(s)) return '';
        return s;
      }

      return (typeof v === 'string') ? v : '';
    } catch {
      return '';
    }
  }

  // 取得既有的 image 控制元件
  const baseImage = CMS.getWidget && CMS.getWidget('image');
  const ImageControl = baseImage && baseImage.control;
  const ImagePreview = baseImage && baseImage.preview;

  // 單值圖片控件：包一層，value / onChange 都強制單值字串
  const SingleImageControl = (props) => {
    const value = normalizeUrl(props.value);
    const onChange = (val) => props.onChange(normalizeUrl(val));
    // 用原生 Image 控件的外觀與上傳流程，但值永遠是「字串」
    return h(ImageControl, Object.assign({}, props, { value, onChange }));
  };

  // 註冊 singleimage 小工具
  CMS.registerWidget('singleimage', SingleImageControl, ImagePreview);

  // 註冊 Cloudinary、預覽樣式
  try { CMS.registerMediaLibrary(cloudinary); } catch (e) {}
  try { CMS.registerPreviewStyle('/admin/preview.css'); } catch (e) {}
  try { CMS.setLocale && CMS.setLocale('en'); } catch (e) {}

  // 存檔 / 發佈前：把 cover → 單值，並同步到 hidden `thumbnail`（供 Grid 縮圖用）
  function normalizeOnEvent({ entry, collection }) {
    if (!collection || collection.get('name') !== 'projects') return;

    const data = entry.get('data');
    const rawCover = data && data.get && data.get('cover');
    const coverUrl = normalizeUrl(rawCover);

    const next = data
      .set('cover', coverUrl)
      .set('thumbnail', coverUrl);   // Grid 會用到

    return { entry: entry.set('data', next) };
  }

  CMS.registerEventListener({ name: 'preSave',    handler: normalizeOnEvent });
  CMS.registerEventListener({ name: 'prePublish', handler: normalizeOnEvent });

  // 右側預覽：帶上封面、meta、credits、video
  const ProjectPreview = (props) => {
    const e = props.entry;
    const get = (keys, def='') => (e.getIn(keys) || def);
    const cover = normalizeUrl(get(['data','cover']));
    const title_en = get(['data','title_en']);
    const title_zh = get(['data','title_zh']);
    const type     = get(['data','type']);
    const loc_en   = get(['data','location_en']);
    const loc_zh   = get(['data','location_zh']);
    const year     = get(['data','year']);
    const units    = get(['data','units']);
    const fa       = get(['data','floor_area']);
    const body_en  = props.widgetFor && props.widgetFor('body_en');
    const body_zh  = props.widgetFor && props.widgetFor('body_zh');
    const cred_en  = props.widgetFor && props.widgetFor('credits_en');
    const cred_zh  = props.widgetFor && props.widgetFor('credits_zh');
    const video    = get(['data','video']);

    const metaLine = (en, zh) =>
      h('p', { class:'project-meta-line' },
        h('span', { class:'lang-en' }, en),
        h('span', { class:'lang-zh' }, zh)
      );

    return h('div', { class:'cms-preview-content' },
      cover && h('div', { class:'project-hero' },
        h('img', { src: cover, alt: (title_en||title_zh)||'Cover', referrerPolicy:'no-referrer-when-downgrade' })
      ),
      h('h1', { class:'project-title' },
        h('span', { class:'lang-en' }, title_en),
        h('span', { class:'lang-zh' }, title_zh)
      ),
      metaLine(
        [type, loc_en].filter(Boolean).join(' ｜ '),
        [type, loc_zh].filter(Boolean).join(' ｜ ')
      ),
      metaLine(
        [units && `${units} units`, fa && `${fa} sqm`, year].filter(Boolean).join(' ｜ '),
        [units && `${units}戶`,     fa && `${fa}㎡`,      year].filter(Boolean).join(' ｜ ')
      ),
      h('div', { class:'project-content' },
        h('div', { class:'lang-en' }, body_en || ''),
        h('div', { class:'lang-zh' }, body_zh || '')
      ),
      (cred_en || cred_zh) && h('div', { class:'project-credits' },
        h('div', { class:'lang-en' }, cred_en || ''),
        h('div', { class:'lang-zh' }, cred_zh || '')
      ),
      video && h('div', { class:'project-video', style:'text-align:center;margin-top:2em;' },
        h('div', { class:'video-container' },
          h('iframe', { src: video, title:'YouTube video', frameborder:'0', allowfullscreen:true })
        )
      )
    );
  };

  CMS.registerPreviewTemplate('projects', ProjectPreview);

  // 一切就緒 → 啟動 CMS（手動初始化）
  CMS.init();
})();
