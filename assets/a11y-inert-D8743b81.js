var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这四种写法都能让东西“用不了”，区别在于对谁用不了。<code>inert</code> 最彻底：区域里的元素不能聚焦、不触发点击、不能选择和编辑文字，浏览器的页内查找也找不到，还会从无障碍树里移除。它已经是 Baseline 广泛可用。</p>
<p><code>aria-hidden=&quot;true&quot;</code> 只对读屏隐藏，元素照样能被 Tab 聚焦，结果就是焦点落在读屏看不见的地方。所以不要把它放在可聚焦元素或它的祖先上。</p>
<p><code>disabled</code> 只给 <code>button</code>、<code>input</code> 这类表单控件用，控件不能聚焦、也不会提交，读屏会读出“不可用”。<code>pointer-events: none</code> 只挡住鼠标和触摸，键盘和读屏完全不受影响。</p>
<p>选的时候看范围：一整块区域暂时不能用，比如弹窗背后的页面、加载中的面板，用 <code>inert</code>；单个控件用 <code>disabled</code>。</p>
</blockquote>
<h2>四种写法对比</h2>
<table><thead><tr><th></th><th>能 Tab 聚焦</th><th>能点击</th><th>读屏可见</th><th>页内查找</th></tr></thead><tbody><tr><td><code>inert</code></td><td>否</td><td>否</td><td>否</td><td>否</td></tr><tr><td><code>aria-hidden</code></td><td>是</td><td>是</td><td>否</td><td>是</td></tr><tr><td><code>disabled</code></td><td>否</td><td>否</td><td>是（不可用）</td><td>是</td></tr><tr><td><code>pointer-events: none</code></td><td>是</td><td>否</td><td>是</td><td>是</td></tr></tbody></table>
<p>看这张表最容易发现问题的是后两行。用 <code>pointer-events: none</code> 做“禁用”，鼠标点不了，可键盘用户按 Tab 过去再按 Enter，照样能触发。</p>
<h2>打开侧边面板时怎样屏蔽背景</h2>
<p>下面打开一个筛选面板，同时让页面其余部分变成惰性。</p>
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
<p>打开时先记下触发元素，再给页面加 <code>inert</code>，把焦点移到面板标题上。标题本来不能聚焦，所以先设 <code>tabIndex = -1</code>。关闭时移除 <code>inert</code>，把焦点还给触发元素。</p>
<p>如果面板是模态的，更简单的做法是直接用 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code>，它会自动让其他内容变成惰性。</p>
<h2>提交中的按钮怎么处理</h2>
<p>保存期间要防止重复提交，通常把按钮设成 <code>disabled</code>。</p>
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
<p>保存失败时，按钮在 <code>finally</code> 里恢复可用，用户可以重试；保存成功时关闭面板，焦点回到触发元素。</p>
<p>可是 <code>disabled</code> 有个副作用。按钮正处于焦点时被禁用，就变得不能聚焦，焦点可能丢掉。提交期间改用 <code>aria-disabled=&quot;true&quot;</code>，按钮仍然能聚焦，读屏也知道它暂时不可用，只是点击逻辑要自己拦住。</p>
<h2>还要注意什么</h2>
<p><code>inert</code> 本身没有任何视觉效果，要另外用样式提示区域不可用，比如降低不透明度。另外，用 <code>showModal()</code> 打开的 dialog 不受祖先 <code>inert</code> 的影响。</p>
<h2>常见追问</h2>
<p><strong>为什么不能直接在 <code>body</code> 上加 <code>aria-hidden</code>？</strong></p>
<blockquote>
<p>弹窗一般也在 <code>body</code> 里面，会被一起隐藏。以前的做法是给弹窗以外的兄弟节点逐个加 <code>aria-hidden</code>，现在用 <code>inert</code> 或原生 dialog 更可靠。</p>
</blockquote>`};export{e as default};