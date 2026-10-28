var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>auto</code> 时，元素离开视口后浏览器跳过其后代的布局和绘制，接近视口时再渲染。</li>
<li>节点仍在 DOM 中：页内查找、锚点跳转、Tab 焦点和辅助技术都能访问，组件状态也不丢失。</li>
<li>跳过渲染的元素没有内容尺寸，要用 <code>contain-intrinsic-size: auto 500px</code> 给出估计高度，否则滚动条会跳动。</li>
<li>节点本身的内存和 JavaScript 工作不会减少；上万条数据仍应使用虚拟列表。</li>
<li><code>hidden</code> 值相当于内容不可见但保留渲染状态，和 <code>display: none</code> 不同。</li>
</ul>
<h2>用法</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article-section</span> {
  <span class="hljs-attribute">content-visibility</span>: auto;
  <span class="hljs-attribute">contain-intrinsic-size</span>: auto <span class="hljs-number">600px</span>;
}
</code></pre></div>
<p><code>auto 600px</code> 表示首次未渲染时按 600px 占位，渲染过一次后记住真实尺寸。适合长文章分节、评论区、长表单分组这类结构简单、数量中等的内容。</p>
<h2>和移除 DOM 对比</h2>
<table><thead><tr><th></th><th>content-visibility: auto</th><th>移除 DOM（虚拟列表）</th></tr></thead><tbody><tr><td>节点数量</td><td>不变</td><td>只保留可见的少量节点</td></tr><tr><td>页内查找、焦点</td><td>可用</td><td>不在 DOM 中的内容找不到</td></tr><tr><td>状态</td><td>保留</td><td>要自己保存和恢复</td></tr><tr><td>适用规模</td><td>数百个区块</td><td>数千到数十万条</td></tr></tbody></table>
<h2>注意事项</h2>
<ul>
<li>它会对元素应用 layout、style、paint 包含，<code>position: fixed</code> 的后代会以该元素为参照，溢出内容会被裁剪。</li>
<li>屏幕外的图片和 iframe 不会因此停止加载，仍需 <code>loading=&quot;lazy&quot;</code>。</li>
<li>计时器、订阅等 JavaScript 工作照常运行，需要单独暂停。</li>
<li>用 Performance 面板对比开启前后的渲染耗时，收益取决于被跳过内容的复杂度。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样知道元素被跳过了？元素在跳过和恢复渲染时会触发 <code>contentvisibilityautostatechange</code> 事件，可以在这里暂停或恢复内部工作。</li>
</ul>`};export{e as default};