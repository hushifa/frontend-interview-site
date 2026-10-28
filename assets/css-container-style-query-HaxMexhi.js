var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>@container style(--variant: compact)</code> 在最近祖先上该自定义属性等于 <code>compact</code> 时生效。</li>
<li>样式查询不需要 <code>container-type</code>，所有元素默认都是样式容器；查询的是祖先，元素不能查询自己。</li>
<li>规范允许查询普通属性（如 <code>style(font-weight: bold)</code>），但目前浏览器只支持自定义属性。</li>
<li>它适合“父级声明一个配置，多个子组件各自响应”，比给每个子组件加修饰类更集中。</li>
<li>支持范围比尺寸查询窄，使用前查兼容表，不支持时组件应保持默认样式可用。</li>
</ul>
<h2>示例</h2>
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
<p>侧栏里的 <code>.item</code> 自动变紧凑，主内容区的 <code>.item</code> 保持默认，HTML 不用改。</p>
<p>也可以只判断属性是否存在，或组合多个条件：</p>
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
<h2>和直接用变量有什么区别</h2>
<p>自定义属性本身就能继承，<code>padding: var(--item-padding)</code> 也能实现密度切换。样式查询的价值在于一个配置要改变多个不相关的属性，或者要切换整段规则，例如改变布局方向、隐藏某个子元素。只是传一个值时，直接用变量更简单。</p>
<h2>注意</h2>
<ul>
<li>查询的是计算值，值的写法要完全一致，<code>compact</code> 和 <code>&quot;compact&quot;</code> 不同。</li>
<li>用 <code>@property</code> 注册的属性可以做类型化比较，未注册属性按字符串比较。</li>
<li>不支持样式查询的浏览器会忽略整段 <code>@container style()</code> 规则，把它当作增强写在默认样式之后。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>能同时写尺寸和样式条件吗？可以，<code>@container card (inline-size &gt; 400px) and style(--layout: row)</code>，尺寸部分要求该容器设置了 <code>container-type</code>。</li>
</ul>`};export{e as default};