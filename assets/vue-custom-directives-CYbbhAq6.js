var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>自定义指令就是自己写一个 <code>v-xxx</code>，把对 DOM 元素的直接操作封装起来复用。比如 <code>v-focus</code> 让输入框一出现就自动聚焦，<code>v-click-outside</code> 点击元素外面时关闭菜单。</p>
<p>它是一个对象，里面写和组件类似的钩子：<code>created</code>、<code>beforeMount</code>、<code>mounted</code>、<code>beforeUpdate</code>、<code>updated</code>、<code>beforeUnmount</code>、<code>unmounted</code>。每个钩子拿到 <code>(el, binding, vnode, prevVnode)</code>，其中 <code>binding</code> 里有绑定值 <code>value</code>、旧值 <code>oldValue</code>、参数 <code>arg</code>（<code>v-x:arg</code>）和修饰符 <code>modifiers</code>（<code>v-x.foo</code>）。在 <code>&lt;script setup&gt;</code> 里，以 <code>v</code> 开头的驼峰变量，比如 <code>vFocus</code>，可以直接当 <code>v-focus</code> 用。</p>
<p>最要注意的是清理。在 <code>mounted</code> 里加的事件监听、观察器，必须在 <code>unmounted</code> 里移除。另外，只写了 <code>mounted</code> 的指令，绑定值后来变了也不会生效，要配上 <code>updated</code>。</p>
<p>指令只适合“直接摆弄 DOM”这件事。要渲染额外的结构，用组件；要管理状态、复用业务逻辑，用组合式函数。也不推荐把指令用在组件上，它会作用在组件根元素上，多根组件则会被忽略并警告。</p>
</blockquote>
<h2>最简单的例子：自动聚焦</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
const vFocus = { mounted: (el) =&gt; el.focus() };
&lt;/script&gt;

&lt;template&gt;
  &lt;input v-focus /&gt;
&lt;/template&gt;
</code></pre></div>
<p><code>mounted</code> 时元素已经插入页面，所以这时调用 <code>focus()</code> 才有效。</p>
<h2>点击外部关闭：为什么要把函数存在元素上</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// directives/clickOutside.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> clickOutside = {
  <span class="hljs-title function_">mounted</span>(<span class="hljs-params">el, binding</span>) {
    el.<span class="hljs-property">_onClickOutside</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (!el.<span class="hljs-title function_">contains</span>(event.<span class="hljs-property">target</span>)) binding.<span class="hljs-title function_">value</span>(event);
    };
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, el.<span class="hljs-property">_onClickOutside</span>);
  },
  <span class="hljs-title function_">unmounted</span>(<span class="hljs-params">el</span>) {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, el.<span class="hljs-property">_onClickOutside</span>);
    <span class="hljs-keyword">delete</span> el.<span class="hljs-property">_onClickOutside</span>;
  },
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;div v-if=&quot;open&quot; v-click-outside=&quot;() =&gt; (open = false)&quot;&gt;菜单内容&lt;/div&gt;
</code></pre></div>
<p>监听器挂在 <code>document</code> 上，元素卸载了它也不会自己消失。可是 <code>removeEventListener</code> 必须传入当初添加的同一个函数才能移除，<code>mounted</code> 和 <code>unmounted</code> 又是两个不同的函数，拿不到对方的局部变量。所以这里把处理函数存到元素上，卸载时从元素上取回同一个引用。</p>
<h2>绑定值变了怎么办</h2>
<p>下面是一个图片懒加载指令，图片进入视口才设置 <code>src</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> lazySrc = {
  <span class="hljs-title function_">mounted</span>(<span class="hljs-params">el, { value }</span>) {
    el.<span class="hljs-property">_observer</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntersectionObserver</span>(<span class="hljs-function">(<span class="hljs-params">[entry]</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (entry.<span class="hljs-property">isIntersecting</span>) {
        el.<span class="hljs-property">src</span> = el.<span class="hljs-property">dataset</span>.<span class="hljs-property">src</span>;
        el.<span class="hljs-property">_observer</span>.<span class="hljs-title function_">disconnect</span>();
      }
    });
    el.<span class="hljs-property">dataset</span>.<span class="hljs-property">src</span> = value;
    el.<span class="hljs-property">_observer</span>.<span class="hljs-title function_">observe</span>(el);
  },
  <span class="hljs-title function_">updated</span>(<span class="hljs-params">el, { value, oldValue }</span>) {
    <span class="hljs-keyword">if</span> (value !== oldValue) {
      el.<span class="hljs-property">dataset</span>.<span class="hljs-property">src</span> = value;
      <span class="hljs-keyword">if</span> (el.<span class="hljs-property">src</span>) el.<span class="hljs-property">src</span> = value; <span class="hljs-comment">// 已加载过的图片直接换地址</span>
    }
  },
  <span class="hljs-title function_">unmounted</span>(<span class="hljs-params">el</span>) {
    el.<span class="hljs-property">_observer</span>?.<span class="hljs-title function_">disconnect</span>();
  },
};
</code></pre></div>
<p>如果只写 <code>mounted</code>，图片地址后来换了，指令完全不知道，页面还显示旧图。所以要在 <code>updated</code> 里比较新旧值，自己处理变化。顺带一提，实际项目里 <code>&lt;img loading=&quot;lazy&quot;&gt;</code> 已经能满足大部分懒加载需求。</p>
<p>想全局使用，在应用上注册一次：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">app.<span class="hljs-title function_">directive</span>(<span class="hljs-string">&#x27;click-outside&#x27;</span>, clickOutside);
</code></pre></div>
<h2>哪些需求不该用指令</h2>
<p>需要渲染额外的 DOM 结构，比如 tooltip 的浮层，用组件。需要管理状态或复用业务逻辑，用组合式函数。</p>
<p>权限控制隐藏按钮也不建议用指令。用指令直接把 DOM 节点删掉，对应的组件实例并不会被卸载，还在后台运行。用 <code>v-if</code> 加一个权限判断函数，既清楚又能正确卸载。</p>
<h2>常见追问</h2>
<p><strong>指令的函数简写是什么意思？</strong></p>
<blockquote>
<p><code>app.directive(&#x27;color&#x27;, (el, binding) =&gt; {...})</code> 直接传一个函数，等于同时定义了 <code>mounted</code> 和 <code>updated</code>，适合挂载和更新时做同一件事的指令。</p>
</blockquote>
<p><strong>服务端渲染时指令会执行吗？</strong></p>
<blockquote>
<p>操作 DOM 的钩子不会在服务端执行。如果指令需要往 HTML 里输出属性，要用 <code>getSSRProps</code> 钩子提供。</p>
</blockquote>`};export{e as default};