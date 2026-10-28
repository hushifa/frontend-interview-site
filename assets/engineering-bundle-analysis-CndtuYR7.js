var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先看首屏入口实际加载了哪些 chunk，再看总产物大小；总大小对用户体验的意义有限。</li>
<li>同时关注三个数字：原始大小（影响解析执行）、压缩后传输大小（影响下载）、请求数量。</li>
<li>常见问题是：首屏引入了只在某个页面用到的大依赖、同一依赖被打包多份、分块太碎或太粗。</li>
<li>优化后用同样的构建和测量方式对比，并在 CI 设置体积预算防止回退。</li>
</ul>
<h2>用什么工具看</h2>
<ul>
<li>webpack：输出 stats JSON（<code>--json</code>），用 webpack-bundle-analyzer 可视化。</li>
<li>Vite / Rolldown：使用 rollup-plugin-visualizer 一类插件生成树图；<code>vite build</code> 的终端输出也会列出各 chunk 的大小和 gzip 大小。</li>
<li>浏览器 DevTools 的 Network 面板和 Coverage 面板：看首屏真正请求了什么、加载后有多少代码没被执行。</li>
</ul>
<p>构建分析告诉你&quot;包里有什么&quot;，DevTools 告诉你&quot;用户实际下载和执行了什么&quot;，两者要结合。</p>
<h2>按顺序排查</h2>
<ol>
<li><strong>首屏入口</strong>：入口 chunk 和它同步依赖的 chunk 加起来有多大？里面有没有只在弹窗、图表、编辑器里才用的库？这些应改为动态导入。</li>
<li><strong>大依赖</strong>：日期库、图标库、工具库是否整包引入？换成按需导入或更小的替代品。检查是否命中了 CommonJS 版本导致 tree shaking 失效。</li>
<li><strong>重复依赖</strong>：同一个包的多个版本（如两个 lodash）同时出现，通常来自依赖的版本范围不一致，可以用包管理器的去重或 overrides 解决。</li>
<li><strong>分块策略</strong>：变化频繁的业务代码和稳定的第三方库分开，利于缓存；但把所有第三方库合成一个巨大的 vendor 块，会让每个页面都下载用不到的库。</li>
<li><strong>非 JS 资源</strong>：内联进 JS 的图片、字体、大型 JSON 也会增加脚本体积。</li>
</ol>
<h2>衡量收益</h2>
<ul>
<li>固定比较口径：同一构建模式、同样的压缩方式、同一个入口。</li>
<li>关注用户指标：LCP、INP 和首屏 JS 执行时间，而不是只看文件变小了多少 KB。</li>
<li>在 CI 中设置预算，例如入口 JS gzip 后不超过某个值，超出时构建失败或给出警告。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>gzip 后很小，还需要优化吗？需要。浏览器要解压后解析和执行原始代码，低端手机上这部分耗时常常超过下载。</li>
<li>分块越细越好吗？不是。请求过多会增加调度开销，HTTP/2 下也一样有成本，应以页面和功能边界分块。</li>
</ul>`};export{e as default};