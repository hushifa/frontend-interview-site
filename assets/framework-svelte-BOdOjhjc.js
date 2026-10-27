var e={answerHtml:`<h2>Svelte 编译的价值在哪里</h2>
<p>传统运行时框架通常在浏览器中保存组件树，再根据状态变化比较和更新。Svelte 会在构建阶段分析模板、状态依赖和事件，生成更接近具体 DOM 操作的代码。这样可以减少一部分通用运行时工作，但用户点击、状态更新、生命周期和外部副作用仍然发生在浏览器里。</p>
<p>所以“无运行时”是不准确的。编译器提前知道结构，不代表它能提前知道网络结果、用户输入或第三方库的行为。</p>
<h2>Runes 先表达状态，再表达关系</h2>
<p>Svelte 5 用 Runes 把不同意图标出来：</p>
<div class="not-prose code-block"><div class="code-language">svelte</div><pre><code class="hljs language-svelte">&lt;script&gt;
  let count = $state(0);
  let doubled = $derived(count * 2);

  function increment() {
    count += 1;
  }
&lt;/script&gt;

&lt;button onclick={increment}&gt;已点击 {count} 次&lt;/button&gt;
&lt;p&gt;两倍计数：{doubled}&lt;/p&gt;
</code></pre></div>
<p><code>$state</code> 表示会变化并驱动更新的状态，<code>$derived</code> 表示从状态计算出的结果。派生值不应再手动同步成第二份可写状态，否则容易出现一个值更新、另一个值忘记更新的问题。</p>
<p>Runes 是编译器识别的语法机制，不是可以在任意普通 <code>.js</code> 文件中 import 后调用的通用函数。共享响应式逻辑可以放在受支持的 <code>.svelte.js</code> 或 <code>.svelte.ts</code> 文件中，但仍要遵守对应的编译规则。</p>
<h2>代理状态有边界</h2>
<p>普通对象和数组放进 <code>$state</code> 后可以形成深层响应式代理，修改字段或调用 <code>push</code> 能触发相关更新。但类实例、内置集合和外部库对象不应默认当成深层代理使用。需要把这些对象交给第三方库时，要明确它拿到的是代理、快照还是原始值。</p>
<p>从代理对象中解构出普通属性，通常得到的是当时的值，不会自动建立持续跟随关系：</p>
<div class="not-prose code-block"><div class="code-language">svelte</div><pre><code class="hljs language-svelte">&lt;script&gt;
  let user = $state({ name: &#x27;小明&#x27; });
  let { name } = user; // name 不是可靠的持续响应式引用
  let currentName = $derived(user.name); // 用派生表达式读取
&lt;/script&gt;
</code></pre></div>
<p><code>$state.raw</code> 适合不需要深层代理的值，但通常要通过替换整个值来更新；<code>$state.snapshot</code> 得到的是某一时刻的普通快照，不会继续自动变化。选择哪一种，应看数据是否需要突变、是否要交给序列化或外部库，而不是为了“性能”盲目使用。</p>
<h2>派生计算和副作用必须分开</h2>
<p><code>$derived</code> 应保持纯粹，用来计算显示值、过滤结果或格式化数据；不要在派生过程中发请求、写 localStorage 或修改其他状态。需要同步外部系统时使用 <code>$effect</code>，并返回清理函数：</p>
<div class="not-prose code-block"><div class="code-language">svelte</div><pre><code class="hljs language-svelte">&lt;script&gt;
  let query = $state(&#x27;&#x27;);
  let results = $state([]);

  $effect(() =&gt; {
    const controller = new AbortController();
    const currentQuery = query.trim();

    if (!currentQuery) {
      results = [];
      return () =&gt; controller.abort();
    }

    fetch(\`/api/search?q=\${encodeURIComponent(currentQuery)}\`, {
      signal: controller.signal,
    })
      .then((response) =&gt; response.json())
      .then((data) =&gt; {
        if (!controller.signal.aborted) results = data;
      })
      .catch((error) =&gt; {
        if (error.name !== &#x27;AbortError&#x27;) console.error(error);
      });

    return () =&gt; controller.abort();
  });
&lt;/script&gt;
</code></pre></div>
<p>清理函数能取消前一次请求，但不能让所有第三方 Promise 都自动停止。异步结果提交前仍要检查取消状态或请求版本，处理错误和组件销毁。把 <code>fetch</code> 放进 effect 不会自动消除竞态。</p>
<h2>编译器不会替你消除所有性能问题</h2>
<p>Svelte 可以生成更细粒度的更新，但复杂同步计算、巨大的列表、重复请求、昂贵的第三方库和不必要的副作用仍然会拖慢页面。要不要分片、虚拟化、缓存或放入 Worker，仍需根据真实性能数据判断。</p>
<p>旧版 Svelte 的顶层 <code>let</code> 响应式、<code>$:</code> 和旧事件语法与 Runes 模式有不同规则。迁移时先确认组件采用的模式，不要把两套响应式假设混在同一段解释里。组件能编译，也不代表 SSR 输出、浏览器接管和外部资源清理都正确。</p>
<p>Svelte 负责组件编译和运行；SvelteKit 进一步提供路由、加载函数、服务端渲染和部署能力。选择 Svelte 不会自动获得整个应用架构，仍要单独设计数据加载、权限、缓存和错误恢复。</p>`};export{e as default};