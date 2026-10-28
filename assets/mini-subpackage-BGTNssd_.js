var e={answerHtml:`<h2>简答</h2>
<ul>
<li>分包把页面按功能拆成主包和多个分包，启动时只下载主包，进入分包页面时再下载对应分包，官方称之为优化启动耗时效果最明显的手段。</li>
<li>分包之间不能互相引用 JS、template 和资源，只能引用主包和自身的内容；tabBar 页面必须放在主包。</li>
<li>独立分包不依赖主包即可运行，从独立分包页面启动时不下载主包，适合活动页、广告页等独立场景，代价是不能使用主包内容，<code>getApp()</code> 可能拿不到 App。</li>
<li>分包预下载通过 <code>app.json</code> 的 <code>preloadRule</code> 配置，在进入某个页面时提前下载后续可能用到的分包，减少首次进入分包页面的等待。</li>
<li>分包异步化把粒度细化到组件和文件，让主包里的部分组件和逻辑也能拆到分包中异步加载。</li>
</ul>
<h2>普通分包</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;pages&quot;: [&quot;pages/index&quot;, &quot;pages/logs&quot;],
  &quot;subPackages&quot;: [
    { &quot;root&quot;: &quot;packageA&quot;, &quot;pages&quot;: [&quot;pages/cat&quot;, &quot;pages/dog&quot;] },
    { &quot;root&quot;: &quot;packageB&quot;, &quot;name&quot;: &quot;pack2&quot;, &quot;pages&quot;: [&quot;pages/apple&quot;] }
  ]
}
</code></pre></div>
<p>规则：</p>
<ul>
<li><code>subPackages</code> 配置路径以外的目录都会打进主包，分包根目录不能嵌套在另一个分包里。</li>
<li>packageA 不能 <code>require</code> packageB 的 JS，不能引用 packageB 的 template 和资源，但可以使用主包和自己的内容（使用分包异步化时 JS 不受此限制）。</li>
<li>多个分包都会用到的工具代码应放在主包；只在某个分包用到的组件和插件应在分包内引用，而不是写在 <code>app.json</code> 的全局 <code>usingComponents</code> 里，否则会随主包一起下载和注入。</li>
</ul>
<h2>独立分包</h2>
<p>在分包配置中加 <code>&quot;independent&quot;: true</code> 即可声明独立分包，一个小程序可以有多个。</p>
<p>限制和注意事项：</p>
<ul>
<li>不能依赖主包和其他分包的 JS、template、wxss、自定义组件、插件（分包异步化场景下 JS、自定义组件、插件除外）。</li>
<li>主包的 <code>app.wxss</code> 对独立分包无效；独立分包里不能定义 <code>App</code>。</li>
<li>从独立分包启动时 <code>App</code> 还没注册，<code>getApp()</code> 返回 <code>undefined</code>。可以用 <code>getApp({ allowDefault: true })</code> 拿到默认实现，主包加载后其中的属性会合并到真正的 App 上。</li>
<li>App 的 <code>onLaunch</code> 和首次 <code>onShow</code> 会推迟到首次进入主包或普通分包页面时才调用，独立分包内要监听应用生命周期可以使用 <code>wx.onAppShow</code>、<code>wx.onAppHide</code>。</li>
<li>在不支持独立分包的旧版微信上，独立分包按普通分包处理，主包的 <code>app.wxss</code> 可能影响它的样式，所以不要依赖 <code>app.wxss</code>。</li>
</ul>
<h2>分包预下载</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;preloadRule&quot;: {
    &quot;pages/index&quot;: { &quot;network&quot;: &quot;all&quot;, &quot;packages&quot;: [&quot;important&quot;] },
    &quot;indep/index&quot;: { &quot;packages&quot;: [&quot;__APP__&quot;] }
  }
}
</code></pre></div>
<ul>
<li>key 是触发预下载的页面路径，<code>packages</code> 填分包的 <code>root</code> 或 <code>name</code>，<code>__APP__</code> 表示主包，可以让独立分包页面提前下载主包。</li>
<li><code>network</code> 默认是 <code>wifi</code>，设为 <code>all</code> 表示任何网络都预下载。</li>
<li>目前只能通过配置使用，不能用 API 触发。</li>
<li>同一个分包内的页面共享预下载大小限额，官方文档写明为 2M，打包时由工具校验。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>分包能放多少代码？官方文档写明单个代码包上限为 2M，整个小程序所有分包不超过 30M（服务商代开发的小程序不超过 20M），单个分包或主包不能超过 2M（见微信开放文档《分包加载》）。</li>
<li>图片要放进分包吗？代码包中的图片、字体等资源很难再压缩，对下载耗时影响比代码大，官方建议放到 CDN 用 URL 引用，包内只保留小图标。</li>
</ul>`};export{e as default};