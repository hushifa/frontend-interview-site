var e={answerHtml:`<p>代码分割把资源拆成多个块；懒加载在需要时再请求对应块。适合非首屏页面、大型编辑器、图表库和低频弹窗等。</p>
<p>工程工具要分别评估开发启动、增量更新、生产构建和部署产物，不能用一个指标代表全部体验。锁文件、Node 版本、构建目标、环境变量和缓存策略应能在 CI 中复现。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable language_">module</span> = <span class="hljs-keyword">await</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&quot;./heavy-feature.js&quot;</span>);
<span class="hljs-variable language_">module</span>.<span class="hljs-title function_">start</span>();
</code></pre></div>
<p>拆分过细会增加请求和调度开销，首次使用懒加载功能也会产生等待。应给出加载与失败反馈，并在确有收益时预加载。首屏核心内容不宜机械地全部延后加载。</p>
<p>拆分边界可以按路由、功能、编辑器语言或低频第三方库划分。要注意动态导入的错误恢复、离线缓存、版本不一致和用户点击后才开始下载造成的延迟；对即将进入视口的内容可以预取，但不要把所有懒块都提前下载。</p>
<p>验证时同时看初始 JS、首屏 LCP、首次交互和后续功能的等待时间。代码分割减少的是初始传输和解析成本，不会自动减少功能总量；如果公共依赖被重复打包，拆分反而可能增加总下载量。</p>
<p>升级工具时先看迁移说明和产物差异，再在真实项目中验证插件、Source Map、代码分割和失败日志。把配置写进仓库，才能让本地和发布环境得到同一套结果。</p>
<p>实际工程问题最好从产物和日志开始验证：看依赖是否锁定、构建是否可复现、代码是否被正确分包、失败是否能定位到具体步骤。开发服务器的速度不能代表最终页面的下载和执行成本。</p>`};export{e as default};