var e={answerHtml:`<p>Vue 把多次相关状态修改合并进更新队列，减少同一轮中重复渲染。于是会出现一个正常现象：count.value 已经是新值，但页面上的文字还保持上一轮结果。</p>
<p>nextTick 用于在状态修改之后等待 Vue 完成相应 DOM 刷新。它解决的是框架更新时序，不是给代码随机加一点延迟，让问题“碰巧消失”。</p>
<h3>同时观察状态与 DOM</h3>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { nextTick, ref } from &#x27;vue&#x27;;

const count = ref(0);
const counterElement = ref(null);
const before = ref(&#x27;尚未读取&#x27;);
const after = ref(&#x27;尚未读取&#x27;);
const editing = ref(false);
const editor = ref(null);

async function increment() {
  count.value += 1;
  before.value = \`状态 \${count.value}，DOM \${counterElement.value?.textContent}\`;
  await nextTick();
  after.value = \`状态 \${count.value}，DOM \${counterElement.value?.textContent}\`;
}

async function openEditor() {
  editing.value = true;
  await nextTick();
  if (editing.value) editor.value?.focus();
}
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;strong ref=&quot;counterElement&quot;&gt;{{ count }}&lt;/strong&gt;
    &lt;button type=&quot;button&quot; @click=&quot;increment&quot;&gt;增加&lt;/button&gt;
    &lt;p&gt;等待前：{{ before }}&lt;/p&gt;
    &lt;p&gt;等待后：{{ after }}&lt;/p&gt;
    &lt;button type=&quot;button&quot; @click=&quot;openEditor&quot;&gt;打开编辑框&lt;/button&gt;
    &lt;label v-if=&quot;editing&quot;&gt;草稿&lt;input ref=&quot;editor&quot; /&gt;&lt;/label&gt;
    &lt;button v-if=&quot;editing&quot; type=&quot;button&quot; @click=&quot;editing = false&quot;&gt;关闭编辑框&lt;/button&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>初始为 0 时点击增加，等待前会读到状态 1、DOM 0；等待后会读到状态 1、DOM 1。不是 ref.value 还没赋值，而是依赖它的 DOM 更新尚未提交。</p>
<p>打开编辑框时，editing 立即变为 true，但 v-if 对应的 input 还需要通过组件更新创建。等待后再读模板引用，才能对新元素调用 focus。可选链和条件检查也避免了条件已经改变或节点已消失时直接操作空引用。</p>
<h3>为什么要先修改，再等待</h3>
<p>正确顺序通常是先让相关状态改变，再 await nextTick，然后执行依赖新 DOM 的读取或操作。如果在状态还没改变时先等待一次，不能把这次等待当成之后所有更新的凭证。</p>
<p>没有待处理刷新时，nextTick 也会返回可等待的结果，但它不会替你发起本来不存在的 DOM 更新。若预期节点一直没有出现，应检查状态、条件分支和组件生命周期，而不是继续堆更多 nextTick。</p>
<p>连续完成一批同步修改后等待一次，往往就够了。在每次循环修改后都 await，可能强行把原本能合并的工作拆成多轮刷新，增加成本。</p>
<h3>nextTick 完成，不等于屏幕像素已经显示</h3>
<p>Vue 更新 DOM 后，浏览器仍要按自己的节奏处理样式、布局与绘制。nextTick 不承诺用户已经看见一帧画面，也不等待 CSS transition 或 animation 完成。</p>
<p>需要配合下一次视觉更新，可以根据用途使用 requestAnimationFrame；需要知道动画结束，应监听相应完成事件或使用动画 API。即使 rAF 回调运行，也不应无条件把它当成“屏幕已经绘制结束”的精确通知。</p>
<p>读取 getBoundingClientRect 等几何信息时，浏览器可能为回答读取而同步完成必要布局。这与已经完成屏幕绘制又是两种不同事实。</p>
<h3>图片、字体与网络有自己的完成条件</h3>
<p>列表节点已经插入，不代表里面的图片尺寸已经稳定；字体可能稍后加载并改变换行。对这些情况，应使用加载、解码、字体接口或 ResizeObserver 等相关机制，不能只等一次 nextTick 就认定以后尺寸不会再变。</p>
<p>网络请求也是一样。修改 loading 后等待 nextTick，可以观察对应 DOM 更新，但不会等待真正的请求完成。请求结果回来后若再次修改状态，又会产生新的刷新过程。</p>
<p>因此一个异步任务里“已经 await 过 nextTick”，不代表之后发生的所有 DOM 变化都已结束。</p>
<h3>侦听器读取 DOM 时，可以选择更合适的调度</h3>
<p>如果每次某个来源变化后都要读取所属组件更新后的 DOM，可以评估 watch 的 flush:&#x27;post&#x27; 或 watchPostEffect，让这个关系直接体现在侦听器调度上。</p>
<p>nextTick 更适合在某次明确操作后继续处理。两种方式都需要正确清理观察器、监听或后续任务，不应为了避免思考顺序就到处切换同步侦听。</p>
<h3>等待期间，原操作可能已经过期</h3>
<p>用户可能打开编辑框后马上切换页面，或多个请求在不同时间更新同一区域。等待结束时应确认组件仍有相应元素、任务仍是当前任务，而不是盲目对最初设想的节点操作。</p>
<p>服务端没有浏览器 DOM，相关测量和聚焦只应放在合适的客户端生命周期或交互中。nextTick 可以等待 Vue 的调度，但不会凭空在服务端生成可测量的元素。</p>
<p>把状态变化、Vue DOM 刷新、浏览器渲染和外部资源完成分别看待，通常就能解释为什么某处需要 nextTick，也能避免把它误用成所有异步问题的统一补丁。</p>`};export{e as default};