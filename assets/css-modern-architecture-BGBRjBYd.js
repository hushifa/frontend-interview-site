var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>样式难维护，通常是三类问题：类名重了，覆盖不了别人的样式，主题改起来要改一大片。这三样工具正好一个管一类。</p>
<p>CSS Modules 在构建时把 <code>.button</code> 编译成类似 <code>.button_a1b2</code> 的类名，解决全局重名，但不影响优先级和继承。<code>@layer</code> 先声明 <code>reset, base, components, utilities</code> 这样的顺序，后面的层覆盖前面的层，跟选择器优先级无关。自定义属性，比如 <code>--color-primary</code>，会继承，能在任意祖先上重新赋值，适合做主题、密度和组件的可配置项。</p>
<p>三者可以一起用：组件样式用 Modules 写，放进 <code>components</code> 层，颜色和间距从自定义属性读。</p>
<p>要注意它们都不是完全隔离的，继承属性和全局元素选择器还是会影响组件。需要更强的封装就用 Shadow DOM，外面的选择器匹配不到影子树里的元素，不过继承属性和自定义属性仍然会传进去。</p>
</blockquote>
<h2>用层叠层管理谁覆盖谁</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> reset, vendor, components, utilities;

<span class="hljs-keyword">@import</span> url(<span class="hljs-string">&#x27;vendor.css&#x27;</span>) layer(vendor);

<span class="hljs-keyword">@layer</span> components {
  <span class="hljs-selector-class">.button</span> {
    <span class="hljs-attribute">padding</span>: <span class="hljs-number">8px</span> <span class="hljs-number">16px</span>;
  }
}

<span class="hljs-keyword">@layer</span> utilities {
  <span class="hljs-selector-class">.hidden</span> {
    <span class="hljs-attribute">display</span>: none;
  }
}
</code></pre></div>
<p>第一行定好了顺序。第三方库通过 <code>@import ... layer(vendor)</code> 整个放进 <code>vendor</code> 层。</p>
<p>这样有什么好处？第三方库里可能写着 <code>.lib .btn.primary</code> 这种很长的选择器。以前想覆盖它，只能写一个优先级更高的选择器，越写越长。现在 <code>components</code> 层排在 <code>vendor</code> 后面，业务组件随便写个 <code>.button</code> 就能覆盖，不用比优先级。</p>
<p>没放进任何层的样式，比所有层都优先。临时修复可以先写在层外面，但要尽快放回该放的层里，不然层的顺序就失去意义了。</p>
<h2>用自定义属性做主题</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attr">--surface</span>: white;
  <span class="hljs-attr">--text</span>: <span class="hljs-number">#1a1a1a</span>;
}

<span class="hljs-selector-attr">[data-theme=<span class="hljs-string">&#x27;dark&#x27;</span>]</span> {
  <span class="hljs-attr">--surface</span>: <span class="hljs-number">#121212</span>;
  <span class="hljs-attr">--text</span>: <span class="hljs-number">#eee</span>;
}

<span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--surface);
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--text);
  <span class="hljs-attribute">padding</span>: <span class="hljs-built_in">var</span>(--card-padding, <span class="hljs-number">16px</span>);
}
</code></pre></div>
<p><code>.card</code> 只读变量，不关心现在是什么主题。外层加上 <code>data-theme=&#x27;dark&#x27;</code>，变量换了值，继承下来，卡片自然变成深色。</p>
<p><code>var()</code> 的第二个参数是回退值。<code>--card-padding</code> 没人设置时就用 16px。组件这样把可配置项暴露出来，用的人在外层赋值就行，不用去覆盖组件内部的选择器。</p>
<h2>CSS Modules 怎么用</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> styles <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./Button.module.css&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{styles.button}</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p><code>styles.button</code> 拿到的就是编译后的唯一类名，别的文件里也有 <code>.button</code> 也不会冲突。Vite、webpack 这些工具都内置支持。确实要写全局类时用 <code>:global(.x)</code>，想复用其他模块的类用 <code>composes</code>。</p>
<h2>常见追问</h2>
<p><strong>这套做法和 Tailwind 冲突吗？</strong></p>
<blockquote>
<p>不冲突。Tailwind 4 本身就把样式放在 <code>theme</code>、<code>base</code>、<code>components</code>、<code>utilities</code> 这几个层里，自己的样式放进对应的层，就能按预期覆盖。</p>
</blockquote>`};export{e as default};