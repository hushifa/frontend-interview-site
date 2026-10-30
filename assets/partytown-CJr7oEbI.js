var e={notesHtml:`<p>把不在关键渲染路径上的第三方脚本放到 Web Worker 中执行，主线程留给自己的代码，官方认为最适合 Google Tag Manager、Facebook Pixel 这类主要监听事件、后台上报数据的脚本。</p>
<p>Worker 中的 DOM 操作会被有意放慢，插入大量节点或弹窗表单的重 UI 脚本不适合；第三方脚本里的 <code>event.preventDefault()</code> 不会生效，缺少 CORS 头的脚本需要配置代理。npm 包名是 <code>@qwik.dev/partytown</code>，旧包 <code>@builder.io/partytown</code> 已弃用。</p>
<p>许可：MIT。</p>`};export{e as default};