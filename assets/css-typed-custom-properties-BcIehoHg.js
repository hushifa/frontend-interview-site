var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给自定义属性写 transition，比如 <code>--angle</code> 从 <code>0deg</code> 变到 <code>180deg</code>，会发现它直接跳过去，没有动画。因为没注册的自定义属性在浏览器看来就是一串文字，它不知道两串文字中间的值是什么。</p>
<p>用 <code>@property</code> 注册一下就好了，比如 <code>@property --x { syntax: &#x27;&lt;color&gt;&#x27;; inherits: false; initial-value: red; }</code>。浏览器知道它是颜色，就能算中间值。<code>syntax</code> 可以是 <code>&lt;length&gt;</code>、<code>&lt;percentage&gt;</code>、<code>&lt;number&gt;</code>、<code>&lt;angle&gt;</code>、<code>&lt;color&gt;</code> 等，写 <code>&#x27;*&#x27;</code> 表示任意值。</p>
<p>注册后还多了类型检查。赋了不符合类型的值，这条声明在计算值阶段无效：<code>inherits: false</code> 时用 <code>initial-value</code>，<code>inherits: true</code> 时用父元素的值。</p>
<p><code>inherits: false</code> 还有个好处，组件内部的变量不会被外面同名的变量影响，也减少了继承带来的样式重算。</p>
</blockquote>
<h2>让渐变转起来</h2>
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
<p>渐变本身是不能过渡的，直接给 <code>background</code> 写 transition 没用。</p>
<p>可是这里过渡的不是渐变，而是渐变里用到的 <code>--angle</code>。它注册成了角度，浏览器能算出 0 到 180 度之间的每个值，每一帧渐变都按当前角度重新画，看起来就是整个渐变在平滑旋转。去掉 <code>@property</code> 那一段，悬停时就会直接跳到 180 度。</p>
<h2>用 JavaScript 注册</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable constant_">CSS</span>.<span class="hljs-title function_">registerProperty</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;--progress&#x27;</span>,
  <span class="hljs-attr">syntax</span>: <span class="hljs-string">&#x27;&lt;percentage&gt;&#x27;</span>,
  <span class="hljs-attr">inherits</span>: <span class="hljs-literal">false</span>,
  <span class="hljs-attr">initialValue</span>: <span class="hljs-string">&#x27;0%&#x27;</span>,
});
</code></pre></div>
<p>效果和 <code>@property</code> 一样。同一个名字只能注册一次，重复注册会抛错。</p>
<h2>要注意什么</h2>
<p>赋错类型的值，比如给 <code>&lt;angle&gt;</code> 写 <code>red</code>，这条声明不是被跳过去用下一条，而是在计算值阶段才判定无效。这时 <code>inherits: false</code> 退回 <code>initial-value</code>，<code>inherits: true</code> 取父元素的值。</p>
<p>除了 <code>syntax: &#x27;*&#x27;</code>，<code>initial-value</code> 必须是不依赖上下文就能算出的值。<code>10px</code> 可以，<code>1em</code> 不行，因为 <code>em</code> 要看元素的字号。</p>
<p>注册是对整个文档生效的。组件库要给名字加前缀，免得和页面里的属性冲突。</p>
<p><code>@property</code> 主流浏览器都支持了。不支持的话，属性按普通自定义属性工作，只是没有动画和类型检查。</p>
<h2>常见追问</h2>
<p><strong>在 Shadow DOM 里写 <code>@property</code> 有效吗？</strong></p>
<blockquote>
<p>无效。注册是文档级别的，写在影子树的样式表里不会生效。要放在文档的样式里，或者用 <code>CSS.registerProperty</code> 注册。</p>
</blockquote>`};export{e as default};