var e={answerHtml:`<p>Vue 会把同一轮中的响应式状态变化先放进更新队列，再批量刷新组件。修改 <code>count</code> 后，<code>count.value</code> 立刻是新值，但依赖它的 DOM 节点还可能没有更新，所以立即读取元素文本、尺寸或焦点状态时，得到的可能仍是旧结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">count.<span class="hljs-property">value</span>++;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-comment">// 此时 Vue 对应的 DOM 更新已经完成</span>
</code></pre></div>
<p><code>nextTick</code> 等待的是 Vue 完成这一轮 DOM 刷新，不是等待浏览器把所有像素画完。它适合在列表更新后读取元素尺寸、设置焦点或滚动位置；图片加载、CSS 动画和下一帧绘制有各自的事件或调度 API，不能都用 <code>nextTick</code> 代替。</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { nextTick, ref } from &#x27;vue&#x27;;

const items = ref([]);
const firstItem = ref(null);

async function addItem() {
  items.value.push(&#x27;新的项目&#x27;);
  await nextTick();
  firstItem.value?.focus();
}
&lt;/script&gt;
</code></pre></div>
<p>如果 <code>firstItem</code> 位于 <code>v-if</code> 分支中，调用 <code>nextTick</code> 后还要确认条件仍然成立；如果中间发生了新的异步更新，旧任务也可能已经没有对应的元素。连续在循环中等待会增加调度开销，通常应先完成一批状态修改，再等待一次。服务端渲染时没有真实 DOM，读取元素的逻辑还必须放在客户端生命周期中。</p>`};export{e as default};