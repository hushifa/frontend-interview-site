var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Svelte 的思路是把工作挪到构建时。编译器先分析组件的模板和状态，生成“某个状态变了就去更新这几个 DOM 节点”的代码。所以运行时不需要虚拟 DOM，也不用比较新旧两棵树。不过它不是完全没有运行时，还有一个小型运行时负责调度和响应式。</p>
<p>Svelte 5 用 Runes 来声明响应式，就是几个以 <code>$</code> 开头、编译器认识的特殊写法：<code>$state</code> 声明状态，<code>$derived</code> 声明派生值，<code>$effect</code> 执行副作用，<code>$props</code> 接收组件属性。</p>
<p><code>$state</code> 包住的普通对象和数组是深层响应式的，直接写 <code>obj.a = 1</code> 或者 <code>list.push(x)</code> 都会触发更新。</p>
<p>要注意两点。<code>$derived</code> 应该是纯计算；<code>$effect</code> 只追踪同步读取的状态。另外 Runes 只能写在 <code>.svelte</code>、<code>.svelte.js</code>、<code>.svelte.ts</code> 文件里，因为它要靠编译器处理。</p>
</blockquote>
<h2>先看一个计数器</h2>
<p>下面一个组件把四种 Rune 都用上了。</p>
<div class="not-prose code-block"><div class="code-language">svelte</div><pre><code class="hljs language-svelte">&lt;script&gt;
  let { initial = 0 } = $props();
  let count = $state(initial);
  let doubled = $derived(count * 2);

  $effect(() =&gt; {
    document.title = \`计数 \${count}\`;
  });
&lt;/script&gt;

&lt;button onclick={() =&gt; count++}&gt;点击 {count} 次&lt;/button&gt;
&lt;p&gt;两倍：{doubled}&lt;/p&gt;
</code></pre></div>
<p><code>count++</code> 看起来只是改了一个普通变量，为什么界面会变？因为编译器看到 <code>count</code> 是用 <code>$state</code> 声明的，就把对它的读写都改写成了响应式的读写。</p>
<p>编译后，点击按钮只会更新按钮文字、段落文字和页面标题这三处，不会把整个组件重新执行一遍。这就是“编译成直接更新 DOM 的代码”的意思。</p>
<h2>深层状态和快照</h2>
<p><code>$state</code> 包住数组和对象时，返回的其实是一个 Proxy，也就是一个能拦截读写的代理对象。所以直接改里面的属性也能被感知到。</p>
<div class="not-prose code-block"><div class="code-language">svelte</div><pre><code class="hljs language-svelte">&lt;script&gt;
  let todos = $state([{ text: &#x27;学习 Runes&#x27;, done: false }]);

  function toggle(i) {
    todos[i].done = !todos[i].done; // 直接修改就会更新
  }

  function save() {
    localStorage.setItem(&#x27;todos&#x27;, JSON.stringify($state.snapshot(todos)));
  }
&lt;/script&gt;
</code></pre></div>
<p>可是 Proxy 交给第三方库或者 <code>structuredClone</code> 时可能出问题，所以 <code>save</code> 里先用 <code>$state.snapshot()</code> 取出一份普通对象。</p>
<p>如果数据很大，又不需要深层追踪，可以用 <code>$state.raw</code>。它不会变成 Proxy，代价是只能整体替换来更新，改内部属性不会触发更新。</p>
<h2>副作用怎样清理</h2>
<p><code>$effect</code> 可以返回一个函数，这个函数会在 effect 下一次重新执行前，以及组件销毁时调用。下面用它取消过期的搜索请求：</p>
<div class="not-prose code-block"><div class="code-language">svelte</div><pre><code class="hljs language-svelte">&lt;script&gt;
  let query = $state(&#x27;&#x27;);
  let results = $state([]);

  $effect(() =&gt; {
    const q = query.trim();
    if (!q) {
      results = [];
      return;
    }
    const controller = new AbortController();
    fetch(\`/api/search?q=\${encodeURIComponent(q)}\`, { signal: controller.signal })
      .then((r) =&gt; r.json())
      .then((data) =&gt; (results = data))
      .catch((err) =&gt; {
        if (err.name !== &#x27;AbortError&#x27;) console.error(err);
      });
    return () =&gt; controller.abort();
  });
&lt;/script&gt;
</code></pre></div>
<p>effect 里同步读了 <code>query</code>，所以 <code>query</code> 一变它就重新执行。重新执行之前，先调用上一次返回的清理函数，把上一次还没回来的请求取消掉，这样慢的旧结果就不会覆盖新结果。</p>
<h2>和 Svelte 4 有什么区别</h2>
<p>Svelte 4 靠约定隐式声明响应式，Svelte 5 改成了显式的 Runes：</p>
<table><thead><tr><th>Svelte 4</th><th>Svelte 5</th></tr></thead><tbody><tr><td>顶层 <code>let</code> 自动响应式</td><td><code>$state</code></td></tr><tr><td><code>$: doubled = count * 2</code></td><td><code>$derived</code></td></tr><tr><td><code>$: { ... }</code> 副作用</td><td><code>$effect</code></td></tr><tr><td><code>export let name</code></td><td><code>$props()</code></td></tr><tr><td><code>on:click</code></td><td><code>onclick</code></td></tr></tbody></table>
<p>Svelte 5 仍然能运行旧语法写的组件，但同一个组件里不能两种模式混着用。</p>
<h2>常见追问</h2>
<p><strong>Svelte 真的没有运行时吗？</strong></p>
<blockquote>
<p>有，只是比较小。它负责调度和响应式系统，比 React、Vue 的运行时小。没有的是虚拟 DOM 和比较新旧树的那部分。</p>
</blockquote>
<p><strong>Svelte 和 SvelteKit 是什么关系？</strong></p>
<blockquote>
<p>Svelte 是组件框架，管组件怎么写、怎么更新。SvelteKit 在它上面提供路由、数据加载、SSR 和部署，详见<a href="/questions/frameworks-sveltekit/">《SvelteKit 的路由、load 和服务端边界怎样协作？》</a>。</p>
</blockquote>`};export{e as default};