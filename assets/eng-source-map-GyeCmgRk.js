var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Source Map 记录生成代码位置与原始文件、行列和名称的对应关系，用于还原线上错误栈。</li>
<li>多步转换时每一步都要合并上一步的映射，否则位置会对不上。</li>
<li>Map 可能包含源码内容，它不是需要公开的源码备份，发布前要决定是否上传到错误平台而不公开部署。</li>
<li>浏览器通过 <code>sourceMappingURL</code> 注释或响应头找到 map 文件。</li>
</ul>
<h2>为什么压缩后的错误难以阅读</h2>
<p>线上 JavaScript 通常经过 TypeScript 编译、模板转换、打包、压缩和代码分割。错误栈可能指向某个哈希文件的第 1 行第 50000 列，那里确实是浏览器正在执行的位置，却很难看出原来对应哪个组件和表达式。</p>
<p>Source Map 记录生成代码位置与原始文件、行列和部分名称的关系。浏览器开发者工具或错误平台可以用错误栈里的生成位置查回源码。它不改变运行逻辑，也不会自动补出请求参数、用户操作和异步因果。</p>
<h2>映射不是一份压缩前源码备份</h2>
<p>Map 里可能包含原始文件列表、可选的源码内容、名称表和位置映射。并非每个生成字符都有精确对应点；包装代码、优化后的表达式、匿名函数和缺失的中间映射都会影响定位质量。</p>
<p>如果 TypeScript → JavaScript、模板编译、打包和压缩是多步转换，后一步必须合并前一步的映射。某个自定义插件插入代码却没有生成正确 map，最终工具可能只能定位到中间产物，甚至出现偏移。排查时不能只检查最后的压缩器开关。</p>
<h2>浏览器如何找到 map</h2>
<p>生成脚本可以通过注释关联：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">//# sourceMappingURL=app.8f3c.js.map</span>
</code></pre></div>
<p>也可以通过响应头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">SourceMap: /assets/app.8f3c.js.map
</code></pre></div>
<p>路径会按照脚本 URL 和部署前缀解析。CDN 改写、权限限制、跨源策略或 map 没有上传，都会导致调试器无法取得它。应用运行不依赖 map，用户通常不会因为 map 加载失败而看到页面错误，但错误平台的还原能力会下降。</p>
<h2>版本匹配比“有 map”更重要</h2>
<p>脚本和 map 必须来自同一次构建。用当前分支的 map 解释旧页面的错误，可能得到一个看似合理但完全错误的源码位置。HTML 缓存、异步块、CDN 和回滚会让多个版本同时在线，因此不能只用 <code>latest</code> 覆盖所有产物。</p>
<p>发布时应为构建生成不可变版本标识，错误事件记录脚本 URL、版本和构建 ID，错误平台按同一 ID 上传和选择 map。回滚后仍要保留旧版本映射一段时间，否则用户打开的旧页面会出现无法还原的错误。</p>
<h2>hidden 不等于 private</h2>
<p>隐藏 Source Map 通常只是生成独立 map 但不在公开脚本中添加关联注释。如果 map 文件仍放在公开目录，知道地址的人仍可能下载。<code>nosources</code> 只是不把源码正文嵌入 map，路径和位置信息仍可能暴露目录结构。</p>
<p>是否公开 map 应按调试需求、代码披露和访问控制决定。即使完全不发布 map，浏览器仍然拿到了可执行 JavaScript，不能把 Source Map 当作保护密钥的手段。真正的密钥不应进入前端产物。</p>
<h2>怎样验证它真的能还原</h2>
<p>在受控构建中写一个已知位置会抛错的模块，部署这一次构建，记录错误栈和构建 ID，再用同一份 map 检查是否回到正确文件和行列。随后验证真实 CDN URL、异步块、压缩器和错误平台上传的版本是否一致。</p>
<p>Source Map 只能回答“生成代码来自哪里”。要解释“用户做了什么、请求返回什么、为什么进入这条路径”，还需要记录脱敏后的操作、请求、版本和业务状态。定位工具和运行上下文结合，才足以支持线上修复。</p>`};export{e as default};