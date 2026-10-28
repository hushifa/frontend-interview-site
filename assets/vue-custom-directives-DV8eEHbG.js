var e={answerHtml:`<h2>简答</h2>
<ul>
<li>指令对象可以定义 <code>created</code>、<code>beforeMount</code>、<code>mounted</code>、<code>beforeUpdate</code>、<code>updated</code>、<code>beforeUnmount</code>、<code>unmounted</code> 钩子，参数是 <code>(el, binding, vnode, prevVnode)</code>。</li>
<li><code>binding</code> 包含 <code>value</code>（绑定值）、<code>oldValue</code>、<code>arg</code>（<code>v-x:arg</code>）、<code>modifiers</code>（<code>v-x.foo</code>）。</li>
<li>在 <code>&lt;script setup&gt;</code> 中，以 <code>v</code> 开头的驼峰变量（如 <code>vFocus</code>）可以直接作为指令 <code>v-focus</code> 使用。</li>
<li>在 <code>mounted</code> 中注册的监听器、观察器，必须在 <code>unmounted</code> 中移除。</li>
<li>用在组件上时，指令作用于组件的根元素；多根组件会被忽略并警告，所以不推荐在组件上使用。</li>
</ul>
<h2>自动聚焦</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
const vFocus = { mounted: (el) =&gt; el.focus() };
&lt;/script&gt;

&lt;template&gt;
  &lt;input v-focus /&gt;
&lt;/template&gt;
</code></pre></div>
<h2>点击外部关闭</h2>
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
<p>处理函数保存在元素上，卸载时能拿到同一个引用来移除。</p>
<h2>绑定值变化</h2>
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
<p>只写 <code>mounted</code> 的指令，绑定值后续变化时不会生效。（实际项目中，<code>&lt;img loading=&quot;lazy&quot;&gt;</code> 已能满足大部分懒加载需求。）</p>
<h2>全局注册</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">app.<span class="hljs-title function_">directive</span>(<span class="hljs-string">&#x27;click-outside&#x27;</span>, clickOutside);
</code></pre></div>
<h2>什么时候不用指令</h2>
<ul>
<li>需要渲染额外的 DOM 结构（例如 tooltip 的浮层）：用组件。</li>
<li>需要管理状态或复用业务逻辑：用组合式函数。</li>
<li>权限控制隐藏按钮：用 <code>v-if</code> 加权限判断函数更清楚，指令删除 DOM 节点不会卸载对应组件实例。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>函数简写是什么意思？<code>app.directive(&#x27;color&#x27;, (el, binding) =&gt; {...})</code> 等同于同时定义 <code>mounted</code> 和 <code>updated</code>。</li>
<li>SSR 中指令会执行吗？DOM 钩子不在服务端执行，需要输出到 HTML 的属性要用 <code>getSSRProps</code> 钩子提供。</li>
</ul>`};export{e as default};