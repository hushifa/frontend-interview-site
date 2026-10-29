var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>容器样式查询让组件根据父级的配置换样式。比如侧栏写上 <code>--density: compact</code>，里面的列表项用 <code>@container style(--density: compact)</code> 判断，条件成立就变紧凑。</p>
<p>它和尺寸查询不一样，不需要写 <code>container-type</code>，所有元素默认都可以当样式容器。查询的是祖先，元素不能查自己。规范里还允许查普通属性，比如 <code>style(font-weight: bold)</code>，但目前浏览器只支持自定义属性。</p>
<p>它适合“父级声明一个配置，多个子组件各自响应”的场景，比给每个子组件都加一个修饰类更集中。</p>
<p>要注意，它的支持范围比尺寸查询窄，用之前要查兼容表。不支持的浏览器会忽略整段规则，所以组件的默认样式本身要能用。</p>
</blockquote>
<h2>先看一个例子</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.sidebar</span> {
  <span class="hljs-attr">--density</span>: compact;
}

<span class="hljs-keyword">@container</span> style(<span class="hljs-attribute">--density</span>: compact) {
  <span class="hljs-selector-class">.item</span> {
    <span class="hljs-attribute">padding-block</span>: <span class="hljs-number">4px</span>;
    <span class="hljs-attribute">font-size</span>: <span class="hljs-number">0.875rem</span>;
  }
}
</code></pre></div>
<p>侧栏里的 <code>.item</code> 会自动变紧凑，主内容区里的 <code>.item</code> 保持默认，HTML 一个字都不用改。</p>
<p>自定义属性会继承，侧栏设置的 <code>--density</code> 里面所有元素都能读到。查询条件的意思是“最近的祖先上，这个属性的值是不是 <code>compact</code>”。</p>
<p>除了判断等于某个值，还可以只判断有没有设置，或者把多个条件组合起来：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* 只要设置了 --theme 就生效 */</span>
<span class="hljs-keyword">@container</span> style(--theme) {
  <span class="hljs-selector-class">.card</span> {
    <span class="hljs-attribute">border-width</span>: <span class="hljs-number">2px</span>;
  }
}

<span class="hljs-keyword">@container</span> style(<span class="hljs-attribute">--theme</span>: dark) <span class="hljs-keyword">or</span> style(<span class="hljs-attribute">--theme</span>: dim) {
  <span class="hljs-selector-class">.card</span> {
    <span class="hljs-attribute">background</span>: <span class="hljs-number">#222</span>;
  }
}
</code></pre></div>
<h2>直接用 var() 不也能做到吗</h2>
<p>自定义属性本来就能继承，写 <code>padding: var(--item-padding)</code>，再让侧栏改 <code>--item-padding</code>，也能实现密度切换。</p>
<p>区别在于要改多少东西。只传一个值时，直接用变量更简单。一个配置要同时改好几个不相关的属性，或者要切换一整段规则，比如改变布局方向、隐藏某个子元素，用变量就得为每个属性各准备一个，这时样式查询更合适。</p>
<h2>写对了却不生效，可能是哪里的问题</h2>
<p>查询比较的是计算值，写法要完全一致。<code>compact</code> 和 <code>&quot;compact&quot;</code> 是两个不同的值，一个带引号一个不带，就匹配不上。</p>
<p>用 <code>@property</code> 注册过类型的属性，可以按类型比较；没注册的属性按字符串比较。</p>
<p>不支持样式查询的浏览器会把整段 <code>@container style()</code> 规则忽略掉。所以把它当成增强，写在默认样式后面。</p>
<h2>常见追问</h2>
<p><strong>尺寸条件和样式条件能写在一起吗？</strong></p>
<blockquote>
<p>可以，比如 <code>@container card (inline-size &gt; 400px) and style(--layout: row)</code>。不过尺寸部分要求名叫 <code>card</code> 的容器设置了 <code>container-type</code>，样式部分则不需要。</p>
</blockquote>`};export{e as default};