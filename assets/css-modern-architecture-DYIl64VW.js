var e={answerHtml:`<h2>简答</h2>
<ul>
<li>CSS Modules 把 <code>.button</code> 编译成类似 <code>.button_a1b2</code> 的类名，解决的是全局命名冲突，不影响优先级和继承。</li>
<li><code>@layer reset, base, components, utilities;</code> 先声明顺序，后面的层覆盖前面的层，与选择器优先级无关。</li>
<li>自定义属性（<code>--color-primary</code>）会继承，可以在任意祖先上重新赋值，适合主题、密度和组件可配置项。</li>
<li>三者可以组合：组件样式用 Modules 写并放进 <code>components</code> 层，颜色和间距从自定义属性读取。</li>
<li>它们都不是完全隔离：继承属性、全局元素选择器仍会影响组件，需要更强的封装时用 Shadow DOM：外部选择器无法匹配影子树内的元素，但继承属性和自定义属性仍会传入。</li>
</ul>
<h2>层叠层管理覆盖</h2>
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
<p>第三方库放进 <code>vendor</code> 层后，业务组件不需要更高的选择器优先级就能覆盖它。未分层的样式优先于所有层，临时修复可以写在层外，但应尽快归位。</p>
<h2>自定义属性做主题</h2>
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
<p><code>var()</code> 的第二个参数是回退值。组件把可配置项暴露成自定义属性，使用方在外层赋值即可，不需要覆盖组件内部的选择器。</p>
<h2>CSS Modules</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> styles <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./Button.module.css&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Button</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{styles.button}</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>Vite、webpack 等工具都内置支持。用 <code>:global(.x)</code> 可以写全局类，<code>composes</code> 可以复用其他模块的类。</p>
<h2>常见追问</h2>
<ul>
<li>和 Tailwind 冲突吗？Tailwind 4 本身就把样式放在 <code>theme</code>、<code>base</code>、<code>components</code>、<code>utilities</code> 层里，自定义样式放进对应层即可按预期覆盖。</li>
</ul>`};export{e as default};