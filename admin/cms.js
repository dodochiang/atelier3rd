(function () {
  // 讓預覽也吃到 preview.css
  try { CMS.registerPreviewStyle('/admin/preview.css'); } catch {}

  // 把 cover / gallery_images / gallery.image 的各種型態轉成 URL
  function pickUrl(raw) {
    if (!raw) return '';
    if (Array.isArray(raw)) return raw.length ? pickUrl(raw[raw.length - 1]) : '';
    if (typeof raw.get === 'function') {
      // Immutable.List
      if (typeof raw.size === 'number') return raw.size ? pickUrl(raw.get(raw.size - 1)) : '';
      // Immutable.Map
      return raw.get('secure_url') || raw.get('url') || raw.get('path') || raw.get('src') || '';
    }
    if (typeof raw === 'object') {
      return raw.secure_url || raw.url || raw.path || raw.src || '';
    }
    if (typeof raw === 'string') {
      let s = raw.trim().replace(/^[\[\s"]+/, '').replace(/[\s"\]]+$/, '');
      const urls = s.match(/https?:\/\/[^\s"'\\\]]+/g);
      if (urls && urls.length) s = urls[urls.length - 1];
      s = s.replace(/%22/g, '').replace(/\]$/, '');
      if (/\bList\b|\[|\]/.test(s)) return '';
      return s;
    }
    return '';
  }

  const h = (window.h) || (window.preact && window.preact.h) || (CMS && CMS.lib && CMS.lib.h);
  if (!h) return;

  const ProjectPreview = (props) => {
    const e = props.entry;

    const titleEn = e.getIn(['data', 'title_en']) || '';
    const titleZh = e.getIn(['data', 'title_zh']) || '';
    const type    = e.getIn(['data', 'type'])     || '';
    const year    = e.getIn(['data', 'year'])     || '';
    const locEn   = e.getIn(['data', 'location_en']) || '';
    const locZh   = e.getIn(['data', 'location_zh']) || '';
    const cover   = pickUrl(e.getIn(['data', 'cover'])) || pickUrl(e.getIn(['data','thumbnail']));

    // credits / body / video
    const creditsEn = props.widgetFor && props.widgetFor('credits_en');
    const creditsZh = props.widgetFor && props.widgetFor('credits_zh');
    const bodyEn    = props.widgetFor && props.widgetFor('body_en');
    const bodyZh    = props.widgetFor && props.widgetFor('body_zh');
    const videoUrl  = e.getIn(['data','video']) || '';

    // gallery（先用進階 gallery，否則用 gallery_images）
    const gallery  = e.getIn(['data','gallery']) || [];
    const galImgs  = e.getIn(['data','gallery_images']) || [];

    function renderGalleryFirst() {
      // 只渲染第一張，保持預覽簡潔
      let first = '';
      if (Array.isArray(gallery) && gallery.length) {
        first = pickUrl(gallery[0] && gallery[0].image);
      } else if (Array.isArray(galImgs) && galImgs.length) {
        first = pickUrl(galImgs[0]);
      } else if (gallery && typeof gallery.get === 'function' && gallery.size) {
        first = pickUrl(gallery.get(0) && gallery.get(0).get && gallery.get(0).get('image'));
      } else if (galImgs && typeof galImgs.get === 'function' && galImgs.size) {
        first = pickUrl(galImgs.get(0));
      }
      return first ? h('div', { class: 'project-slider' },
        h('div', { class: 'slide-image-wrapper' },
          h('img', { src: first, alt: 'Gallery image', loading: 'lazy' })
        )
      ) : null;
    }

    return h('div', { class: 'cms-preview-content' },
      cover ? h('div', { class: 'project-hero' },
        h('img', { src: cover, alt: 'Cover', loading: 'lazy' })
      ) : null,

      h('h1', { class: 'project-title' },
        h('span', { class: 'lang-en' }, titleEn || ''),
        ' ',
        h('span', { class: 'lang-zh' }, titleZh || '')
      ),

      h('p', { class: 'project-meta-line' },
        h('span', { class: 'lang-en' }, [type || '', (locEn ? ` ｜ ${locEn}` : '')].join('')),
        h('span', { class: 'lang-zh' }, [type || '', (locZh ? ` ｜ ${locZh}` : '')].join(''))
      ),
      h('p', { class: 'project-meta-line' },
        h('span', { class: 'lang-en' }, year || ''),
        h('span', { class: 'lang-zh' }, year || '')
      ),

      h('div', { class: 'project-content' },
        bodyEn ? h('div', { class: 'lang-en' }, bodyEn) : null,
        bodyZh ? h('div', { class: 'lang-zh' }, bodyZh) : null
      ),

      (creditsEn || creditsZh) ? h('div', { class: 'project-credits' },
        creditsEn ? h('div', { class: 'lang-en' }, creditsEn) : null,
        creditsZh ? h('div', { class: 'lang-zh' }, creditsZh) : null
      ) : null,

      renderGalleryFirst(),

      (videoUrl)
        ? h('div', { class: 'project-video', style: { textAlign: 'center', marginTop: '1em' } },
            h('div', { class: 'video-container' },
              h('iframe', { src: videoUrl, title: 'YouTube video', frameBorder: 0, allowFullScreen: true })
            )
          )
        : null
    );
  };

  try { CMS.registerPreviewTemplate('projects', ProjectPreview); } catch {}
})();
