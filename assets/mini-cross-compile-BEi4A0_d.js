var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用 React 或 Vue 写代码，最后跑在小程序里，大体有两条路。一条是编译时方案：构建时把 JSX 这类源码直接翻译成小程序的 WXML、JS 和 WXSS。生成的代码接近手写，运行开销小，可是只能支持编译器看得懂的写法。</p>
<p>另一条是运行时方案，Taro 3 就是这样。它用 <code>@tarojs/runtime</code> 在逻辑层模拟一套精简的 DOM 和 BOM，让 React、Vue 直接跑起来。React 用基于 <code>react-reconciler</code> 的自定义渲染器去改这棵模拟 DOM 树，Taro 再把树序列化后 <code>setData</code> 出去，由预先生成、能互相引用的 <code>&lt;template&gt;</code> 把界面渲染出来。</p>
<p>uni-app 是在编译时把 Vue 单文件组件拆成逻辑层和视图层，再用 <code>#ifdef</code> 这类条件编译给不同平台保留不同代码。</p>
<p>运行时方案换来了更完整的框架能力，代价是多了运行时体积和数据传输。长列表这类场景，还是要注意 setData 的开销。</p>
</blockquote>
<h2>编译时方案是怎么做的</h2>
<p>Taro 文档把这类框架叫做“编译型的小程序框架”，早期 Taro 通常也被归为这一类。它用 Babel 解析 JSX，把模板部分转成 WXML，把组件逻辑转成小程序的 <code>Page</code>、<code>Component</code> 调用。</p>
<p>这样生成的代码很接近手写的小程序。可是 JSX 里能写任意 JavaScript 表达式，编译器只能识别其中有限的写法。所以动态渲染、高阶组件这类用法会受限制，开发体验和完整的 React 有差距。</p>
<h2>Taro 3 的运行时方案分几步</h2>
<p>Taro 换了个思路：既然没法把所有写法都翻译过去，那就在小程序里造一个浏览器环境，让框架原样跑。按 Taro 文档的说明，可以概括成四步。</p>
<p>第一步，模拟浏览器环境。<code>@tarojs/runtime</code> 在逻辑层实现了精简的 DOM、BOM API、事件系统，以及 Web 框架和小程序框架之间的桥接层。</p>
<p>第二步，自定义渲染器。ReactDOM 体积大，又带着大量浏览器兼容代码。所以 Taro 借助 <code>react-reconciler</code> 写了自己的渲染器 <code>@tarojs/react</code>，把 React 的更新落到 Taro 的 DOM 树上。</p>
<p>第三步，模板递归。小程序的模板必须在构建时就定下来，不能运行时生成。可是 <code>&lt;template&gt;</code> 能引用别的 <code>&lt;template&gt;</code>，Taro 就利用这一点，让 DOM 树里每个节点对应渲染成一个 template。构建产物里的 <code>base.xml</code>，就是这些模板的集合。</p>
<p>第四步，setData 驱动。把 Taro DOM 树的序列化数据 <code>setData</code> 给视图层，模板一层层互相引用，最后渲染出界面。</p>
<p>因为 React、Vue 都只跟模拟 DOM 打交道，Taro 3 可以同时支持多个框架。代价是每次界面更新都要经过模拟 DOM 和 setData 两层，节点越多，序列化和渲染的成本越高。</p>
<h2>uni-app 是怎么做的</h2>
<p>uni-app 文档说明，除了 H5，uni-app 在各个平台都分成逻辑层和视图层。开发者虽然把 JS 和 CSS 写在同一个 <code>.vue</code> 文件里，编译时其实已经拆开了。逻辑层跑在独立的 JS 引擎里，所以不能用 <code>window</code>、<code>document</code> 这些浏览器 API。</p>
<p>平台之间的差异主要靠条件编译。意思是在代码里用特殊注释标明“这段只给某个平台”，打包时不相关的代码会被去掉：</p>
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
<p><code>#ifdef</code> 表示只在指定平台保留，<code>#ifndef</code> 表示在指定平台以外保留，都以 <code>#endif</code> 结束。</p>
<p>这里有个坑：平台名写错了，<code>#ifdef</code> 里的代码不会生效，可是 <code>#ifndef</code> 里的代码反而会生效。所以反向条件更容易出问题。</p>
<p>除了代码块，<code>static</code> 目录下按平台命名的子目录，还能做到文件级的条件编译。</p>
<p>uni-app 的性能文档也提醒：数据变化会同步到视图层，如果页面不拆组件，一个小字段变了也可能导致整页数据同步。所以 <code>data</code> 里不要放视图用不到的变量。</p>
<h2>常见追问</h2>
<p><strong>跨端框架里能用 document.querySelector 吗？</strong></p>
<blockquote>
<p>Taro 运行时提供的是逻辑层里的精简 DOM，拿不到渲染层真实的布局信息。要测量尺寸，得用小程序的 <code>createSelectorQuery</code>，或者框架封装好的 API。</p>
</blockquote>
<p><strong>运行时方案会让小程序变慢吗？</strong></p>
<blockquote>
<p>会增加运行时体积和初始化开销，一般业务影响有限。节点很多的长列表要用虚拟列表等手段。setData 的通用优化见<a href="/questions/mini-setdata/">《setData 为什么会慢？如何优化小程序的数据更新？》</a>。</p>
</blockquote>`};export{e as default};