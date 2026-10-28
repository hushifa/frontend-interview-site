var e={answerHtml:`<h2>简答</h2>
<ul>
<li>编译器在构建时分析模板和状态依赖，生成&quot;某个状态变了就更新这几个 DOM 节点&quot;的代码，运行时不需要比较虚拟 DOM 树。</li>
<li>Svelte 5 的 Runes：<code>$state</code> 声明响应式状态，<code>$derived</code> 声明派生值，<code>$effect</code> 执行副作用，<code>$props</code> 接收组件属性。</li>
<li><code>$state</code> 包装的普通对象和数组是深层响应式的，直接修改 <code>obj.a = 1</code> 或 <code>list.push(x)</code> 都会触发更新。</li>
<li><code>$derived</code> 应是纯计算；<code>$effect</code> 只追踪同步读取的状态，返回的函数在重新执行前和组件销毁时调用。</li>
<li>Runes 是编译器识别的语法，只能在 <code>.svelte</code> 和 <code>.svelte.js</code> / <code>.svelte.ts</code> 文件中使用。</li>
</ul>
<h2>示例</h2>
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
<p>编译后，点击按钮只会更新按钮文字、段落文字和标题，不会重新执行整个组件。</p>
<h2>深层状态与快照</h2>
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
<ul>
<li><code>$state</code> 返回的是 Proxy；交给第三方库或 <code>structuredClone</code> 时，用 <code>$state.snapshot()</code> 取得普通对象。</li>
<li>大型且不需要深层追踪的数据用 <code>$state.raw</code>，只能通过整体替换来更新。</li>
</ul>
<h2>副作用与清理</h2>
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
<p><code>query</code> 变化时先执行返回的清理函数，取消上一次请求。</p>
<h2>和 Svelte 4 的区别</h2>
<table><thead><tr><th>Svelte 4</th><th>Svelte 5</th></tr></thead><tbody><tr><td>顶层 <code>let</code> 自动响应式</td><td><code>$state</code></td></tr><tr><td><code>$: doubled = count * 2</code></td><td><code>$derived</code></td></tr><tr><td><code>$: { ... }</code> 副作用</td><td><code>$effect</code></td></tr><tr><td><code>export let name</code></td><td><code>$props()</code></td></tr><tr><td><code>on:click</code></td><td><code>onclick</code></td></tr></tbody></table>
<p>Svelte 5 仍能运行旧语法的组件，但一个组件里不能混用两种模式。</p>
<h2>常见追问</h2>
<ul>
<li>Svelte 真的没有运行时吗？有一个小型运行时，负责调度和响应式系统，只是比 React、Vue 的运行时小。</li>
<li>Svelte 和 SvelteKit 的关系？Svelte 是组件框架，SvelteKit 提供路由、数据加载、SSR 和部署，见<a href="/questions/frameworks-sveltekit/">《SvelteKit 的路由、load 和服务端边界怎样协作？》</a>。</li>
</ul>`};export{e as default};