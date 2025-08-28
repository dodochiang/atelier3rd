(function () {
  const CMS_ = window.CMS;
  if (!CMS_ || !CMS_.registerWidget) return;

  // 取 React 與內建 image 控制/預覽
  const React = (CMS_.lib && CMS_.lib.React) || window.React;
  const ImageControl = CMS_.getWidget('image') && CMS_.getWidget('image').control;
  const ImagePreview = CMS_.getWidget('image') && CMS_.getWidget('image').preview;
  if (!React || !ImageControl || !ImagePreview) return;

  // 乾淨網址正規化：array / Immutable.List / object / string（含多個 URL 混在一起）
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
      return typeof v === 'string' ? v : '';
    } catch { return ''; }
  }

  class SingleImageControl extends React.Component {
    // 把任何回傳型態，轉成「單一字串 URL」
    handleChange = (val) => {
      const url = normalizeUrl(val);
      this.props.onChange(url);
    };

    render() {
      // 強制單選；其餘 props 照傳
      return React.createElement(ImageControl, {
        ...this.props,
        onChange: this.handleChange,
        multiple: false,
        allowMultiple: false,
      });
    }
  }

  // 預覽沿用內建 image preview（顯示那個字串 URL）
  const SingleImagePreview = (props) => React.createElement(ImagePreview, props);

  // 註冊成新的 widget：singleimage
  CMS_.registerWidget('singleimage', SingleImageControl, SingleImagePreview);

  // 小強化：在存檔/發布前，同步一份到 thumbnail（讓舊專案也能在 Grid 顯示）
  function syncThumbnail({ entry, collection }) {
    if (!collection || collection.get('name') !== 'projects') return;
    const data = entry.get('data');
    const cover = normalizeUrl(data && data.get && data.get('cover'));
    const next  = data.set('cover', cover).set('thumbnail', cover);
    return { entry: entry.set('data', next) };
  }
  CMS_.registerEventListener({ name: 'preSave',    handler: syncThumbnail });
  CMS_.registerEventListener({ name: 'prePublish', handler: syncThumbnail });
})();
