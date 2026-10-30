var e={notesHtml:`<p>用 TypeScript 编写的 HTML5 MPEG2-TS 播放器，基于 flv.js，针对低延迟直播（如电视信号、监控摄像头）优化，也支持 HTTP-FLV。</p>
<p>原理是把流转封装为 Fragmented MP4 片段，再通过 Media Source Extensions 交给 video 元素播放，因此依赖浏览器的 MSE 支持；iOS Safari 需要 iOS 17.1 及以上，借助 ManagedMediaSource 运行。</p>
<p>许可：Apache-2.0。</p>`};export{e as default};