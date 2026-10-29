var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>小程序第一次打开要先下载代码包，包越大等得越久。分包就是把页面按功能拆成一个主包和多个分包，启动时只下主包，进到某个分包的页面时再下那个分包。官方说这是优化启动耗时效果最明显的手段。</p>
<p>分包有引用规则：分包之间不能互相引用 JS、template 和资源，只能用主包和自己的内容；tabBar 页面必须放在主包。</p>
<p>独立分包更进一步，它不依赖主包也能运行。从独立分包的页面启动时，连主包都不下载，适合活动页、广告页这类独立场景。代价是用不了主包的内容，<code>getApp()</code> 也可能拿不到 App。</p>
<p>分包预下载是在 <code>app.json</code> 里配 <code>preloadRule</code>，进入某个页面时提前把之后可能用到的分包下好，减少第一次进分包页面的等待。另外还有分包异步化，它把粒度细到组件和文件，让主包里的部分组件和逻辑也能拆到分包里异步加载。</p>
</blockquote>
<h2>普通分包怎么配</h2>
<p>下面的配置有两个分包，<code>packageA</code> 和 <code>packageB</code>：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;pages&quot;: [&quot;pages/index&quot;, &quot;pages/logs&quot;],
  &quot;subPackages&quot;: [
    { &quot;root&quot;: &quot;packageA&quot;, &quot;pages&quot;: [&quot;pages/cat&quot;, &quot;pages/dog&quot;] },
    { &quot;root&quot;: &quot;packageB&quot;, &quot;name&quot;: &quot;pack2&quot;, &quot;pages&quot;: [&quot;pages/apple&quot;] }
  ]
}
</code></pre></div>
<p><code>subPackages</code> 配置的路径以外，所有目录都会打进主包。分包的根目录也不能嵌套在另一个分包里。另外，tabBar 页面必须放在主包。</p>
<p>引用规则要记清楚。packageA 不能 <code>require</code> packageB 的 JS，也不能引用 packageB 的 template 和资源，但可以用主包和自己的内容。用了分包异步化时，JS 不受这个限制。</p>
<p>所以代码该放哪里，要看谁在用。多个分包都要用的工具代码放主包。只在某个分包用到的组件和插件，就在那个分包里引用，不要写进 <code>app.json</code> 的全局 <code>usingComponents</code>，否则它会跟着主包一起下载和注入，白白增加启动负担。</p>
<h2>独立分包有什么不一样</h2>
<p>在分包配置里加上 <code>&quot;independent&quot;: true</code>，它就成了独立分包，一个小程序可以有多个。</p>
<p>因为它要能单独运行，所以不能依赖主包和其他分包的 JS、template、wxss、自定义组件、插件。分包异步化场景下，JS、自定义组件和插件除外。主包的 <code>app.wxss</code> 对它也无效，独立分包里也不能定义 <code>App</code>。</p>
<p>最容易出问题的是 <code>getApp()</code>。从独立分包启动时，<code>App</code> 还没注册，<code>getApp()</code> 会返回 <code>undefined</code>。这时可以用 <code>getApp({ allowDefault: true })</code> 拿到一个默认实现，等主包加载以后，里面的属性会合并到真正的 App 上。</p>
<p>生命周期也会推迟。App 的 <code>onLaunch</code> 和第一次 <code>onShow</code>，要等用户第一次进入主包或普通分包的页面时才调用。独立分包里想监听应用的生命周期，可以用 <code>wx.onAppShow</code>、<code>wx.onAppHide</code>。</p>
<p>还有兼容问题。在不支持独立分包的旧版微信上，独立分包会被当成普通分包，主包的 <code>app.wxss</code> 可能影响它的样式。所以独立分包不要依赖 <code>app.wxss</code>。</p>
<h2>分包预下载怎么配</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;preloadRule&quot;: {
    &quot;pages/index&quot;: { &quot;network&quot;: &quot;all&quot;, &quot;packages&quot;: [&quot;important&quot;] },
    &quot;indep/index&quot;: { &quot;packages&quot;: [&quot;__APP__&quot;] }
  }
}
</code></pre></div>
<p>key 是触发预下载的页面路径。比如用户进了 <code>pages/index</code>，就开始下 <code>important</code> 这个分包。<code>packages</code> 里填分包的 <code>root</code> 或 <code>name</code>，<code>__APP__</code> 表示主包，所以第二条的意思是：用户在独立分包页面时，提前把主包下好。</p>
<p><code>network</code> 默认是 <code>wifi</code>，设成 <code>all</code> 表示任何网络下都预下载。</p>
<p>预下载目前只能通过配置使用，不能用 API 触发。同一个分包里的页面共享预下载的大小限额，官方文档写的是 2M，打包时由开发者工具校验。</p>
<h2>常见追问</h2>
<p><strong>分包能放多少代码？</strong></p>
<blockquote>
<p>官方文档写明，整个小程序所有分包加起来不超过 30M，服务商代开发的小程序不超过 20M；单个分包或主包不能超过 2M。具体以微信开放文档《分包加载》为准。</p>
</blockquote>
<p><strong>图片要放进分包吗？</strong></p>
<blockquote>
<p>代码包里的图片、字体这类资源很难再压缩，对下载耗时的影响比代码还大。所以官方建议放到 CDN 上用 URL 引用，包里只留小图标。</p>
</blockquote>`};export{e as default};