var e={answerHtml:`<p>一个项目的样式越来越难维护，通常不是同一个问题在反复出现。有时是两个组件都叫 <code>.title</code>，互相污染；有时是组件库规则总盖过业务规则；有时是颜色散落在几十个文件里，改主题要逐个查找。</p>
<p>CSS Modules、层叠层和自定义属性分别处理这三类问题：<strong>名字属于谁、冲突时谁优先、样式值从哪里来。</strong> 它们可以一起用，不需要把其中一种当成包办所有问题的方案。</p>
<h3>CSS Modules：把类名归到组件模块</h3>
<p>以 Vite 项目为例，<code>Card.module.css</code> 会按 CSS Modules 处理，导入后得到源类名到构建类名的映射。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* Card.module.css */</span>
<span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-built_in">var</span>(--border-color, <span class="hljs-number">#cbd5e1</span>);
}

<span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">margin-block</span>: <span class="hljs-number">0</span> <span class="hljs-number">0.5rem</span>;
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1.25rem</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> styles <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./Card.module.css&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Card</span>(<span class="hljs-params">{ title, children }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{styles.card}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{styles.title}</span>&gt;</span>{title}<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
      {children}
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>另一个文件也可以定义 <code>.title</code>，构建工具会按配置生成不同的局部映射，降低偶然重名的风险。生成后的具体类名格式是构建实现细节，不应该让测试和业务逻辑依赖某段固定哈希。</p>
<p>这仍然是普通 DOM 和 CSS，不是 Shadow DOM。全局 <code>h2</code> 规则依然可能命中标题，祖先的 <code>color</code> 和自定义属性仍然可以继承进去，模块中直接写裸元素选择器也不会自动变成真正的 DOM 隔离。CSS Modules 主要管理局部标识符，不承诺隔绝所有外部样式。</p>
<h3>@layer：让覆盖次序成为显式约定</h3>
<p>假设第三方组件库有一个很长的按钮选择器，业务方不希望为了覆盖它而写得更长，可以给不同来源安排层次：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> reset, vendor, components, overrides;

<span class="hljs-keyword">@layer</span> vendor {
  <span class="hljs-selector-class">.panel</span> <span class="hljs-selector-class">.toolbar</span> <span class="hljs-selector-class">.button</span> {
    <span class="hljs-attribute">color</span>: <span class="hljs-number">#64748b</span>;
  }
}

<span class="hljs-keyword">@layer</span> components {
  <span class="hljs-selector-class">.button</span> {
    <span class="hljs-attribute">color</span>: <span class="hljs-number">#1d4ed8</span>;
  }
}
</code></pre></div>
<p>假设两条规则都匹配同一个按钮，而且都是普通作者声明，后面的 <code>components</code> 层优先。因此较短的 <code>.button</code> 可以覆盖前一层的长选择器，不需要通过堆叠 class 来赢得选择器特异性比较。</p>
<p>层顺序由首次建立层的次序决定，开头的声明固定了架构。以后在其他文件追加 <code>@layer components { ... }</code>，是给同一层加规则，而不是把该层重新排到最后。</p>
<p>需要注意两个例外：普通的未分层声明高于层内普通声明；<code>!important</code> 的层顺序会反转，早期层的重要声明更优先。因此只把业务代码放进层里、却把组件库留在层外，可能达不到“业务覆盖库”的目的。可以按构建方式把第三方 CSS 导入指定层，例如使用带 <code>layer(vendor)</code> 的 <code>@import</code>，并核对最终产物。</p>
<p>层叠层也不是命名空间：两个层中同名的选择器仍然能匹配同一个元素，只是声明有了明确的排序位置。CSS Modules 和层叠层因而可以协作，前者减少误匹配，后者管理有意发生的覆盖。</p>
<h3>自定义属性：把主题值从具体组件中提出来</h3>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attr">--surface-color</span>: <span class="hljs-number">#fff</span>;
  <span class="hljs-attr">--text-color</span>: <span class="hljs-number">#0f172a</span>;
  <span class="hljs-attr">--border-color</span>: <span class="hljs-number">#cbd5e1</span>;
}

<span class="hljs-selector-attr">[data-theme=<span class="hljs-string">&quot;dark&quot;</span>]</span> {
  <span class="hljs-attr">--surface-color</span>: <span class="hljs-number">#0f172a</span>;
  <span class="hljs-attr">--text-color</span>: <span class="hljs-number">#e2e8f0</span>;
  <span class="hljs-attr">--border-color</span>: <span class="hljs-number">#475569</span>;
}

<span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--text-color);
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--surface-color);
  <span class="hljs-attribute">border-color</span>: <span class="hljs-built_in">var</span>(--border-color);
}
</code></pre></div>
<p>把 <code>data-theme=&quot;dark&quot;</code> 放在整个页面或某个区域上，后代卡片就可以继承这一组值。普通的 <code>--name</code> 自定义属性参与层叠并默认继承，组件使用 <code>var()</code> 时读取的是自己所处位置的计算结果，不是构建时简单把一段文本全局替换掉。</p>
<p>语义名字比外观名字更方便换主题。<code>--surface-color</code> 表示表面背景这一用途，换成深色仍然合理；<code>--white</code> 如果后来装入深灰色，名字就与实际语义脱节。另一方面，也不必把每一个只用一次的边距都升级为全局 token，应该暴露确实需要跨组件共享或由外部配置的值。</p>
<h3>var 的回退值不是类型检查器</h3>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attr">--text-color</span>: <span class="hljs-number">16px</span>;
  <span class="hljs-attribute">color</span>: red;
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--text-color, blue);
}
</code></pre></div>
<p><code>--text-color</code> 已有值 <code>16px</code>，所以 <code>blue</code> 不会因为它“不像颜色”就自动启用。替换进 <code>color</code> 后，这个声明在计算值阶段无效；对于可继承的 <code>color</code>，会按相关缺省规则继承，而不是重新返回前面那条 <code>color: red</code>。</p>
<p><code>var(--name, fallback)</code> 主要处理被引用变量缺失或具有保证无效值等情况，不保证任意已定义值都适合目标属性。需要限定类型时可以考虑 <code>@property</code>，但注册也会改变初始值、继承等规则，必须有意识地设计。</p>
<p>实践中可以把全局主题变量放在统一入口，组件内部用 CSS Modules，第三方、组件和业务覆盖通过层组织。出现样式冲突时，先判断是类名边界、层顺序还是变量作用域出了问题，不要把所有问题都归为“权重不够”。</p>
<p>补充参考：<a href="https://vite.dev/guide/features.html#css-modules">Vite 的 CSS Modules 支持</a>、<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer">MDN 的 @layer 规则</a>。</p>`};export{e as default};