var e={answerHtml:`<p>一个面板需要等异步 setup 或异步组件准备好才能完整显示，Suspense 可以在边界层统一协调等待，而不是让每个子组件各自显示一个不相关的 loading。</p>
<p>当前 Vue 文档仍把 Suspense 标为实验性功能，使用时应与项目版本和框架集成一起验证。它提供的是特定异步组件协议，不是页面里所有 Promise 的通用监视器。</p>
<h3>顶层 await 会让 script setup 成为异步依赖</h3>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- AsyncPanel.vue --&gt;
&lt;script setup&gt;
const props = defineProps({ fail: Boolean });
const shouldFail = props.fail;
await new Promise(resolve =&gt; setTimeout(resolve, 300));
if (shouldFail) throw new Error(&#x27;模拟加载失败&#x27;);
const message = &#x27;内容已准备好&#x27;;
&lt;/script&gt;

&lt;template&gt;
  &lt;article&gt;&lt;p&gt;{{ message }}&lt;/p&gt;&lt;/article&gt;
&lt;/template&gt;
</code></pre></div>
<p>这里用本地延迟模拟准备过程，不发网络请求。shouldFail 保存本次开始时的选项，后续修改 prop 不会让这个已经启动的初始化过程自动重新执行。</p>
<p>调用方提供等待回退，并在祖先中处理错误：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { onErrorCaptured, ref } from &#x27;vue&#x27;;
import AsyncPanel from &#x27;./AsyncPanel.vue&#x27;;

const attempt = ref(0);
const fail = ref(false);
const pending = ref(true);
const errorMessage = ref(&#x27;&#x27;);

function reload() {
  if (pending.value) return;
  errorMessage.value = &#x27;&#x27;;
  attempt.value += 1;
}

function retry() {
  fail.value = false;
  reload();
}

onErrorCaptured(error =&gt; {
  console.error(&#x27;异步面板失败：&#x27;, error);
  pending.value = false;
  errorMessage.value = &#x27;内容准备失败，请重试。&#x27;;
  return false;
});
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;label&gt;&lt;input v-model=&quot;fail&quot; type=&quot;checkbox&quot; :disabled=&quot;pending&quot; /&gt;模拟下次失败&lt;/label&gt;
    &lt;button type=&quot;button&quot; :disabled=&quot;pending&quot; @click=&quot;reload&quot;&gt;重新加载&lt;/button&gt;
    &lt;div v-if=&quot;errorMessage&quot; role=&quot;alert&quot;&gt;
      &lt;p&gt;{{ errorMessage }}&lt;/p&gt;
      &lt;button type=&quot;button&quot; @click=&quot;retry&quot;&gt;重试&lt;/button&gt;
    &lt;/div&gt;
    &lt;Suspense v-else :key=&quot;attempt&quot; @pending=&quot;pending = true&quot; @resolve=&quot;pending = false&quot;&gt;
      &lt;AsyncPanel :fail=&quot;fail&quot; /&gt;
      &lt;template #fallback&gt;&lt;p role=&quot;status&quot;&gt;正在准备内容&lt;/p&gt;&lt;/template&gt;
    &lt;/Suspense&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>初次渲染时默认内容需要等待，先显示 fallback；完成后展示面板。重新加载改变边界身份，让本例重新创建异步子树；失败由祖先的 onErrorCaptured 转成错误界面，重试先修正模拟失败条件，再创建新尝试。</p>
<p>返回 false 会阻止这份错误继续按相应捕获链传播，因此示例同时记录了诊断。真实项目应明确哪些错误已被本地处理，不要为了没有控制台输出就统一吞掉所有故障。</p>
<h3>哪些异步工作会被协调</h3>
<p>async setup、script setup 顶层 await，以及符合规则的异步组件，是常见的 Suspense 依赖。普通事件处理器中发出的请求，或挂载后某个 watch 启动的异步工作，不会自动使现有边界进入同样的等待状态。</p>
<p>这些后续工作仍需要自己的 pending、错误和取消策略。把任意 fetch 放进组件文件，不等于它已经成为初次渲染依赖。</p>
<p>异步组件处在 Suspense 接管范围内时，它自己的 loading、error、delay、timeout 等装载显示选项可能由外层边界取代。需要自行控制装载状态时，可以按异步组件 API 使用 suspensible 等选项，但要区分组件装载与内部 async setup 的不同阶段。</p>
<h3>fallback 与错误界面不是同一种状态</h3>
<p>Suspense 本身不提供完整错误处理插槽。等待失败后，应通过祖先错误捕获、框架机制或明确的错误状态进行恢复，而不是让“加载中”一直显示。</p>
<p>空数据也不等于还在等待。请求已经成功但没有记录时，应展示正常的空状态；错误、空结果和 pending 混成同一个布尔值，会让重试和统计都不可靠。</p>
<p>本例通过重建边界重试，会丢弃那份子树的局部状态。若里面有编辑草稿或用户操作，应该先决定是否需要保留、上提或确认，而不是让 fallback 顺便把用户内容清空。</p>
<h3>初次等待与后续更新有不同规则</h3>
<p>初次渲染会收集相应异步依赖。边界已经解决后，不是内部任何更深处的新 Promise 都会无条件重新触发整个边界；根节点替换等情况有具体规则，应根据实际组件结构判断。</p>
<p>常驻边界重新进入等待时，可以按 timeout 等规则暂时保留原来内容，再决定何时切换 fallback。这个 timeout 控制的是加载界面的显示时机，不是自动取消网络请求或把服务器任务标记为超时失败。</p>
<p>本例更换了整个边界的 key，所以属于新建尝试，不是在证明任意内部更新都会保留旧画面。边界身份与资源身份都要明确。</p>
<h3>嵌套、路由与缓存会影响谁负责等待</h3>
<p>默认内容与 fallback 需要遵守各自插槽的根结构要求。嵌套 Suspense 还要理解父边界是否参与子依赖，以及相关 suspensible 配置，不能把所有层都当成独立、互不影响的 loading 容器。</p>
<p>与 RouterView、KeepAlive、Transition 组合时，层级决定哪一层被缓存、过渡和替换。应采用框架支持的组织方式，并实际测试导航、返回、停用和错误重试，而不只是任意调整标签顺序直到某次渲染通过。</p>
<p>SSR 与 hydration 也有各自等待和输出协议，客户端延迟示例不能证明服务端流式输出已经配置完成。</p>
<h3>等待协调不等于资源自动终止</h3>
<p>组件切走后，底层网络或计时任务可能仍在运行。真实数据源应支持适当取消或忽略过期结果，错误处理也要避免旧任务影响新的页面。</p>
<p>本例通过禁用控制减少同一界面的并发重载，但这不是所有路由切换、外部更新或远端重试的完整方案。用可控制的异步任务验证成功、失败、快速切换和再次进入，才能确认边界管理的是正确那一次工作。</p>`};export{e as default};