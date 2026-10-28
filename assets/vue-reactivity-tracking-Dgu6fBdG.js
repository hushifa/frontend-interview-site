var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>reactive</code> 返回 Proxy：<code>get</code> 时调用 <code>track</code> 记录&quot;当前正在运行的 effect 依赖这个属性&quot;，<code>set</code> 时调用 <code>trigger</code> 通知这些 effect。</li>
<li>effect 包括组件的渲染函数、<code>computed</code> 的 getter、<code>watch</code> 和 <code>watchEffect</code>。</li>
<li>依赖按实际读取的属性记录，不是按对象整体；每次 effect 重新执行时都会重新收集，所以条件分支切换后不再读取的属性不会再触发它。</li>
<li>只有在 effect 执行期间同步读取的属性才被追踪，<code>await</code> 之后或 <code>setTimeout</code> 回调里的读取不算。</li>
<li>组件渲染 effect 被触发后不会立即重新渲染，而是放入队列，在同一轮微任务中批量更新，同一组件只渲染一次。</li>
</ul>
<h2>简化实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> activeEffect = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">const</span> targetMap = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakMap</span>(); <span class="hljs-comment">// target -&gt; key -&gt; Set&lt;effect&gt;</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">track</span>(<span class="hljs-params">target, key</span>) {
  <span class="hljs-keyword">if</span> (!activeEffect) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">let</span> deps = targetMap.<span class="hljs-title function_">get</span>(target);
  <span class="hljs-keyword">if</span> (!deps) targetMap.<span class="hljs-title function_">set</span>(target, (deps = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>()));
  <span class="hljs-keyword">let</span> dep = deps.<span class="hljs-title function_">get</span>(key);
  <span class="hljs-keyword">if</span> (!dep) deps.<span class="hljs-title function_">set</span>(key, (dep = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>()));
  dep.<span class="hljs-title function_">add</span>(activeEffect);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">trigger</span>(<span class="hljs-params">target, key</span>) {
  targetMap.<span class="hljs-title function_">get</span>(target)?.<span class="hljs-title function_">get</span>(key)?.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">effect</span>) =&gt;</span> <span class="hljs-title function_">effect</span>());
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">reactive</span>(<span class="hljs-params">obj</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(obj, {
    <span class="hljs-title function_">get</span>(<span class="hljs-params">target, key, receiver</span>) {
      <span class="hljs-title function_">track</span>(target, key);
      <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">get</span>(target, key, receiver);
    },
    <span class="hljs-title function_">set</span>(<span class="hljs-params">target, key, value, receiver</span>) {
      <span class="hljs-keyword">const</span> result = <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">set</span>(target, key, value, receiver);
      <span class="hljs-title function_">trigger</span>(target, key);
      <span class="hljs-keyword">return</span> result;
    },
  });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">effect</span>(<span class="hljs-params">fn</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">run</span> = (<span class="hljs-params"></span>) =&gt; {
    activeEffect = run;
    <span class="hljs-keyword">try</span> { <span class="hljs-title function_">fn</span>(); } <span class="hljs-keyword">finally</span> { activeEffect = <span class="hljs-literal">null</span>; }
  };
  <span class="hljs-title function_">run</span>();
}

<span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> });
<span class="hljs-title function_">effect</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;count =&#x27;</span>, state.<span class="hljs-property">count</span>)); <span class="hljs-comment">// count = 0</span>
state.<span class="hljs-property">count</span>++; <span class="hljs-comment">// count = 1</span>
</code></pre></div>
<p>真实实现还处理了嵌套对象的懒代理、数组方法、Map/Set、清理旧依赖、避免 effect 触发自身等情况。</p>
<h2>依赖随分支变化</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">showName</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> });
<span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(state.<span class="hljs-property">showName</span> ? state.<span class="hljs-property">name</span> : state.<span class="hljs-property">id</span>);
});

state.<span class="hljs-property">showName</span> = <span class="hljs-literal">false</span>; <span class="hljs-comment">// 输出 1，此后依赖 showName 和 id</span>
state.<span class="hljs-property">name</span> = <span class="hljs-string">&#x27;Chen&#x27;</span>; <span class="hljs-comment">// 不再触发</span>
</code></pre></div>
<h2>更新调度</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">state.<span class="hljs-property">count</span>++;
state.<span class="hljs-property">count</span>++;
state.<span class="hljs-property">count</span>++;
</code></pre></div>
<p>组件只重新渲染一次。Vue 把组件更新任务放进队列，在微任务中统一执行，所以修改后立即读取 DOM 拿到的还是旧内容，需要 <code>await nextTick()</code>，见<a href="/questions/vue-nexttick/">《修改状态后，为什么有时需要 await nextTick()？》</a>。</p>
<h2>和 Vue 2 的差别</h2>
<p>Vue 2 在初始化时用 <code>Object.defineProperty</code> 遍历对象的每个属性，所以新增属性、删除属性和数组下标赋值检测不到，需要 <code>Vue.set</code>。Vue 3 的 Proxy 在访问时才拦截，嵌套对象也是访问到时才转换，这些限制都消失了。</p>
<h2>常见追问</h2>
<ul>
<li>为什么用 <code>WeakMap</code> 存依赖？原始对象不再被引用时，对应的依赖记录可以被垃圾回收。</li>
<li>怎么调试依赖？<code>computed</code> 和 <code>watch</code> 的 <code>onTrack</code>、<code>onTrigger</code> 选项在开发环境中报告收集和触发的依赖。</li>
</ul>`};export{e as default};