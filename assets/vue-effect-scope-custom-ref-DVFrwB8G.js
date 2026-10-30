var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件里写的 <code>watch</code>、<code>computed</code>，组件卸载时 Vue 会自动停掉。可要是在组件外面创建，比如在一个全局 store 里，就没人管它们的清理了。<code>effectScope()</code> 就是手动建一个“收纳盒”：<code>scope.run()</code> 里创建的所有 effect 都归它管，<code>scope.stop()</code> 一次全部停掉。</p>
<p>配套的 <code>onScopeDispose(fn)</code> 在当前作用域停止时调用 <code>fn</code>。每个组件的 <code>setup()</code> 本身也运行在一个作用域里，所以组合式函数用 <code>onScopeDispose</code> 代替 <code>onUnmounted</code>，在组件里和组件外都能正确清理。</p>
<p><code>customRef()</code> 解决的是另一个问题：普通 <code>ref</code> 一读就收集依赖、一写就触发更新，你改不了。<code>customRef</code> 把 <code>track</code> 和 <code>trigger</code> 交给你，在 <code>get</code> 里调 <code>track()</code>，在 <code>set</code> 里决定什么时候调 <code>trigger()</code>。官方例子是防抖 ref，输入停下一段时间后才真正更新。</p>
<p>要注意，这两个都是进阶 API，业务代码很少直接用。<code>customRef</code> 的 <code>get</code> 每次返回新对象时，作为 prop 传给子组件可能引起意外的更新，官方文档专门提醒过。</p>
</blockquote>
<h2>effectScope 怎样把 effect 收在一起</h2>
<p>先看官方文档的例子。<code>scope.run()</code> 里创建了一个 computed 和两个侦听器：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> scope = <span class="hljs-title function_">effectScope</span>();

scope.<span class="hljs-title function_">run</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> doubled = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> counter.<span class="hljs-property">value</span> * <span class="hljs-number">2</span>);

  <span class="hljs-title function_">watch</span>(doubled, <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(doubled.<span class="hljs-property">value</span>));

  <span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;Count: &#x27;</span>, doubled.<span class="hljs-property">value</span>));
});

<span class="hljs-comment">// 停掉作用域里的所有 effect</span>
scope.<span class="hljs-title function_">stop</span>();
</code></pre></div>
<p>调用 <code>scope.stop()</code> 后，<code>counter</code> 再变，两个侦听器都不会再执行。为什么不直接把每个 <code>watch</code> 返回的停止函数存起来？可以，但 effect 一多就容易漏，而且组合式函数内部创建的 effect 调用方根本拿不到。作用域会自动收集 <code>run</code> 期间同步创建的所有 effect，不用一个个记。</p>
<p><code>run</code> 会返回回调的返回值，所以可以在里面创建状态再拿出来。作用域停止后再调用 <code>run</code>，返回的是 <code>undefined</code>。</p>
<h2>什么时候需要它</h2>
<p>最典型的是在组件之外共享一份状态。比如多个组件共用一个“鼠标位置”的组合式函数，希望全局只监听一次 <code>mousemove</code>。这时可以在第一次使用时建一个作用域，把组合式函数放进去执行；最后一个使用它的组件卸载时，再 <code>stop()</code> 掉这个作用域。</p>
<p>组件里没这个需求，是因为 <code>setup()</code> 已经在组件的作用域里执行了，组件卸载时 Vue 会停掉它。<code>effectScope()</code> 还有一个 <code>detached</code> 参数，传 <code>true</code> 时新作用域不会被外层作用域收集，外层停止时它也不受影响。</p>
<h2>onScopeDispose 和 onUnmounted 有什么不同</h2>
<p>组合式函数里注册清理逻辑，常见写法是 <code>onUnmounted</code>。可是它只在组件里有效，组合式函数要是在 <code>effectScope</code> 里调用，就没有组件可以挂。</p>
<p><code>onScopeDispose(fn)</code> 挂在当前作用域上。在组件里调用，当前作用域就是组件的，组件卸载时执行；在手动作用域里调用，<code>scope.stop()</code> 时执行。所以写通用的组合式函数时用它更合适。在没有活动作用域的地方调用会给出警告，Vue 3.5 起第二个参数传 <code>true</code> 可以关掉这个警告。组合式函数的写法见<a href="/questions/vue-composables/">《组合式函数和 mixin 相比有什么维护优势？》</a>。</p>
<h2>customRef 怎样做一个防抖 ref</h2>
<p>普通 <code>ref</code> 绑在输入框上，每敲一个字就更新一次，依赖它的搜索请求也跟着发。官方文档给的防抖 ref 是这样写的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { customRef } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useDebouncedRef</span>(<span class="hljs-params">value, delay = <span class="hljs-number">200</span></span>) {
  <span class="hljs-keyword">let</span> timeout;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">customRef</span>(<span class="hljs-function">(<span class="hljs-params">track, trigger</span>) =&gt;</span> {
    <span class="hljs-keyword">return</span> {
      <span class="hljs-title function_">get</span>(<span class="hljs-params"></span>) {
        <span class="hljs-title function_">track</span>();
        <span class="hljs-keyword">return</span> value;
      },
      <span class="hljs-title function_">set</span>(<span class="hljs-params">newValue</span>) {
        <span class="hljs-built_in">clearTimeout</span>(timeout);
        timeout = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
          value = newValue;
          <span class="hljs-title function_">trigger</span>();
        }, delay);
      },
    };
  });
}
</code></pre></div>
<p>在组件里用 <code>const text = useDebouncedRef(&#x27;hello&#x27;)</code>，再 <code>v-model=&quot;text&quot;</code> 绑到输入框上。</p>
<p><code>track()</code> 和 <code>trigger()</code> 是什么？<code>track()</code> 告诉 Vue “有人读了这个值，记下来”，<code>trigger()</code> 告诉 Vue “值变了，通知读过它的地方”。这正是普通 ref 内部做的两件事，原理见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>。<code>customRef</code> 把它们交给你，所以这里 <code>set</code> 没有马上触发，而是每次重新计时，停下 200 毫秒后才更新值并 <code>trigger()</code>。</p>
<h2>用 customRef 要小心什么</h2>
<p>官方文档提醒，<code>get</code> 每次返回一个新对象时要小心。假设这个 ref 作为 prop 传给子组件，父组件因为别的状态重新渲染，就会重新读一次它，得到一个新对象。子组件比较 prop 发现变了，于是更新；可这个 ref 的 <code>set</code> 根本没被调用过。所以 <code>get</code> 应该返回保存好的值，而不是每次现造一个。</p>
<h2>常见追问</h2>
<p><strong>effectScope 能停掉 scope.run 里异步创建的 watch 吗？</strong></p>
<blockquote>
<p>作用域收集的是 <code>run</code> 执行期间创建的 effect。<code>await</code> 之后才创建的 watch，已经不在 <code>run</code> 的同步执行过程里了，需要在拿到作用域后再用 <code>scope.run()</code> 包一层。</p>
</blockquote>
<p><strong>customRef 能不能不调 track？</strong></p>
<blockquote>
<p>可以，官方说何时调用、调不调用都由你控制。不调 <code>track()</code>，读这个 ref 的地方就不会收集依赖，它变了也不会触发更新，相当于一个不响应的值。</p>
</blockquote>
<p><strong>怎样拿到当前的作用域？</strong></p>
<blockquote>
<p>用 <code>getCurrentScope()</code>，有活动作用域时返回它，否则返回 <code>undefined</code>。组合式函数可以用它判断自己是否运行在作用域里，再决定要不要注册 <code>onScopeDispose</code>。</p>
</blockquote>`};export{e as default};