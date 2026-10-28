var e={answerHtml:`<h2>简答</h2>
<ul>
<li>浏览器通过 <code>//# sourceMappingURL=</code> 注释或 <code>SourceMap</code> 响应头找到 map；按 ECMA-426，两者都有时以响应头为准。</li>
<li>生产环境用 hidden source map：照常生成 <code>.map</code>，但产物里不写引用注释，浏览器不会自动加载。</li>
<li><code>.map</code> 只上传到错误监控服务或内网存储，部署到静态托管前从产物目录删除；没有注释不等于安全，文件留在服务器上仍可被猜路径下载。</li>
<li>还原在服务端进行：前端上报原始堆栈和发布版本号，服务端按版本找到对应 map，把压缩后的行列号映射回源码位置。</li>
</ul>
<h2>为什么不公开 map</h2>
<p>Source Map 的原理、<code>sourcesContent</code> 会暴露源码、按版本上传的基本流程，见<a href="/questions/eng-source-map/">《Source Map 如何帮助定位压缩后代码的错误？》</a>。本题只讲监控侧的取舍。</p>
<p><code>nosources-source-map</code> 不含源码内容，只保留映射，可以部署；监控平台还原出的是源文件名和行列号，看不到源码片段，文件名和目录结构仍会暴露。要在告警里直接看到出错代码，就只能用含源码的 hidden map，并且不部署。</p>
<h2>构建配置</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// webpack.config.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;production&#x27;</span>,
  <span class="hljs-attr">devtool</span>: <span class="hljs-string">&#x27;hidden-source-map&#x27;</span>,
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">build</span>: { <span class="hljs-attr">sourcemap</span>: <span class="hljs-string">&#x27;hidden&#x27;</span> },
};
</code></pre></div>
<p>Vite 的 <code>&#x27;hidden&#x27;</code> 与 <code>true</code> 一样输出独立 map 文件，只是去掉产物里的注释。</p>
<h2>版本必须一一对应</h2>
<p>前端 SDK 上报的版本号要与上传 map 时的版本号相同（如 Git 提交哈希）。同名文件在不同构建中内容不同时，用错 map 会还原出看似合理却错误的行；文件名带内容哈希能降低这类风险。部署前从 <code>dist</code> 删除 <code>*.map</code>，没有注释不等于安全，留在服务器上的文件仍可被猜路径下载。</p>
<h2>还原过程</h2>
<p>上报的堆栈形如 <code>at a (https://cdn.example.com/app.3f2a.js:1:20345)</code>。服务端按版本和文件 URL 找到对应 map，用 source-map 类库查询第 1 行第 20345 列，得到源文件、原始行列和函数名。</p>
<p>前提是上报了原始 <code>error.stack</code>。跨域脚本只剩 <code>Script error.</code> 时没有行列号，还原无从谈起，需要先解决跨域问题，见<a href="/questions/monitoring-error-capture/">《前端怎样全局捕获 JS 错误、Promise 拒绝和资源加载失败？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>调试线上问题时开发者能看源码吗？可以在 DevTools 中手动关联本地或内网的 map 文件，不需要公开。</li>
<li>第三方库的报错能还原吗？只要构建时生成的 map 包含这些模块就能；未打包的外部 CDN 脚本需要其自身提供 map。</li>
<li>只限制 map 的访问 IP 可以吗？可以作为补充，但最简单可靠的做法是不部署。</li>
</ul>`};export{e as default};