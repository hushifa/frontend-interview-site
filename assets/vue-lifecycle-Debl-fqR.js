var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个组件从创建到销毁，顺序是 <code>setup</code> → <code>onBeforeMount</code> → <code>onMounted</code>，数据变化时走 <code>onBeforeUpdate</code> → <code>onUpdated</code>，最后是 <code>onBeforeUnmount</code> → <code>onUnmounted</code>。</p>
<p>三件事分别放在三个地方。发请求、创建响应式状态放在 <code>setup</code> 里，越早开始越好，但这时 DOM 还不存在，模板 ref 是 <code>null</code>。要聚焦、测量尺寸、初始化图表这类需要 DOM 的操作，放进 <code>onMounted</code>，这时组件已经插入页面。定时器、事件监听、WebSocket 在 <code>onUnmounted</code> 里清理，不然组件没了它们还在跑。</p>
<p>服务端渲染时只执行 <code>setup</code>（以及 <code>onServerPrefetch</code>），挂载和更新钩子都不会执行，所以访问 <code>window</code>、<code>document</code> 的代码要放进 <code>onMounted</code>。</p>
<p>还要注意，钩子要在 <code>setup</code> 里同步注册。普通的 <code>async setup()</code> 或异步回调里，<code>await</code> 之后再注册就关联不到组件了；<code>&lt;script setup&gt;</code> 是例外，编译器会在顶层 <code>await</code> 后恢复当前组件，但为了统一，最好都写在 <code>await</code> 之前。被 KeepAlive 缓存的组件切走时不卸载，触发的是 <code>onDeactivated</code> 和 <code>onActivated</code>。</p>
</blockquote>
<h2>一个组件里三件事各放哪</h2>
<p>下面的组件要请求统计数据并画一张图。请求放在 setup 里立刻发，画图要等 DOM，清理放在卸载时：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { onMounted, onUnmounted, ref } from &#x27;vue&#x27;;

const props = defineProps({ id: Number });
const chartEl = ref(null);
const data = ref(null);
let chart;

// setup 阶段就开始请求，不必等到挂载
const controller = new AbortController();
fetch(\`/api/stats/\${props.id}\`, { signal: controller.signal })
  .then((r) =&gt; r.json())
  .then((json) =&gt; {
    data.value = json;
    chart?.setData(json);
  })
  .catch((err) =&gt; {
    if (err.name !== &#x27;AbortError&#x27;) console.error(err);
  });

onMounted(() =&gt; {
  chart = createChart(chartEl.value); // 需要 DOM
  if (data.value) chart.setData(data.value);
});

onUnmounted(() =&gt; {
  controller.abort();
  chart?.destroy();
});
&lt;/script&gt;

&lt;template&gt;
  &lt;div ref=&quot;chartEl&quot; /&gt;
&lt;/template&gt;
</code></pre></div>
<p>为什么两个地方都要写 <code>setData</code>？因为请求和挂载谁先完成说不准。请求先回来，图表还没创建，<code>chart?.</code> 什么也不做，等 <code>onMounted</code> 时再把数据塞进去；挂载先完成，图表先建好，等数据回来再 <code>setData</code>。两边都检查对方是否就绪，哪种顺序都不会漏。</p>
<p>卸载时 <code>abort()</code> 也是必要的：用户很快离开了页面，请求还没回来，就直接取消，免得回来以后往一个已经销毁的图表里写数据。</p>
<h2>父子组件谁先谁后</h2>
<p>挂载时的顺序是：父 <code>setup</code> → 子 <code>setup</code> → 子 <code>onMounted</code> → 父 <code>onMounted</code>。因为父组件渲染时才创建子组件，子组件都挂好了，父组件才算挂载完成。所以在父组件的 <code>onMounted</code> 里，子组件已经全部挂载。卸载时也一样，子组件的 <code>onUnmounted</code> 先于父组件执行。</p>
<h2>为什么钩子不能在 await 之后注册</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 错误：await 之后注册，钩子无法关联到当前组件</span>
<span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchUser</span>();
<span class="hljs-title function_">onMounted</span>(<span class="hljs-function">() =&gt;</span> {});
</code></pre></div>
<p><code>onMounted</code> 要知道“现在是哪个组件在初始化”，Vue 只在 <code>setup</code> 同步执行期间记着这个组件。<code>await</code> 之后代码在稍后的微任务里继续执行，这时已经没有“当前组件”了，钩子就挂不上去。<code>&lt;script setup&gt;</code> 的顶层 <code>await</code> 是例外，编译器会在 <code>await</code> 后帮你恢复当前组件，所以那里注册也能生效，但为了统一，仍然建议放在 <code>await</code> 之前。组合式函数里的钩子也遵循同样的规则。</p>
<h2>被 KeepAlive 缓存的组件</h2>
<p>被缓存的组件切走时不会卸载，所以 <code>onUnmounted</code> 不执行，触发的是 <code>onDeactivated</code>；切回来时触发 <code>onActivated</code>。离开时需要暂停的资源，应该写在这对钩子里，见<a href="/questions/vue-keepalive-teleport/">《KeepAlive 与 Teleport 有哪些使用边界？》</a>。</p>
<h2>和 Vue 2 选项式 API 怎么对应</h2>
<table><thead><tr><th>Vue 2</th><th>Vue 3 组合式 API</th></tr></thead><tbody><tr><td><code>beforeCreate</code> / <code>created</code></td><td><code>setup</code> 本身</td></tr><tr><td><code>mounted</code></td><td><code>onMounted</code></td></tr><tr><td><code>beforeDestroy</code> / <code>destroyed</code></td><td><code>onBeforeUnmount</code> / <code>onUnmounted</code></td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong><code>onUpdated</code> 里能修改状态吗？</strong></p>
<blockquote>
<p>最好不要。改了状态会再次触发更新，更新完又进 <code>onUpdated</code>，可能造成无限循环。</p>
</blockquote>
<p><strong>组件里的错误怎么捕获？</strong></p>
<blockquote>
<p>用 <code>onErrorCaptured</code>，它能捕获后代组件抛出的错误。回调返回 <code>false</code> 可以阻止错误继续向上传播。</p>
</blockquote>`};export{e as default};