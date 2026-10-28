var e={answerHtml:`<h2>简答</h2>
<ul>
<li>未注册的自定义属性在过渡时会直接跳到新值，因为浏览器不知道怎样在两串文本之间插值。</li>
<li><code>@property --x { syntax: &#x27;&lt;color&gt;&#x27;; inherits: false; initial-value: red; }</code> 注册后，浏览器把它当成颜色计算和插值。</li>
<li><code>syntax</code> 可以是 <code>&lt;length&gt;</code>、<code>&lt;percentage&gt;</code>、<code>&lt;number&gt;</code>、<code>&lt;angle&gt;</code>、<code>&lt;color&gt;</code> 等，也可以写 <code>&#x27;*&#x27;</code> 表示任意值。</li>
<li>赋了不符合类型的值，属性会使用 <code>initial-value</code>，而不是让整条声明失效。</li>
<li><code>inherits: false</code> 可以避免组件内部变量被外层同名变量影响，也减少继承带来的样式重算。</li>
</ul>
<h2>渐变动画</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@property</span> --angle {
  syntax: <span class="hljs-string">&#x27;&lt;angle&gt;&#x27;</span>;
  inherits: false;
  initial-value: <span class="hljs-number">0deg</span>;
}

<span class="hljs-selector-class">.ring</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">conic-gradient</span>(from <span class="hljs-built_in">var</span>(--angle), steelblue, transparent);
  <span class="hljs-attribute">transition</span>: --angle <span class="hljs-number">600ms</span>;
}

<span class="hljs-selector-class">.ring</span><span class="hljs-selector-pseudo">:hover</span> {
  <span class="hljs-attr">--angle</span>: <span class="hljs-number">180deg</span>;
}
</code></pre></div>
<p>渐变本身不能过渡，但渐变里用到的注册属性可以过渡，于是整个渐变平滑旋转。</p>
<h2>JavaScript 注册</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable constant_">CSS</span>.<span class="hljs-title function_">registerProperty</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;--progress&#x27;</span>,
  <span class="hljs-attr">syntax</span>: <span class="hljs-string">&#x27;&lt;percentage&gt;&#x27;</span>,
  <span class="hljs-attr">inherits</span>: <span class="hljs-literal">false</span>,
  <span class="hljs-attr">initialValue</span>: <span class="hljs-string">&#x27;0%&#x27;</span>,
});
</code></pre></div>
<p>效果与 <code>@property</code> 相同，同一个名字只能注册一次，重复注册会抛错。</p>
<h2>注意</h2>
<ul>
<li>除 <code>syntax: &#x27;*&#x27;</code> 外，<code>initial-value</code> 必须是计算上独立的值，例如 <code>10px</code> 可以，<code>1em</code> 不可以。</li>
<li>注册对整个文档生效，组件库要使用带前缀的名字，避免和页面冲突。</li>
<li><code>@property</code> 已被主流浏览器支持；不支持时属性按普通自定义属性工作，只是失去动画和类型检查。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Shadow DOM 里写 <code>@property</code> 有效吗？注册是文档级的，写在影子树的样式表里不会生效，需要放在文档样式里或用 <code>CSS.registerProperty</code>。</li>
</ul>`};export{e as default};