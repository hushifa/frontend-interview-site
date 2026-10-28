var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>inert</code>：区域内的元素不能聚焦、不触发点击、不能选择和编辑文字、浏览器页内查找找不到，并从无障碍树移除。已是 Baseline 广泛可用。</li>
<li><code>aria-hidden=&quot;true&quot;</code>：只从无障碍树移除，元素仍可被 Tab 聚焦，会出现“焦点落在读屏看不见的地方”。不要放在可聚焦元素或其祖先上。</li>
<li><code>disabled</code>：只用于 <code>button</code>、<code>input</code> 等表单控件，控件不能聚焦也不提交，读屏会读出“不可用”。</li>
<li><code>pointer-events: none</code>：只阻止鼠标和触摸事件，键盘和读屏完全不受影响。</li>
<li>一整块区域暂时不可用（弹窗背后的页面、加载中的面板）用 <code>inert</code>，单个控件用 <code>disabled</code>。</li>
</ul>
<h2>对比</h2>
<table><thead><tr><th></th><th>能 Tab 聚焦</th><th>能点击</th><th>读屏可见</th><th>页内查找</th></tr></thead><tbody><tr><td><code>inert</code></td><td>否</td><td>否</td><td>否</td><td>否</td></tr><tr><td><code>aria-hidden</code></td><td>是</td><td>是</td><td>否</td><td>是</td></tr><tr><td><code>disabled</code></td><td>否</td><td>否</td><td>是（不可用）</td><td>是</td></tr><tr><td><code>pointer-events: none</code></td><td>是</td><td>否</td><td>是</td><td>是</td></tr></tbody></table>
<h2>侧边面板</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;page&quot;</span>&gt;</span>…页面内容…<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">aside</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;panel&quot;</span> <span class="hljs-attr">hidden</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;panel-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;panel-title&quot;</span>&gt;</span>筛选<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  …
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;close&quot;</span>&gt;</span>关闭<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">aside</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> page = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#page&#x27;</span>);
<span class="hljs-keyword">const</span> panel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#panel&#x27;</span>);
<span class="hljs-keyword">let</span> opener = <span class="hljs-literal">null</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">openPanel</span>(<span class="hljs-params"></span>) {
  opener = <span class="hljs-variable language_">document</span>.<span class="hljs-property">activeElement</span>;
  panel.<span class="hljs-property">hidden</span> = <span class="hljs-literal">false</span>;
  page.<span class="hljs-property">inert</span> = <span class="hljs-literal">true</span>;
  panel.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;h2&#x27;</span>).<span class="hljs-property">tabIndex</span> = -<span class="hljs-number">1</span>;
  panel.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;h2&#x27;</span>).<span class="hljs-title function_">focus</span>();
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">closePanel</span>(<span class="hljs-params"></span>) {
  panel.<span class="hljs-property">hidden</span> = <span class="hljs-literal">true</span>;
  page.<span class="hljs-property">inert</span> = <span class="hljs-literal">false</span>;
  opener?.<span class="hljs-title function_">focus</span>();
}
</code></pre></div>
<p>打开时记录触发元素，关闭时把焦点还回去。如果面板是模态的，更简单的做法是直接用 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code>，它会自动让其他内容惰性。</p>
<h2>提交中的按钮</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">saveAndClose</span>(<span class="hljs-params">button, save</span>) {
  button.<span class="hljs-property">disabled</span> = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">save</span>();
    <span class="hljs-title function_">closePanel</span>();
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-title function_">showError</span>(<span class="hljs-string">&#x27;保存失败，请重试&#x27;</span>);
  } <span class="hljs-keyword">finally</span> {
    button.<span class="hljs-property">disabled</span> = <span class="hljs-literal">false</span>;
  }
}
</code></pre></div>
<p>失败时按钮恢复可用，用户可以重试；成功时关闭面板，焦点回到触发元素。提交期间也可以用 <code>aria-disabled=&quot;true&quot;</code> 代替 <code>disabled</code>，焦点不会因为按钮变为不可聚焦而丢失。</p>
<h2>注意</h2>
<ul>
<li><code>inert</code> 本身没有视觉效果，要另外用样式（例如降低不透明度）提示区域不可用。</li>
<li>用 <code>showModal()</code> 打开的 dialog 不受祖先 <code>inert</code> 影响。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不能在 <code>body</code> 上加 <code>aria-hidden</code>？弹窗通常也在 <code>body</code> 里，会一起被隐藏。旧做法是给弹窗以外的兄弟节点逐个加 <code>aria-hidden</code>，现在用 <code>inert</code> 或原生 dialog 更可靠。</li>
</ul>`};export{e as default};