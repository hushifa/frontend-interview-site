var e={answerHtml:`<h2>简答</h2>
<ul>
<li>编译时方案在构建阶段把源码（如 JSX）静态翻译成小程序的 WXML、JS 和 WXSS，运行开销小，但只能支持能静态分析的写法。</li>
<li>Taro 3 改为运行时方案：在逻辑层用 <code>@tarojs/runtime</code> 模拟精简的 DOM 和 BOM，让 React、Vue 等框架直接运行。</li>
<li>React 通过基于 <code>react-reconciler</code> 的自定义渲染器操作这棵模拟 DOM 树，Taro 再把树序列化后 <code>setData</code>，由预先生成的、可以相互引用的 <code>&lt;template&gt;</code> 渲染出界面。</li>
<li>uni-app 在编译时把 Vue 单文件组件拆成逻辑层和视图层，并用 <code>#ifdef</code> 等条件编译为不同平台保留不同代码。</li>
<li>运行时方案换来更完整的框架能力，代价是额外的运行时体积和数据传输，长列表等场景仍需要关注 setData 开销。</li>
</ul>
<h2>编译时方案</h2>
<p>Taro 文档把这类框架称为&quot;编译型的小程序框架&quot;，早期 Taro 通常被归为这一类：用 Babel 解析 JSX，把模板部分转换成 WXML，把组件逻辑转换成小程序的 <code>Page</code>、<code>Component</code> 调用。</p>
<p>这种方式生成的代码接近手写小程序，但 JSX 是任意 JavaScript 表达式，编译器只能识别有限的写法，动态渲染、高阶组件等用法会受到限制，开发体验和完整的 React 有差距。</p>
<h2>Taro 3 的运行时方案</h2>
<p>Taro 文档对实现原理的说明可以概括为四步：</p>
<ol>
<li><strong>模拟浏览器环境</strong>：<code>@tarojs/runtime</code> 在逻辑层实现了精简的 DOM、BOM API、事件系统以及 Web 框架和小程序框架之间的桥接层。</li>
<li><strong>自定义渲染器</strong>：ReactDOM 体积大、包含大量浏览器兼容代码，Taro 借助 <code>react-reconciler</code> 实现了自己的渲染器（<code>@tarojs/react</code>），把 React 的更新落到 Taro DOM 树上。</li>
<li><strong>模板递归</strong>：小程序模板必须在构建时确定，不能运行时生成。Taro 利用 <code>&lt;template&gt;</code> 可以引用其他 <code>&lt;template&gt;</code> 的特性，把 Taro DOM 树中每个节点对应渲染成一个 template，构建产物中的 <code>base.xml</code> 就是这些模板的集合。</li>
<li><strong>setData 驱动</strong>：把 Taro DOM 树的序列化数据 <code>setData</code> 给视图层，模板相互引用后渲染出最终界面。</li>
</ol>
<p>因为 React、Vue 都只和模拟 DOM 打交道，Taro 3 可以同时支持多个框架。代价是所有界面更新都要经过模拟 DOM 和 setData 两层，节点越多，序列化和渲染的成本越高。</p>
<h2>uni-app 的做法</h2>
<p>uni-app 文档说明，除 H5 外，uni-app 在各平台都分为逻辑层和视图层，虽然开发者把 JS 和 CSS 写在同一个 <code>.vue</code> 文件里，但编译时已经把它们拆开。逻辑层运行在独立的 JS 引擎中，不能使用 <code>window</code>、<code>document</code> 等浏览器 API。</p>
<p>平台差异主要靠条件编译处理：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;template&gt;
  &lt;!-- #ifdef MP-WEIXIN --&gt;
  &lt;button open-type=&quot;share&quot;&gt;分享&lt;/button&gt;
  &lt;!-- #endif --&gt;
&lt;/template&gt;

&lt;script&gt;
// #ifdef H5
console.log(&#x27;只在 Web 端打包&#x27;);
// #endif
&lt;/script&gt;
</code></pre></div>
<ul>
<li><code>#ifdef</code> 只在指定平台保留，<code>#ifndef</code> 在指定平台以外保留，以 <code>#endif</code> 结束；平台名写错时，<code>#ifdef</code> 中的代码不会生效，而 <code>#ifndef</code> 中的代码会生效，反向条件更容易踩坑。</li>
<li><code>static</code> 目录下按平台命名的子目录可以实现文件级条件编译。</li>
</ul>
<p>uni-app 的性能文档也提醒：数据变化会同步到视图层，页面不拆组件时，一个小字段的变化可能导致整页数据同步；<code>data</code> 中不应放视图用不到的变量。</p>
<h2>常见追问</h2>
<ul>
<li>跨端框架里能用 <code>document.querySelector</code> 吗？Taro 运行时提供的是逻辑层里的精简 DOM，拿不到渲染层的真实布局信息；测量尺寸要用小程序的 <code>createSelectorQuery</code> 或框架封装的 API。</li>
<li>运行时方案会让小程序变慢吗？会增加运行时体积和初始化开销，一般业务影响有限，节点多的长列表需要用虚拟列表等手段，setData 的通用优化见<a href="/questions/mini-setdata/">《setData 为什么会慢？如何优化小程序的数据更新？》</a>。</li>
</ul>`};export{e as default};