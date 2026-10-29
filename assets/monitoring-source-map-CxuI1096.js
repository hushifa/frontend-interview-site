var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>线上代码是压缩过的，报错堆栈里只有 <code>app.3f2a.js:1:20345</code> 这种位置，看不出是哪行源码。Source Map 就是压缩代码和源码之间的对照表。浏览器通过产物末尾的 <code>//# sourceMappingURL=</code> 注释，或者 <code>SourceMap</code> 响应头找到它；按 ECMA-426 规范，两者都有时以响应头为准。</p>
<p>可是 map 文件公开出去，别人也能拿来还原我们的源码。所以生产环境用 hidden source map：照常生成 <code>.map</code> 文件，但产物里不写那行注释，浏览器就不会自动加载。</p>
<p>生成以后，<code>.map</code> 只上传到错误监控服务或者内网存储，部署前从产物目录里删掉。要注意，光没有注释不等于安全，文件留在服务器上，别人猜到路径照样能下载。</p>
<p>还原放在服务端做。前端上报原始堆栈和发布版本号，服务端按版本找到对应的 map，把压缩后的行列号映射回源码位置。</p>
</blockquote>
<h2>为什么不能直接公开 map</h2>
<p>Source Map 的原理、<code>sourcesContent</code> 为什么会暴露源码、按版本上传的基本流程，见<a href="/questions/eng-source-map/">《Source Map 如何帮助定位压缩后代码的错误？》</a>。这里只讲监控这一侧的取舍。</p>
<p>有一种折中是 <code>nosources-source-map</code>，它不含源码内容，只保留映射，所以可以部署。用它的话，监控平台能还原出源文件名和行列号，但看不到源码片段；文件名和目录结构还是会暴露。</p>
<p>如果想在告警里直接看到出错的那几行代码，就只能用含源码的 hidden map，并且不部署。</p>
<h2>构建怎么配置</h2>
<p>webpack 和 Vite 都有现成的选项：</p>
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
<p>Vite 的 <code>&#x27;hidden&#x27;</code> 和 <code>true</code> 一样会输出独立的 map 文件，区别只是去掉了产物里的注释。</p>
<h2>版本为什么必须一一对应</h2>
<p>前端 SDK 上报的版本号，要和上传 map 时的版本号完全相同，比如都用 Git 提交哈希。</p>
<p>为什么这么严格？因为同名文件在不同的构建里内容可能不同。用错了 map，还原出来的位置看起来很合理，其实是错的，比报不出来更容易误导人。文件名带内容哈希能降低这种风险。</p>
<p>部署前要从 <code>dist</code> 删掉所有 <code>*.map</code>。</p>
<h2>还原是怎么完成的</h2>
<p>上报的堆栈长这样：<code>at a (https://cdn.example.com/app.3f2a.js:1:20345)</code>。服务端根据版本和文件 URL 找到对应的 map，用 source-map 这类库查第 1 行第 20345 列，得到源文件、原始行列号和函数名。</p>
<p>前提是上报了原始的 <code>error.stack</code>。如果是跨域脚本，报错只剩 <code>Script error.</code>，连行列号都没有，就没法还原了，要先解决跨域问题，见<a href="/questions/monitoring-error-capture/">《前端怎样全局捕获 JS 错误、Promise 拒绝和资源加载失败？》</a>。</p>
<h2>常见追问</h2>
<p><strong>开发者调试线上问题时能看到源码吗？</strong></p>
<blockquote>
<p>能。在 DevTools 里手动关联本地或者内网的 map 文件就行，不需要把 map 公开。</p>
</blockquote>
<p><strong>第三方库的报错能还原吗？</strong></p>
<blockquote>
<p>只要构建时生成的 map 包含这些模块就能。没有打包进来、直接从外部 CDN 加载的脚本，要它自己提供 map。</p>
</blockquote>
<p><strong>只限制 map 文件的访问 IP 可以吗？</strong></p>
<blockquote>
<p>可以当作补充，但最简单可靠的做法还是不部署。</p>
</blockquote>`};export{e as default};