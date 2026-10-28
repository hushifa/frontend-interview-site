var e={answerHtml:`<h2>简答</h2>
<ul>
<li>容器要在内容变化之前就存在于 DOM 中；新插入一个带 <code>aria-live</code> 的元素并同时写入文字，很多读屏不会播报。</li>
<li><code>aria-live=&quot;polite&quot;</code> 等读屏说完当前内容再播报，适合大多数状态；<code>assertive</code> 立即打断，只用于必须马上知道的错误。</li>
<li><code>role=&quot;status&quot;</code> 隐含 <code>polite</code>，<code>role=&quot;alert&quot;</code> 隐含 <code>assertive</code>。</li>
<li><code>aria-atomic=&quot;true&quot;</code> 让读屏每次读出整个区域，而不只是变化的部分。</li>
<li>播报文字要简短，不要把整个列表塞进 live region；焦点已经移到的位置不需要再播报。</li>
</ul>
<h2>示例</h2>
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
<p>连续写入相同文字时，部分读屏会认为没有变化而不播报。需要重复提示时，可以先清空，再在下一帧写入。</p>
<h2>常见场景</h2>
<table><thead><tr><th>场景</th><th>写法</th></tr></thead><tbody><tr><td>搜索结果数量</td><td><code>role=&quot;status&quot;</code>：“找到 12 条结果”</td></tr><tr><td>表单保存成功</td><td><code>role=&quot;status&quot;</code></td></tr><tr><td>会话即将过期</td><td><code>role=&quot;alert&quot;</code></td></tr><tr><td>购物车数量</td><td><code>role=&quot;status&quot;</code>，内容写“购物车 3 件商品”</td></tr><tr><td>聊天新消息</td><td><code>role=&quot;log&quot;</code>，新增内容依次播报</td></tr></tbody></table>
<h2>常见错误</h2>
<ul>
<li>页面上多个组件各自放 live region，同时更新时互相打断。可以在应用层维护一两个共享的播报区域。</li>
<li>用 <code>assertive</code> 播报普通提示，打断用户正在听的内容。</li>
<li>区域用 <code>display: none</code> 隐藏，读屏不会播报。需要视觉隐藏时用 <code>.visually-hidden</code> 类（裁剪到 1px）。</li>
<li>实时更新的计时器、股价放进 live region，读屏会不停朗读。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>表单错误要不要用 live region？提交后把焦点移到第一个错误字段或错误汇总，读屏会读出焦点位置的内容，通常不需要再播报。即时校验可以用 polite 区域提示。</li>
</ul>`};export{e as default};