/* 全站 CMS 初始化（僅負責預覽元件） */

// 讓預覽也吃到樣式
try { CMS.registerPreviewStyle('/admin/preview.css'); } catch {}

// 與 index.html 相同的 URL 正規化（保持一致）
function normalizeUrl(v) {
  try {
    if (Array.isArray(v)) v = v.length ? v[v.length - 1] : '';
    if (v && typeof v.get === 'function' && typeof v.size === 'number') {
      v = v.size > 0 ? v.get(v.size - 1) : '';
    }
    if (v && typeof v.get === 'function' && typeof v.size !== 'number') {
      v = v.get('secure_url') || v.get('url') || v.get('path') || v.get('src') || '';
    } else if (v && typeof v === 'object') {
      v = v.secure_url || v.url || v.path || v.src || '';
    }
    if (typeof v === 'string') {
      let s = v.trim().replace(/^[\[\s"]+/, '').replace(/[\s"\]]+$/, '');
      const urls = s.match(/https?:\/\/[^\s"'\\\]]+/g);
      if (urls && urls.length) s = urls[urls.length - 1];
      s = s.replace(/%22/g, '').replace(/\]$/, '');
      if (/\bList\b|\[|\]/.test(s)) return '';
      v = s;
    }
    return (typeof v === 'string') ? v : '';
  } catch { return ''; }
}

// 取 preact 的 h（Decap 內建是 Preact）
const h =
  (window.h) ||
  (window.preact && window.preact.h) ||
  (CMS && CMS.lib && CMS.lib.h);

// 若 h 不存在，先不註冊預覽，避免錯誤中斷
if (h) {
  const ProjectPreview = (props) => {
    const e = props.entry;
    const get = (path, fallback='') => e.getIn(path) || fallback;

    const titleEn = get(['data','title_en']);
    const titleZh = get(['data','title_zh']);
    const cover   = normalizeUrl(get(['data','cover'])) || normalizeUrl(get(['data','thumbnail']));
    const type    = get(['data','type']);
    const locEn   = get(['data','location_en']);
    const locZh   = get(['data','location_zh']);
    const year    = get(['data','year']);
    const units   = get(['data','units']);
    const floor   = get(['data','floor_area']);
    const video   = get(['data','video']);
    const bodyEn  = props.widgetFor && props.widgetFor('body_en');
    const bodyZh  = props.widgetFor && props.widgetFor('body_zh');
    const creditsEn = props.widgetFor && props.widgetFor('credits_en');
    const creditsZh = props.widgetFor && props.widgetFor('credits_zh');

    return h('div', { class: 'cms-preview-content' },
      cover && h('div', { class: 'project-hero' },
        h('img', { src: cover, alt: (titleEn || titleZh || 'cover') })
      ),
      h('h1', { class: 'project-title' },
        h('span', { class: 'lang-en' }, titleEn || ''),
        h('span', { class: 'lang-zh' }, titleZh || '')
      ),
      h('p', { class: 'project-meta-line' },
        h('span', { class: 'lang-en' }, [
          type || '', (locEn ? ` ｜ ${locEn}` : '')
        ].join('')),
        h('span', { class: 'lang-zh' }, [
          type || '', (locZh ? ` ｜ ${locZh}` : '')
        ].join(''))
      ),
      h('p', { class: 'project-meta-line' },
        h('span', { class: 'lang-en' }, [
          units ? `${units} units` : '',
          floor ? (units ? ' ｜ ' : '') + `${floor} sqm` : '',
          year  ? ((units || floor) ? ' ｜ ' : '') + `${year}` : ''
        ].join('')),
        h('span', { class: 'lang-zh' }, [
          units ? `${units}戶` : '',
          floor ? (units ? ' ｜ ' : '') + `${floor}㎡` : '',
          year  ? ((units || floor) ? ' ｜ ' : '') + `${year}` : ''
        ].join(''))
      ),
      h('div', { class: 'project-content' },
        h('div', { class: 'lang-en' }, bodyEn || ''),
        h('div', { class: 'lang-zh' }, bodyZh || '')
      ),
      (creditsEn || creditsZh) && h('div', { class: 'project-credits' },
        h('div', { class: 'lang-en' }, creditsEn || ''),
        h('div', { class: 'lang-zh' }, creditsZh || '')
      ),
      video && h('div', { class: 'project-video', style: { textAlign: 'center', marginTop: '1em' } },
        h('div', { class: 'video-container' },
          h('iframe', { src: video, title: 'YouTube video', allowFullScreen: true })
        )
      )
    );
  };

  try { CMS.registerPreviewTemplate('projects', ProjectPreview); } catch {}
}
