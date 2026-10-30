var e={notesHtml:`<p>把 HLS 的 m3u8 和分片转封装后交给 MSE 播放，支持码率自适应、直播和字幕，适合在不原生支持 HLS 的桌面浏览器中播放直播或点播。</p>
<p>Safari 和 iOS 原生支持 HLS，iPhone 上的 Safari 直到 iOS 17.1 才提供 Managed Media Source，常见做法是先检测 Hls.isSupported()，不支持时直接把地址赋给 video。只负责播放内核，不带界面，控件要另外实现或配合 Video.js 等播放器。</p>
<p>许可：Apache-2.0。</p>`};export{e as default};