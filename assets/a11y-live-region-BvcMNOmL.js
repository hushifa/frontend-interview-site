var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>点了“保存”，页面角落出现“已保存”，看得见的用户马上知道了，可读屏用户的焦点不在那里，什么也听不到。live region 就是解决这个问题的：给一个容器标上 <code>aria-live</code>，里面的内容一变，读屏就自动读出来。</p>
<p>关键是容器要在内容变化之前就在 DOM 里。如果新插入一个带 <code>aria-live</code> 的元素，同时写进文字，很多读屏不会播报。</p>
<p>播报有两种级别。<code>aria-live=&quot;polite&quot;</code> 等读屏把当前内容读完再播，适合大多数状态；<code>assertive</code> 会立即打断，只用于必须马上知道的错误。平时更常用角色来写：<code>role=&quot;status&quot;</code> 相当于 <code>polite</code>，<code>role=&quot;alert&quot;</code> 相当于 <code>assertive</code>。如果希望每次都读出整个区域，而不只是变化的部分，加 <code>aria-atomic=&quot;true&quot;</code>。</p>
<p>要注意，播报的文字要简短，不要把整个列表塞进去。焦点已经移到的地方，读屏本来就会读，不用再播一遍。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面是保存时的状态提示。容器先放在页面上，保存时只改它的文字。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;save-status&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">save</span>(<span class="hljs-params"></span>) {
  status.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;正在保存…&#x27;</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> api.<span class="hljs-title function_">save</span>();
    status.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;已保存&#x27;</span>;
  } <span class="hljs-keyword">catch</span> {
    status.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;保存失败，请重试&#x27;</span>;
  }
}
</code></pre></div>
<p><code>&lt;p&gt;</code> 一开始是空的，但它已经在 DOM 里，读屏已经在“盯着”它了。所以后面每次改 <code>textContent</code>，读屏都会依次读出“正在保存”“已保存”。</p>
<p>有一种情况会不播报：连续写入一模一样的文字。部分读屏会认为内容没变，于是不读。需要重复提示时，可以先清空，在下一帧再写入。</p>
<h2>不同场景用哪种</h2>
<table><thead><tr><th>场景</th><th>写法</th></tr></thead><tbody><tr><td>搜索结果数量</td><td><code>role=&quot;status&quot;</code>：“找到 12 条结果”</td></tr><tr><td>表单保存成功</td><td><code>role=&quot;status&quot;</code></td></tr><tr><td>会话即将过期</td><td><code>role=&quot;alert&quot;</code></td></tr><tr><td>购物车数量</td><td><code>role=&quot;status&quot;</code>，内容写“购物车 3 件商品”</td></tr><tr><td>聊天新消息</td><td><code>role=&quot;log&quot;</code>，新增内容依次播报</td></tr></tbody></table>
<p>购物车那一行写成“购物车 3 件商品”，而不是只写“3”，是因为读屏只读这个区域，单独一个数字用户听不懂。</p>
<h2>常见错误</h2>
<p>页面上好几个组件各放一个 live region，同时更新时就会互相打断。可以在应用层维护一两个共享的播报区域，统一往里写。</p>
<p>用 <code>assertive</code> 播报普通提示，会打断用户正在听的内容，体验很差。</p>
<p>用 <code>display: none</code> 把区域藏起来，读屏就不会播报了。需要视觉上隐藏时，用 <code>.visually-hidden</code> 这类把元素裁剪到 1px 的样式。</p>
<p>把实时变化的计时器、股价放进 live region，读屏会不停地读，用户什么别的都听不到了。</p>
<h2>常见追问</h2>
<p><strong>表单错误要不要用 live region？</strong></p>
<blockquote>
<p>提交以后，把焦点移到第一个错误字段或错误汇总上，读屏会读出焦点位置的内容，一般不用再播报。边输入边校验的即时提示，可以用 polite 区域。</p>
</blockquote>`};export{e as default};