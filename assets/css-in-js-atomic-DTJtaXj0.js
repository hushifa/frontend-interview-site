var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如写一个按钮，有三种常见写法。styled-components 在 JavaScript 里写 CSS，按 props 算出样式；Tailwind 直接在 <code>className</code> 里堆 <code>px-4 py-2</code> 这样的工具类；CSS Modules 写普通的 <code>.module.css</code> 文件，构建时把类名改成唯一的。</p>
<p>它们的根本差别在样式什么时候生成。styled-components 是运行时方案，组件渲染时才算出 CSS、插进页面，每一种不同的插值结果都会多一条规则。Tailwind 和 CSS Modules 在构建时就产出静态 CSS 文件，浏览器里不再跑样式引擎。</p>
<p>所以选型先看三件事：要不要在 React Server Components 里用、动态样式多不多、团队习惯写类名还是写 CSS。Next.js 官方推荐大部分样式用 Tailwind，Tailwind 不够时用 CSS Modules；想保留“在 TS 里写样式”又不要运行时，可以用 vanilla-extract 这类零运行时方案。</p>
<p>要注意，运行时 CSS-in-JS 在 RSC 和流式渲染下需要库本身支持新版 React；Tailwind 是按纯文本扫描源码的，类名不能用字符串拼出来。</p>
</blockquote>
<h2>三种方案分别在什么时候生成样式</h2>
<p><strong>CSS Modules</strong> 的官方定义是：一个 CSS 文件，里面所有类名和动画名默认都是局部作用域的。写法和普通 CSS 一样，只是构建工具会把 <code>.blog</code> 改成唯一的名字，组件里通过 <code>styles.blog</code> 拿到改名后的类名，具体用法见<a href="/questions/css-modern-architecture/">《CSS Modules、层叠层和自定义属性怎样帮助维护样式？》</a>。它只解决重名，不管设计规范，也没有运行时。</p>
<p><strong>Tailwind</strong> 的文档说，它不是一份很大的静态样式表，而是在编译 CSS 时，扫描项目里所有文件，找出看起来像类名的符号，再只为这些类生成 CSS。所以最终的 CSS 只包含实际用到的工具类。工具类复用率高，文档的说法是 CSS 不会随着功能增加而线性增长。</p>
<p><strong>styled-components</strong> 在 JavaScript 里用模板字符串写样式，可以传一个函数根据 props 调整样式。文档说它会生成唯一的类名，并且记录页面上渲染了哪些组件，只注入这些组件的样式。样式是在渲染时才确定的，这就是所谓的“运行时开销”：浏览器要执行库的代码，算出 CSS 再插进页面。</p>
<p>Sass、Less 这类预处理器也是构建时方案，它们和这里的关系见<a href="/questions/css-preprocessors/">《Sass、Less 这类 CSS 预处理器解决了什么问题？原生 CSS 现在能替代它们吗？》</a>。</p>
<h2>为什么插值写法会生成很多条规则</h2>
<p>styled-components 的文档提到，在服务端渲染的 HTML 里，每一个不同的插值结果都会生成一条单独的 CSS 规则。下面用一个简化的 <code>css()</code> 函数模拟这种行为：相同的 CSS 文本复用一个类名，不同的文本各占一条。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> rules = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">function</span> <span class="hljs-title function_">css</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-comment">// 同样的 CSS 文本得到同一个类名，不同文本各插一条规则。</span>
  <span class="hljs-keyword">if</span> (!rules.<span class="hljs-title function_">has</span>(text)) rules.<span class="hljs-title function_">set</span>(text, <span class="hljs-string">\`c<span class="hljs-subst">\${rules.size}</span>\`</span>);
  <span class="hljs-keyword">return</span> rules.<span class="hljs-title function_">get</span>(text);
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">byInterpolation</span> = (<span class="hljs-params">width</span>) =&gt; <span class="hljs-title function_">css</span>(<span class="hljs-string">\`width: <span class="hljs-subst">\${width}</span>px;\`</span>);
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> w = <span class="hljs-number">100</span>; w &lt; <span class="hljs-number">110</span>; w += <span class="hljs-number">1</span>) <span class="hljs-title function_">byInterpolation</span>(w);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(rules.<span class="hljs-property">size</span>); <span class="hljs-comment">// 10</span>

<span class="hljs-keyword">const</span> <span class="hljs-title function_">byVariant</span> = (<span class="hljs-params">size</span>) =&gt; <span class="hljs-title function_">css</span>(size === <span class="hljs-string">&#x27;lg&#x27;</span> ? <span class="hljs-string">&#x27;padding: 12px;&#x27;</span> : <span class="hljs-string">&#x27;padding: 4px;&#x27;</span>);
[<span class="hljs-string">&#x27;lg&#x27;</span>, <span class="hljs-string">&#x27;sm&#x27;</span>, <span class="hljs-string">&#x27;lg&#x27;</span>, <span class="hljs-string">&#x27;sm&#x27;</span>, <span class="hljs-string">&#x27;lg&#x27;</span>].<span class="hljs-title function_">forEach</span>(byVariant);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(rules.<span class="hljs-property">size</span>); <span class="hljs-comment">// 12</span>

<span class="hljs-keyword">const</span> source = <span class="hljs-string">&#x27;className={\`bg-\${color}-600\`} className=&quot;text-red-600&quot;&#x27;</span>;
<span class="hljs-keyword">const</span> tokens = source.<span class="hljs-title function_">match</span>(<span class="hljs-regexp">/[a-z]+-[a-z]+-\\d+/g</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(tokens.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// text-red-600</span>
</code></pre></div>
<p>宽度从 100 到 109 各算一次，就多出 10 条规则。为什么第二段调用了 5 次只多了 2 条？因为尺寸只有两种取值，相同的文本复用了已有的类名。</p>
<p>所以 styled-components 文档建议，有限的几种变体用 data 属性写成静态样式，比如 <code>&amp;[data-size=&#x27;lg&#x27;]</code>，所有实例共用一条缓存的规则；每个实例都不一样的值，用内联 <code>style</code> 设置 CSS 自定义属性。</p>
<p>第三段模拟的是 Tailwind 的扫描方式，它把源码当纯文本处理，不理解字符串拼接。<code>bg-\${color}-600</code> 在源码里并不是一个完整的类名，所以扫不出来，只有写全的 <code>text-red-600</code> 被找到。Tailwind 文档因此要求，props 要映射成完整的类名：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> colorVariants = {
  <span class="hljs-attr">blue</span>: <span class="hljs-string">&#x27;bg-blue-600 hover:bg-blue-500&#x27;</span>,
  <span class="hljs-attr">red</span>: <span class="hljs-string">&#x27;bg-red-600 hover:bg-red-500&#x27;</span>,
};
<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">className</span>=<span class="hljs-string">{colorVariants[color]}</span>&gt;</span>提交<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
</code></pre></div>
<p>值来自接口或数据库这种运行时才知道的情况，Tailwind 文档建议用内联样式，或者内联设置 CSS 变量，再用 <code>bg-(--bg-color)</code> 这样的工具类引用。</p>
<h2>和 React Server Components 能不能一起用</h2>
<p>Next.js 文档的警告是：CSS-in-JS 要配合 Server Components 和流式渲染，需要库作者支持最新版 React，包括并发渲染。它列出了在 <code>app</code> 目录的 Client Components 里支持的库，包括 styled-components、styled-jsx、vanilla-extract、Panda CSS、StyleX 等；Emotion 当时还在适配中。</p>
<p>在 Next.js 里接入 styled-components 6 需要三步：在 <code>next.config.js</code> 里打开 <code>compiler.styledComponents</code>，写一个 <code>&#x27;use client&#x27;</code> 的样式注册组件收集渲染中产生的规则，用 <code>useServerInsertedHTML</code> 把它们插进 <code>&lt;head&gt;</code>，再用这个组件包住根布局。注册组件的核心部分如下，和 Next.js 文档一致：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-string">&#x27;use client&#x27;</span>;

<span class="hljs-keyword">import</span> <span class="hljs-title class_">React</span>, { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { useServerInsertedHTML } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;next/navigation&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">ServerStyleSheet</span>, <span class="hljs-title class_">StyleSheetManager</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;styled-components&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">StyledComponentsRegistry</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">const</span> [styledComponentsStyleSheet] = <span class="hljs-title function_">useState</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">ServerStyleSheet</span>());

  <span class="hljs-title function_">useServerInsertedHTML</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> styles = styledComponentsStyleSheet.<span class="hljs-title function_">getStyleElement</span>();
    styledComponentsStyleSheet.<span class="hljs-property">instance</span>.<span class="hljs-title function_">clearTag</span>();
    <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;&gt;</span>{styles}<span class="hljs-tag">&lt;/&gt;</span></span>;
  });

  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-variable language_">window</span> !== <span class="hljs-string">&#x27;undefined&#x27;</span>) <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;&gt;</span>{children}<span class="hljs-tag">&lt;/&gt;</span></span>;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">StyleSheetManager</span> <span class="hljs-attr">sheet</span>=<span class="hljs-string">{styledComponentsStyleSheet.instance}</span>&gt;</span>
      {children}
    <span class="hljs-tag">&lt;/<span class="hljs-name">StyleSheetManager</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>styled-components 自己的文档还写了更新的进展：它现在原生支持 RSC，不需要配置，也不需要 <code>&#x27;use client&#x27;</code>。代价是 CSS 以内联 <code>&lt;style&gt;</code> 标签的形式插在元素旁边，<code>:first-child</code>、<code>:nth-child()</code> 会把这些标签也算进去，导致样式错位，文档建议改用 <code>:first-of-type</code> 这类选择器，或者启用它提供的 RSC 插件。另外在 RSC 里 <code>ThemeProvider</code> 只是透传组件，没有 Context，主题要改用 <code>createTheme()</code> 或 CSS 自定义属性。</p>
<p>Tailwind 和 CSS Modules 没有这些问题，它们产出的是普通 CSS 文件，Server Components 里直接写 <code>className</code> 就行。</p>
<h2>零运行时 CSS-in-JS 是什么</h2>
<p>有些团队喜欢 CSS-in-JS 的写法：样式和组件放在一起，有类型提示，能引用 JS 变量。零运行时方案保留这种写法，把生成样式的时间挪到构建时。vanilla-extract 的官网介绍是“TypeScript 里的零运行时样式表”，所有样式在构建时生成，就像 Sass、Less 一样。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// styles.css.ts</span>
<span class="hljs-keyword">import</span> { style } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@vanilla-extract/css&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> container = <span class="hljs-title function_">style</span>({
  <span class="hljs-attr">display</span>: <span class="hljs-string">&#x27;flex&#x27;</span>,
  <span class="hljs-attr">flexDirection</span>: <span class="hljs-string">&#x27;column&#x27;</span>,
});
</code></pre></div>
<p><code>style()</code> 在构建时返回一个局部作用域的类名，同时把规则写进生成的 CSS 文件。代价是样式不能依赖运行时的 props 计算，动态值同样要靠 CSS 变量传进去。</p>
<h2>实际项目里怎样选</h2>
<p>如果是 Next.js App Router 项目，Next.js 的 CSS 文档给出的建议是：大部分样式用 Tailwind，Tailwind 工具类不够时用 CSS Modules 写组件专属样式，全局样式只放真正全局的东西。</p>
<p>如果团队已经大量使用 styled-components，并且主要是客户端渲染，没有必要为了“零运行时”立刻迁移。可以先把动态插值改成 data 属性和 CSS 变量，减少生成的规则数量。</p>
<p>如果设计系统需要统一的色板、间距，Tailwind 的主题配置或 CSS 自定义属性都能承载设计变量。只想解决类名冲突、团队习惯写普通 CSS，CSS Modules 是改动最小的选择。</p>
<h2>常见追问</h2>
<p><strong>Tailwind 的类名写在 HTML 里，和内联样式有什么区别？</strong></p>
<blockquote>
<p>内联样式只能写普通属性，没有伪类、媒体查询，也不能复用。Tailwind 的工具类是真正的 CSS 规则，可以写 <code>hover:</code>、响应式前缀，同一个类在全站共用一条规则。</p>
</blockquote>
<p><strong>styled-components 的 props 变化很频繁，会有什么问题？</strong></p>
<blockquote>
<p>每一个不同的插值结果都会生成一条新规则，值越分散，规则越多。文档建议有限的变体用 data 属性写成静态样式，每个实例都不同的值用内联 <code>style</code> 设置 CSS 变量。另外不要在组件的渲染函数里定义 styled 组件，文档说这会破坏缓存、明显拖慢渲染。</p>
</blockquote>
<p><strong>CSS Modules 和 Tailwind 能一起用吗？</strong></p>
<blockquote>
<p>能。Next.js 文档推荐的就是这种组合：Tailwind 负责大部分样式，CSS Modules 写 Tailwind 不方便表达的组件样式。两者都是构建时产出的普通 CSS，没有冲突。</p>
</blockquote>`};export{e as default};