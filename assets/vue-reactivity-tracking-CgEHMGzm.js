var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>reactive</code> 返回的是一个 Proxy，也就是给原对象套了一层“拦截器”，读属性和写属性都会先经过它。读的时候调用 <code>track</code>，记下“当前正在运行的函数依赖这个属性”；写的时候调用 <code>trigger</code>，把依赖这个属性的函数找出来重新执行。</p>
<p>这些“会被重新执行的函数”在 Vue 里叫 effect，包括组件的渲染函数、<code>computed</code> 的 getter、<code>watch</code> 和 <code>watchEffect</code>。</p>
<p>依赖是按实际读到的属性记录的，不是按整个对象。而且每次 effect 重新执行都会重新收集一遍，所以条件分支切换后不再读的属性，以后改了也不会再触发它。只有在 effect 同步执行期间读到的才算，<code>await</code> 之后或者 <code>setTimeout</code> 回调里读的都不会被追踪。</p>
<p>组件的渲染 effect 被触发后不会马上重新渲染，而是放进队列，在同一轮微任务里批量处理，同一个组件只渲染一次。</p>
</blockquote>
<h2>自己写一个最小版本</h2>
<p>先看一个几十行的简化实现，把 <code>track</code>、<code>trigger</code> 和 effect 的关系跑通：</p>
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
<p><code>effect</code> 里的函数并没有说“我依赖 <code>count</code>”，Vue 是怎么知道的？关键在 <code>activeEffect</code>。<code>effect</code> 执行函数之前，先把自己登记为“当前正在运行的 effect”。函数里一读 <code>state.count</code>，就进了 Proxy 的 <code>get</code>，<code>track</code> 看到当前有 effect 在运行，就把它记到 <code>count</code> 名下。</p>
<p>之后 <code>state.count++</code> 进了 <code>set</code>，<code>trigger</code> 找到 <code>count</code> 名下的那个 effect，重新执行一遍，于是打印出 <code>count = 1</code>。</p>
<p>依赖存在 <code>targetMap</code> 里，结构是“对象 → 属性名 → 依赖它的 effect 集合”。真实实现还处理了很多情况：嵌套对象用到时才代理、数组方法、Map/Set、清理旧依赖、避免 effect 触发自己等。</p>
<h2>依赖会随分支变化</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">showName</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> });
<span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(state.<span class="hljs-property">showName</span> ? state.<span class="hljs-property">name</span> : state.<span class="hljs-property">id</span>);
});

state.<span class="hljs-property">showName</span> = <span class="hljs-literal">false</span>; <span class="hljs-comment">// 输出 1，此后依赖 showName 和 id</span>
state.<span class="hljs-property">name</span> = <span class="hljs-string">&#x27;Chen&#x27;</span>; <span class="hljs-comment">// 不再触发</span>
</code></pre></div>
<p>第一次执行时 <code>showName</code> 是 <code>true</code>，函数读了 <code>showName</code> 和 <code>name</code>。把 <code>showName</code> 改成 <code>false</code> 以后，函数重新执行，这次读的是 <code>showName</code> 和 <code>id</code>，没有读 <code>name</code>。因为每次执行都会重新收集依赖，<code>name</code> 就不在依赖里了，之后改 <code>name</code> 不会再触发这个 effect。上面的简化版没有做这一步清理，真实的 Vue 做了。</p>
<h2>改了三次，为什么只渲染一次</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">state.<span class="hljs-property">count</span>++;
state.<span class="hljs-property">count</span>++;
state.<span class="hljs-property">count</span>++;
</code></pre></div>
<p>组件只会重新渲染一次。因为组件的更新任务不会立刻执行，而是放进队列，在微任务里统一处理，同一个组件在队列里只会出现一次。这也意味着改完数据立刻去读 DOM，拿到的还是旧内容，需要 <code>await nextTick()</code>，见<a href="/questions/vue-nexttick/">《修改状态后，为什么有时需要 await nextTick()？》</a>。</p>
<h2>和 Vue 2 有什么不同</h2>
<p>Vue 2 在初始化时用 <code>Object.defineProperty</code> 遍历对象的每个已有属性，所以新增属性、删除属性和数组下标赋值都检测不到，需要 <code>Vue.set</code>。Vue 3 的 Proxy 拦截的是整个对象，嵌套对象也是访问到时才转换，这些限制都没有了。</p>
<h2>常见追问</h2>
<p><strong>为什么用 WeakMap 存依赖？</strong></p>
<blockquote>
<p>WeakMap 的键是弱引用。原始对象不再被别处引用时，它对应的依赖记录可以跟着被垃圾回收，不会因为存了依赖就一直留在内存里。</p>
</blockquote>
<p><strong>怎么调试依赖？</strong></p>
<blockquote>
<p><code>computed</code> 和 <code>watch</code> 有 <code>onTrack</code>、<code>onTrigger</code> 选项，在开发环境中会告诉你收集了哪些依赖、是哪个属性触发了更新。</p>
</blockquote>`};export{e as default};