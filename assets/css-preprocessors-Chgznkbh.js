var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>早年写 CSS，品牌色 <code>#1677ff</code> 要在几十个地方复制粘贴，改一次颜色得全局搜索替换；按钮的悬停、禁用样式要重复写一长串选择器。Sass、Less 这类预处理器就是为此出现的。按 Sass 文档的说法，它是一种编译成 CSS 的样式语言，可以使用变量、嵌套规则、混入、函数等功能。</p>
<p>它们的工作方式是：你写 <code>.scss</code> 或 <code>.less</code> 文件，构建时由编译器转换成浏览器认识的普通 CSS。所以变量、嵌套这些只在编译阶段存在，浏览器最后拿到的 CSS 里已经没有了。</p>
<p>现在原生 CSS 补上了很多能力。自定义属性 <code>--brand-color</code> 可以代替变量，而且它是运行时的，能被 JavaScript 修改、能按主题切换，这是预处理器变量做不到的；CSS 嵌套已经被现代浏览器支持，MDN 说它和预处理器的区别在于由浏览器解析，不需要预先编译；<code>@layer</code> 管理层叠优先级，<code>color-mix()</code> 能在 CSS 里混合颜色。</p>
<p>要注意，预处理器仍有原生 CSS 没有的东西：编译期的 <code>@each</code>、<code>@if</code> 循环和条件，可以批量生成工具类；<code>@use</code> 的模块系统可以拆分文件、避免命名冲突。新项目可以先看原生 CSS 是否够用，已有的预处理器项目也不必急着迁移。</p>
</blockquote>
<h2>同一段样式两种写法</h2>
<div class="not-prose code-block"><div class="code-language">scss</div><pre><code class="hljs language-scss">// Sass
$brand: #1677ff;

@mixin focus-ring {
  outline: 2px solid $brand;
  outline-offset: 2px;
}

.button {
  background: $brand;
  &amp;:hover { background: darken($brand, 8%); }
  &amp;:focus-visible { @include focus-ring; }
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* 原生 CSS */</span>
<span class="hljs-selector-pseudo">:root</span> { <span class="hljs-attr">--brand</span>: <span class="hljs-number">#1677ff</span>; }

<span class="hljs-selector-class">.button</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--brand);
  &amp;<span class="hljs-selector-pseudo">:hover</span> { <span class="hljs-attribute">background</span>: <span class="hljs-built_in">color-mix</span>(in srgb, <span class="hljs-built_in">var</span>(--brand), black <span class="hljs-number">8%</span>); }
  &amp;<span class="hljs-selector-pseudo">:focus-visible</span> {
    <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid <span class="hljs-built_in">var</span>(--brand);
    <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">2px</span>;
  }
}
</code></pre></div>
<p>两者效果接近，差别在什么时候计算。Sass 的 <code>$brand</code> 和 <code>darken()</code> 在编译时就算成了固定的颜色值，CSS 文件里写死了 <code>#1677ff</code>。原生的 <code>var(--brand)</code> 在浏览器里才取值，给 <code>[data-theme=&#x27;dark&#x27;]</code> 重新定义 <code>--brand</code>，所有用到它的地方立刻跟着变，切换主题不需要重新编译。</p>
<p>Sass 官方文档说 <code>darken()</code> 只是把亮度减去固定的量，往往不是想要的效果，所以它没有被放进新的模块系统，将来还会被移除；要让颜色按百分比变暗，推荐用 <code>color.scale()</code>。原生的 <code>color-mix()</code> 写法不同，结果也不一定和 <code>darken</code> 完全一样，迁移时要对照效果。</p>
<p><code>@mixin</code> 在原生 CSS 里没有直接对应的写法。可以把公共样式写成一个类名，或者用自定义属性传参数。</p>
<h2>PostCSS 和预处理器是什么关系</h2>
<p>PostCSS 不是预处理器，它是一个处理 CSS 的工具平台，本身不做任何转换，由插件完成具体工作。常用的 Autoprefixer 根据目标浏览器自动加前缀；postcss-preset-env 让你提前使用新的 CSS 语法，再转换成目标浏览器支持的写法。很多项目里两者一起用：Sass 负责编写阶段的便利，PostCSS 负责兼容性处理。</p>
<h2>常见追问</h2>
<p><strong>CSS Modules 和预处理器冲突吗？</strong></p>
<blockquote>
<p>不冲突。CSS Modules 解决的是类名作用域问题，把类名编译成唯一的名字，避免组件之间样式冲突；预处理器解决的是写法问题。可以写 <code>Button.module.scss</code>，两者同时生效，样式组织方式见<a href="/questions/css-modern-architecture/">《CSS Modules、层叠层和自定义属性怎样帮助维护样式？》</a>。</p>
</blockquote>
<p><strong>Sass 的 <code>@import</code> 为什么不推荐了？</strong></p>
<blockquote>
<p>Sass 已经弃用 <code>@import</code>，推荐 <code>@use</code> 和 <code>@forward</code>。<code>@import</code> 会把所有变量、混入放进全局，多个文件之间容易互相覆盖，同一个文件被导入多次还会重复输出 CSS；<code>@use</code> 让每个文件成为独立的模块，用命名空间访问，只会加载一次。</p>
</blockquote>`};export{e as default};