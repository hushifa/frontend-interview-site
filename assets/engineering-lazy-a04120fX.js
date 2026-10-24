var e={answerHtml:`<p>代码分割把资源拆成多个块；懒加载在需要时再请求对应块。适合非首屏页面、大型编辑器、图表库和低频弹窗等。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable language_">module</span> = <span class="hljs-keyword">await</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&quot;./heavy-feature.js&quot;</span>);
<span class="hljs-variable language_">module</span>.<span class="hljs-title function_">start</span>();
</code></pre></div>
<p>拆分过细会增加请求和调度开销，首次使用懒加载功能也会产生等待。应给出加载与失败反馈，并在确有收益时预加载。首屏核心内容不宜机械地全部延后加载。</p>
<p>拆分边界可以按路由、功能、编辑器语言或低频第三方库划分。要注意动态导入的错误恢复、离线缓存、版本不一致和用户点击后才开始下载造成的延迟；对即将进入视口的内容可以预取，但不要把所有懒块都提前下载。</p>
<p>验证时同时看初始 JS、首屏 LCP、首次交互和后续功能的等待时间。代码分割减少的是初始传输和解析成本，不会自动减少功能总量；如果公共依赖被重复打包，拆分反而可能增加总下载量。</p>
<h3>复习提示</h3>
<p>回答时把开发体验、构建产物和生产运行时分开衡量。工具选型要说明版本、配置、缓存和回滚方式，并用构建结果或日志验证，而不是只依据启动速度判断。可先用一个最小示例验证“动态导入、懒加载、性能”，再补充空值、异常和兼容性边界。</p>`};export{e as default};