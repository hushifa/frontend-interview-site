var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>公司的内部系统，页面上铺满了一行行斜着的浅灰色文字，写着你的名字和工号。万一有人截图外传，一看就知道是谁泄露的。这就是页面水印。</p>
<p>做法是用 canvas 画一小块带文字的倾斜图案，转成图片地址，设成一个全屏图层的重复背景。图层放在最上面，加上 <code>pointer-events: none</code>，点击会穿透到下面的页面，不影响正常操作。</p>
<p>防删的常用手段是 <code>MutationObserver</code>：监听水印节点有没有被移除、<code>style</code> 有没有被改，发现了就重新插入或恢复。</p>
<p>但要说清楚，页面代码跑在用户自己的浏览器里，用户可以禁用脚本、在开发者工具里删节点、拦截请求、用插件改页面。前端防删只能提高门槛，防不住懂行的人。真正要追责的场景，水印要由服务端加在图片、PDF 或导出的文件里，或者用肉眼看不见的暗水印。</p>
</blockquote>
<h2>水印图案怎样生成</h2>
<p>用 canvas 画一块图案，内容一般包括用户名、工号、时间，便于追溯：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createWatermark</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
  canvas.<span class="hljs-property">width</span> = <span class="hljs-number">240</span>;
  canvas.<span class="hljs-property">height</span> = <span class="hljs-number">160</span>;
  <span class="hljs-keyword">const</span> ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
  ctx.<span class="hljs-title function_">translate</span>(<span class="hljs-number">120</span>, <span class="hljs-number">80</span>);
  ctx.<span class="hljs-title function_">rotate</span>(-<span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> / <span class="hljs-number">9</span>); <span class="hljs-comment">// 倾斜约 20 度</span>
  ctx.<span class="hljs-property">font</span> = <span class="hljs-string">&#x27;14px sans-serif&#x27;</span>;
  ctx.<span class="hljs-property">fillStyle</span> = <span class="hljs-string">&#x27;rgba(0, 0, 0, 0.12)&#x27;</span>;
  ctx.<span class="hljs-property">textAlign</span> = <span class="hljs-string">&#x27;center&#x27;</span>;
  ctx.<span class="hljs-title function_">fillText</span>(text, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> canvas.<span class="hljs-title function_">toDataURL</span>(); <span class="hljs-comment">// 不传格式时导出 PNG</span>
}
</code></pre></div>
<p><code>toDataURL</code> 返回一个 data URL。MDN 说明不指定格式时导出 <code>image/png</code>，PNG 支持透明，水印以外的地方是透明的。也可以用 <code>toBlob</code> 拿到 Blob 再用 <code>URL.createObjectURL</code> 生成地址，图案很小时两者差别不大。</p>
<p>不想用 canvas 的话，也可以直接写一段 SVG 字符串，转成 data URL 当背景，效果一样。</p>
<h2>水印图层怎样铺满又不挡操作</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> layer = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;div&#x27;</span>);
layer.<span class="hljs-property">style</span>.<span class="hljs-property">cssText</span> = <span class="hljs-string">\`
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background-image: url(<span class="hljs-subst">\${createWatermark(<span class="hljs-string">&#x27;张三 10086 2026-10-29&#x27;</span>)}</span>);
  background-repeat: repeat;
\`</span>;
<span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>.<span class="hljs-title function_">append</span>(layer);
</code></pre></div>
<p><code>position: fixed</code> 加 <code>inset: 0</code> 让图层盖满视口，滚动时也不动。<code>pointer-events: none</code> 是关键：MDN 说明这个属性决定元素能否成为指针事件的目标，设为 <code>none</code> 后，点击和悬停都落到它下面的元素上，用户感觉不到这一层。</p>
<h2>怎样发现水印被删了</h2>
<p>用户打开开发者工具，删掉这个 <code>div</code> 或者把它改成 <code>display: none</code>，水印就没了。<code>MutationObserver</code> 可以监听 DOM 变化：MDN 介绍它用来观察 DOM 树的修改，可以配置监听子节点增删（<code>childList</code>）、属性变化（<code>attributes</code>）和整个子树（<code>subtree</code>）。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MutationObserver</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (!layer.<span class="hljs-property">isConnected</span>) <span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>.<span class="hljs-title function_">append</span>(layer); <span class="hljs-comment">// 被移除了，加回去</span>
  <span class="hljs-keyword">if</span> (layer.<span class="hljs-property">style</span>.<span class="hljs-property">display</span> === <span class="hljs-string">&#x27;none&#x27;</span> || layer.<span class="hljs-property">style</span>.<span class="hljs-property">opacity</span> === <span class="hljs-string">&#x27;0&#x27;</span>) {
    layer.<span class="hljs-property">style</span>.<span class="hljs-property">display</span> = <span class="hljs-string">&#x27;&#x27;</span>;
    layer.<span class="hljs-property">style</span>.<span class="hljs-property">opacity</span> = <span class="hljs-string">&#x27;&#x27;</span>;
  }
});
observer.<span class="hljs-title function_">observe</span>(<span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>, { <span class="hljs-attr">childList</span>: <span class="hljs-literal">true</span> });
observer.<span class="hljs-title function_">observe</span>(layer, { <span class="hljs-attr">attributes</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>在 headless Chrome 里实测：调用 <code>layer.remove()</code> 后，监听 <code>body</code> 子节点的回调收到一条变更记录，把节点加回去后 <code>isConnected</code> 又是 <code>true</code>；改 <code>layer.style.opacity</code>，监听这个节点属性的回调收到 <code>type</code> 为 <code>attributes</code>、<code>attributeName</code> 为 <code>style</code> 的记录。</p>
<p>要注意，回调里把节点加回去，本身也是一次 DOM 变化，会再触发一次回调。所以回调里要先判断“确实被删了”再动手，否则会来回触发。</p>
<p>更进一步，可以把水印放进封闭模式的 Shadow DOM。MDN 说明 <code>attachShadow({ mode: &#x27;closed&#x27; })</code> 创建的影子树，外部通过 <code>shadowRoot</code> 属性拿到的是 <code>null</code>，脚本不能直接查到里面的元素。但在开发者工具里仍然能看到和编辑，作用同样只是增加麻烦。</p>
<h2>为什么前端防删一定防不住</h2>
<p>这些手段都依赖页面里的脚本在运行。用户可以直接禁用 JavaScript，<code>MutationObserver</code> 就不存在了；可以在开发者工具里给水印的样式加一条优先级更高的规则，或者给它的上层元素加 <code>display: none</code>；可以先暂停脚本执行再删节点；可以用浏览器插件在页面加载时注入脚本，把水印逻辑整个替换掉；还可以用打印、截图工具的裁剪绕过。</p>
<p>所以前端水印的定位是：提醒用户这些内容有归属、对普通用户形成威慑、让截图外传的人更容易被找到。它不是安全措施，也不能替代权限控制。</p>
<p>真正需要追责的场景，水印要在服务端加。比如图片、PDF、导出的 Excel，在服务端生成时就把用户信息写进内容里，用户拿到的文件本身就带着水印，前端改不掉。对截图外传更隐蔽的做法是暗水印：把信息以肉眼难以察觉的方式编码进图片像素或页面背景里，需要时用专门的工具提取。</p>
<h2>常见追问</h2>
<p><strong>水印会不会影响页面性能？</strong></p>
<blockquote>
<p>图层只是一个重复的背景图，画一次就完事，开销很小。要注意的是 <code>MutationObserver</code> 不要监听整个文档的所有属性变化，页面更新频繁时回调会被大量触发。只监听水印节点本身和它的父节点就够了。</p>
</blockquote>
<p><strong>页面里的图片和视频也要加水印吗？</strong></p>
<blockquote>
<p>覆盖层盖在最上面，截图时图片和视频上也会有水印。但用户如果直接下载图片原文件或者拿到视频地址，覆盖层就不起作用了。需要保护的图片和视频，要在服务端处理原文件。</p>
</blockquote>
<p><strong>水印里为什么要带时间？</strong></p>
<blockquote>
<p>只有用户名的话，能知道是谁，但不知道是什么时候截的。带上时间或者会话标识，可以对照访问日志，确认是哪一次访问泄露的。</p>
</blockquote>`};export{e as default};