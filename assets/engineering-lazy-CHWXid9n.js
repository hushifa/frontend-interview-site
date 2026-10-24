var e={answerHtml:`<p>代码分割把资源拆成多个块；懒加载在需要时再请求对应块。适合非首屏页面、大型编辑器、图表库和低频弹窗等。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable language_">module</span> = <span class="hljs-keyword">await</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&quot;./heavy-feature.js&quot;</span>);
<span class="hljs-variable language_">module</span>.<span class="hljs-title function_">start</span>();
</code></pre></div>
<p>拆分过细会增加请求和调度开销，首次使用懒加载功能也会产生等待。应给出加载与失败反馈，并在确有收益时预加载。首屏核心内容不宜机械地全部延后加载。</p>`};export{e as default};