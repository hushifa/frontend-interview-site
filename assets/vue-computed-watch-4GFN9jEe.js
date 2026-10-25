var e={answerHtml:`<p>总价由单价与数量决定，搜索请求由关键词变化触发，日志记录可能使用多个响应式来源。这些需求不应该都写成一个 watch，再把结果到处复制。</p>
<p>先判断要的是一个可以读取的派生值，还是某种外部副作用。前者通常适合 computed；后者再根据触发条件是否需要显式表达，选择 watch 或 watchEffect。</p>
<h3>computed 让派生结果只有一份来源</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { computed, nextTick, reactive, ref, watch } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> price = <span class="hljs-title function_">ref</span>(<span class="hljs-number">10</span>);
<span class="hljs-keyword">const</span> quantity = <span class="hljs-title function_">ref</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> total = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> price.<span class="hljs-property">value</span> * quantity.<span class="hljs-property">value</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(total.<span class="hljs-property">value</span>); <span class="hljs-comment">// 20</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(total.<span class="hljs-property">value</span>); <span class="hljs-comment">// 20</span>
quantity.<span class="hljs-property">value</span> = <span class="hljs-number">3</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(total.<span class="hljs-property">value</span>); <span class="hljs-comment">// 30</span>
</code></pre></div>
<p>computed 返回可读取的计算引用，并根据响应式依赖缓存。依赖没有变时，重复读取可以复用结果；依赖变化后，再按需要获得新的派生结果。</p>
<p>不必再用 watch 把 price、quantity 同步到另一个可随意修改的 total state，那样反而多出一份可能不一致的状态。getter 应只计算结果，不在里面发请求、修改别的响应式值或操作 DOM。</p>
<p>也不要把 async getter 得到的 Promise 当作自动请求管理。computed 不负责等待、loading、错误与取消。Date.now 等非响应式读取也不会自己让 computed 不断失效，必须有实际响应式来源发生变化。</p>
<h3>watch 明确说明监听什么</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> });
<span class="hljs-keyword">const</span> changes = [];
<span class="hljs-keyword">const</span> stop = <span class="hljs-title function_">watch</span>(
  <span class="hljs-function">() =&gt;</span> state.<span class="hljs-property">count</span>,
  <span class="hljs-function">(<span class="hljs-params">next, previous</span>) =&gt;</span> changes.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${previous}</span>-&gt;<span class="hljs-subst">\${next}</span>\`</span>),
);

state.<span class="hljs-property">count</span> = <span class="hljs-number">1</span>;
state.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(changes.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0-&gt;2</span>
<span class="hljs-title function_">stop</span>();
</code></pre></div>
<p>watch 默认懒执行，先记录来源，再在相关变化后调用回调。默认调度可以合并同一轮变化，所以本例观察到旧值 0 与最后的新值 2，不是保证每次赋值都单独产生一个回调。</p>
<p>来源可以是 ref、响应式对象、getter 或多个来源组成的数组。<code>watch(state.count, ...)</code> 传进去的是一个当时的数字，不是可继续追踪的属性入口，因此通常应写 getter。</p>
<p>watch 只追踪明确给出的源，回调里额外读取其他响应式值，不会自动把它们全部变成触发条件。需要首次也执行时，可以使用 immediate，并处理首次没有普通旧值的情况。</p>
<h3>watchEffect 适合依赖自然来自同步读取的副作用</h3>
<p>watchEffect 会立即运行并自动记录同步执行中读取的响应式来源，相关来源变化后重新执行。它不提供与 watch 相同的新旧值参数，优势是不用在读取和依赖列表之间重复维护同一组来源。</p>
<p>async watchEffect 只收集第一次 await 之前的同步读取。等待后才读取的变量，不会因为出现在同一个函数文本中，就自动加入这一轮依赖。</p>
<p>需要精确控制请求由哪个 ID、关键词或配置触发时，watch 的显式源通常更清楚；小范围自动同步或调试观察则可以考虑 watchEffect。不要为了省一行源表达式而让触发关系变得难以预测。</p>
<h3>请求副作用必须处理失效清理</h3>
<p>以下组件假设项目提供 <code>/api/search?q=...</code>，返回包含字符串 label 的 JSON；接口本身需要由实际项目实现。</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref, watch } from &#x27;vue&#x27;;

const query = ref(&#x27;&#x27;);
const result = ref(&#x27;请输入关键词&#x27;);
const loading = ref(false);

watch(query, async (value, _previous, onCleanup) =&gt; {
  const keyword = value.trim();
  if (!keyword) {
    result.value = &#x27;请输入关键词&#x27;;
    loading.value = false;
    return;
  }

  const controller = new AbortController();
  let active = true;
  onCleanup(() =&gt; {
    active = false;
    controller.abort();
  });

  loading.value = true;
  result.value = &#x27;&#x27;;
  try {
    const response = await fetch(\`/api/search?q=\${encodeURIComponent(keyword)}\`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    const data = await response.json();
    if (typeof data?.label !== &#x27;string&#x27;) throw new Error(&#x27;返回数据不符合约定&#x27;);
    if (active) result.value = data.label;
  } catch (error) {
    if (active) result.value = error instanceof Error ? error.message : &#x27;查询失败&#x27;;
  } finally {
    if (active) loading.value = false;
  }
});
&lt;/script&gt;

&lt;template&gt;
  &lt;label&gt;关键词&lt;input v-model=&quot;query&quot; /&gt;&lt;/label&gt;
  &lt;p role=&quot;status&quot;&gt;{{ loading ? &#x27;查询中&#x27; : result }}&lt;/p&gt;
&lt;/template&gt;
</code></pre></div>
<p>关键词变化时，旧回调先被标记为失效并请求取消。即使某些后续工作不响应取消，active 检查也阻止旧结果和旧 finally 覆盖新查询的状态。</p>
<p>Vue 3.5 及以上还提供 onWatcherCleanup，但必须在相应同步执行阶段登记，不能等 await 之后再调用。示例使用回调参数 onCleanup，并同样选择在等待前登记，避免清理关系建立得太晚。</p>
<p>这里的注册方式不同于 React Effect：不是让 async 回调返回一个清理函数，而是通过 Vue 的清理入口登记。返回的 Promise 也不会自动把网络请求变成可取消资源。</p>
<h3>深度监听不等于给你一份历史快照</h3>
<p>直接 watch 响应式对象通常具有相应深度监听行为；watch 一个返回对象的 getter，默认更关注这个返回引用是否替换，需要时再开启 deep。</p>
<p>深层属性原地变化时，新值与旧值可能仍是同一个对象引用，不能把它们当成两份独立快照来计算差异。需要历史差异，应明确保存或生成相应数据，而不是期待 deep 自动深拷贝。</p>
<p>深度遍历可能有成本。Vue 3.5 起 deep 也可以指定最大遍历深度，但这只是进一步控制边界，不代表大结构从此可以无成本地随意深度监听。</p>
<h3>选择回调时机与停止时机</h3>
<p>默认侦听回调与组件更新存在调度顺序，读取所属组件的新 DOM 时，应考虑 flush:&#x27;post&#x27;、watchPostEffect 或在正确位置等待 nextTick。flush:&#x27;sync&#x27; 则同步触发、缺少相同的批处理优势，不宜不加分析地用于频繁变动的大数组。</p>
<p>setup 中同步创建的侦听通常会随组件卸载停止。异步创建或脱离组件生命周期的侦听，需要自己持有并调用停止函数，否则可能继续执行无用工作。</p>
<p>最后，computed 负责让派生数据可读，watch/watchEffect 负责在变化后做事。把这两个目的分开，通常比反复添加更多侦听器来同步同一事实更容易保证正确性。</p>`};export{e as default};