var e={answerHtml:`<h2>简答</h2>
<ul>
<li>顺序：<code>setup</code> → <code>onBeforeMount</code> → <code>onMounted</code> →（数据变化）<code>onBeforeUpdate</code> → <code>onUpdated</code> → <code>onBeforeUnmount</code> → <code>onUnmounted</code>。</li>
<li><code>setup</code> 中创建响应式状态、发起数据请求；这时 DOM 不存在，模板 ref 为 <code>null</code>。</li>
<li><code>onMounted</code> 中组件的 DOM 已插入页面，可以聚焦、测量、初始化第三方库。</li>
<li><code>onUnmounted</code> 中清理计时器、事件监听、观察器、WebSocket，否则组件销毁后它们仍在运行。</li>
<li>服务端渲染时只运行 <code>setup</code>（以及 <code>onServerPrefetch</code>），挂载和更新钩子都不会执行，所以访问 <code>window</code>、<code>document</code> 的代码要放进 <code>onMounted</code>。</li>
</ul>
<h2>示例</h2>
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
<p>请求和挂载哪个先完成不确定，所以两边都检查对方是否就绪。</p>
<h2>父子组件的顺序</h2>
<p>挂载时：父 <code>setup</code> → 子 <code>setup</code> → 子 <code>onMounted</code> → 父 <code>onMounted</code>。父组件的 <code>onMounted</code> 执行时，子组件都已挂载。卸载时同样是子组件的 <code>onUnmounted</code> 先于父组件。</p>
<h2>钩子必须同步注册</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 错误：await 之后注册，钩子无法关联到当前组件</span>
<span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchUser</span>();
<span class="hljs-title function_">onMounted</span>(<span class="hljs-function">() =&gt;</span> {});
</code></pre></div>
<p>生命周期钩子要在 <code>setup</code> 中同步调用。组合式函数里的钩子也遵循同一规则。</p>
<h2>KeepAlive 中的组件</h2>
<p>被缓存的组件切走时不会卸载，<code>onUnmounted</code> 不执行，改为触发 <code>onDeactivated</code>；切回时触发 <code>onActivated</code>。需要在离开时暂停的资源应写在这对钩子中，见<a href="/questions/vue-keepalive-teleport/">《KeepAlive 与 Teleport 有哪些使用边界？》</a>。</p>
<h2>和 Vue 2 选项式 API 的对应</h2>
<table><thead><tr><th>Vue 2</th><th>Vue 3 组合式 API</th></tr></thead><tbody><tr><td><code>beforeCreate</code> / <code>created</code></td><td><code>setup</code> 本身</td></tr><tr><td><code>mounted</code></td><td><code>onMounted</code></td></tr><tr><td><code>beforeDestroy</code> / <code>destroyed</code></td><td><code>onBeforeUnmount</code> / <code>onUnmounted</code></td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li><code>onUpdated</code> 里能修改状态吗？会再次触发更新，可能造成无限循环，应避免。</li>
<li>错误怎么捕获？<code>onErrorCaptured</code> 捕获后代组件抛出的错误，返回 <code>false</code> 阻止继续向上传播。</li>
</ul>`};export{e as default};